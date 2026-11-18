import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.agents.graph import run_ops_workflow
from app.api.deps import current_user, require
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models import Alert, AuditLog, PermissionRequest, Resource, User
from app.schemas.schemas import DecisionRequest, LoginRequest, PermissionCreate, PermissionOut, TokenResponse, UserOut
from app.models.models import utcnow
from app.services.airports import AIRPORTS
from app.services.decision import evaluate_request
from app.services.memory import memory_dict, recall, remember
from app.services.ops import (
    alert_rows, build_snapshot, load_flights, load_weather, permission_out, resource_rows, runway_rows,
)
from app.services.scheduler import free_gates, gate_conflicts, parse_time, runway_conflicts, runway_schedule
from app.services.weather import get_weather

router = APIRouter(prefix="/api")


def audit(db: Session, actor: str, action: str, entity_type: str, entity_id: str, details: str = "") -> None:
    db.add(AuditLog(actor=actor, action=action, entity_type=entity_type, entity_id=entity_id, details=details))


# ---------- Auth ----------

@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": create_access_token(user.email), "user": user}


@router.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


# ---------- Dashboard & monitoring (features 1, 10) ----------

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(require("view"))):
    snapshot = build_snapshot(db)
    workflow = run_ops_workflow(snapshot)
    return {**snapshot, "workflow": workflow}


@router.get("/flights")
def flights(
    search: str = Query("", max_length=50),
    status: str = Query("", max_length=30),
    airport: str = Query("", max_length=5),
    db: Session = Depends(get_db),
    user: User = Depends(require("view")),
):
    return load_flights(db, search=search, status=status, airport=airport)


@router.get("/flights/{flight_id}")
def flight_detail(flight_id: int, db: Session = Depends(get_db), user: User = Depends(require("view"))):
    match = next((f for f in load_flights(db) if f["id"] == flight_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Flight not found")
    return match


# ---------- Weather (feature 2) ----------

@router.get("/weather")
def weather(airport: str = Query("", max_length=5), db: Session = Depends(get_db), user: User = Depends(require("view"))):
    if airport and airport not in AIRPORTS:
        raise HTTPException(status_code=422, detail="Unknown airport code")
    codes = [airport] if airport else sorted({r["airport"] for r in runway_rows(db)})
    return list(load_weather(codes).values())


# ---------- Runways & gates (features 3, 4) ----------

@router.get("/runways")
def runways(db: Session = Depends(get_db), user: User = Depends(require("view"))):
    snapshot = build_snapshot(db)
    return snapshot["runways"]


@router.get("/runways/schedule")
def schedule(airport: str = Query("DEL", max_length=5), db: Session = Depends(get_db), user: User = Depends(require("view"))):
    if airport not in AIRPORTS:
        raise HTTPException(status_code=422, detail="Unknown airport code")
    flights = load_flights(db, airport=airport)
    conflicts = runway_conflicts(flights, settings.runway_separation_minutes)
    return {"airport": airport, "runways": runway_schedule(flights, airport), "conflicts": conflicts}


@router.get("/gates")
def gates(
    airport: str = Query("DEL", max_length=5),
    at: str = Query("", max_length=20),
    db: Session = Depends(get_db),
    user: User = Depends(require("view")),
):
    flights = load_flights(db)
    moment = datetime.now().replace(second=0, microsecond=0)
    if at:
        try:
            moment = parse_time(at)
        except ValueError:
            raise HTTPException(status_code=422, detail="Use format YYYY-MM-DD HH:MM")
    resources = resource_rows(db)
    return {
        "conflicts": gate_conflicts(flights),
        "free_gates": free_gates(resources, flights, airport, moment),
        "checked_at": moment.strftime("%Y-%m-%d %H:%M"),
    }


# ---------- Staff & crew (feature 5) ----------

@router.get("/resources")
def resources(
    type: str = Query("", max_length=30),
    airport: str = Query("", max_length=5),
    db: Session = Depends(get_db),
    user: User = Depends(require("view")),
):
    items = resource_rows(db)
    if type:
        items = [r for r in items if r["resource_type"].lower() == type.lower()]
    if airport:
        items = [r for r in items if r["airport"] == airport]
    return items


@router.get("/resources/summary")
def resources_summary(db: Session = Depends(get_db), user: User = Depends(require("view"))):
    available_statuses = {"Available", "On duty", "Standby"}
    summary: dict[str, dict] = {}
    for item in resource_rows(db):
        bucket = summary.setdefault(item["resource_type"], {"total": 0, "available": 0})
        bucket["total"] += 1
        bucket["available"] += item["status"] in available_statuses
    return summary


# ---------- Alerts ----------

@router.get("/alerts")
def alerts(include_resolved: bool = False, db: Session = Depends(get_db), user: User = Depends(require("view"))):
    return alert_rows(db, include_resolved=include_resolved)


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db), user: User = Depends(require("decide"))):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    audit(db, user.email, "Resolved alert", "alert", str(alert_id), alert.title)
    db.commit()
    return {"ok": True}


# ---------- Permissions / human approval (features 6, 12) ----------

@router.get("/permissions", response_model=list[PermissionOut])
def permissions(db: Session = Depends(get_db), user: User = Depends(require("view"))):
    return [permission_out(p) for p in db.query(PermissionRequest).order_by(PermissionRequest.id.desc()).all()]


@router.post("/permissions", response_model=PermissionOut)
def create_permission(payload: PermissionCreate, db: Session = Depends(get_db), user: User = Depends(require("request"))):
    if payload.airport not in AIRPORTS:
        raise HTTPException(status_code=422, detail="Unknown airport code")
    try:
        parse_time(payload.requested_at)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid requested_at date or time")

    flights = load_flights(db)
    result = evaluate_request(
        airport=payload.airport,
        runway=payload.runway,
        gate=payload.gate,
        requested_at=payload.requested_at,
        flights=flights,
        runways=runway_rows(db),
        weather=load_weather([payload.airport])[payload.airport],
        separation_min=settings.runway_separation_minutes,
    )
    row = PermissionRequest(
        airport=payload.airport,
        pilot_name=payload.pilot_name,
        call_sign=payload.call_sign,
        aircraft_type=payload.aircraft_type,
        request_type=payload.request_type,
        requested_at=payload.requested_at,
        flight_number=payload.flight_number,
        runway=result["runway"],
        gate=payload.gate,
        status="Pending",
        recommendation=result["recommendation"],
        risk_score=result["risk_score"],
        reasons=json.dumps(result["reasons"]),
        suggested_runway=result["suggested_runway"],
        notes=payload.notes,
    )
    db.add(row)
    db.flush()
    audit(db, user.email, "Created permission request", "permission", str(row.id),
          f"{payload.call_sign} {payload.request_type} -> {result['recommendation']}")
    db.commit()
    db.refresh(row)
    return permission_out(row)


@router.post("/permissions/{request_id}/decision", response_model=PermissionOut)
def decide_permission(request_id: int, payload: DecisionRequest, db: Session = Depends(get_db), user: User = Depends(require("decide"))):
    row = db.get(PermissionRequest, request_id)
    if not row:
        raise HTTPException(status_code=404, detail="Permission request not found")
    if row.status != "Pending":
        raise HTTPException(status_code=409, detail=f"Request already {row.status.lower()}")
    row.status = "Approved" if payload.action == "approve" else "Rejected"
    row.decided_by = user.email
    row.decided_at = utcnow()
    audit(db, user.email, f"Permission {payload.action}d", "permission", str(request_id),
          f"Recommendation was {row.recommendation}. {payload.note}".strip())
    db.commit()
    db.refresh(row)
    return permission_out(row)


# ---------- Agents & workflows (features 7, 11) ----------

@router.get("/agents")
def agents(db: Session = Depends(get_db), user: User = Depends(require("view"))):
    return run_ops_workflow(build_snapshot(db))


@router.post("/workflows/run")
def run_workflow(db: Session = Depends(get_db), user: User = Depends(require("request"))):
    snapshot = build_snapshot(db)
    result = run_ops_workflow(snapshot)
    for item in result["at_risk"]:
        remember(db, "disruption", f"{item['flight_number']} {item['level']} delay risk",
                 f"Probability {item['probability']}, expected delay {item['expected_delay_minutes']} min at {item['airport']}.")
    audit(db, user.email, "Ran agent workflow", "workflow", "ops", result["summary"])
    db.commit()
    return result


# ---------- Memory (feature 8) ----------

@router.get("/memory")
def memory(query: str = Query("", max_length=200), limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db), user: User = Depends(require("view"))):
    return recall(db, query=query, limit=limit)


# ---------- Audit (feature 12) ----------

@router.get("/audit-logs")
def audit_logs(limit: int = Query(50, ge=1, le=200), entity_type: str = Query("", max_length=80), db: Session = Depends(get_db), user: User = Depends(require("view"))):
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    rows = query.order_by(AuditLog.id.desc()).limit(limit).all()
    return [
        {"id": r.id, "actor": r.actor, "action": r.action, "entity_type": r.entity_type,
         "entity_id": r.entity_id, "details": r.details, "created_at": r.created_at.isoformat()}
        for r in rows
    ]
