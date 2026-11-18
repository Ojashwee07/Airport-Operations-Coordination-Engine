"""Shared operational snapshot used by dashboard, flights, schedule and agents."""
from collections import Counter
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Alert, Flight, PermissionRequest, Resource, Runway
from app.services.rules import weather_risk
from app.services.risk import predict_delay
from app.services.scheduler import gate_conflicts, runway_conflicts, runway_utilization
from app.services.weather import get_weather


def _row_dict(row) -> dict:
    return {c.name: getattr(row, c.name) for c in row.__table__.columns}


def raw_flights(db: Session) -> list[dict]:
    return [_row_dict(f) for f in db.query(Flight).order_by(Flight.scheduled_time).all()]


def runway_rows(db: Session) -> list[dict]:
    return [_row_dict(r) for r in db.query(Runway).order_by(Runway.airport, Runway.identifier).all()]


def resource_rows(db: Session) -> list[dict]:
    return [_row_dict(r) for r in db.query(Resource).order_by(Resource.resource_type, Resource.name).all()]


def alert_rows(db: Session, include_resolved: bool = False) -> list[dict]:
    query = db.query(Alert)
    if not include_resolved:
        query = query.filter(Alert.resolved.is_(False))
    return [{**_row_dict(a), "created_at": a.created_at.isoformat()} for a in query.order_by(Alert.id).all()]


def load_weather(airports: list[str]) -> dict[str, dict]:
    result = {}
    for code in sorted(set(airports)):
        weather = get_weather(code)
        risk, reasons = weather_risk(weather)
        result[code] = {**weather, "risk": risk, "reasons": reasons}
    return result


def enrich_flights(flights: list[dict], weather: dict[str, dict]) -> list[dict]:
    enriched = []
    for flight in flights:
        wx_risk = weather.get(flight["airport"], {}).get("risk", 0.0)
        enriched.append({**flight, "weather_risk": wx_risk, "prediction": predict_delay(flight, wx_risk)})
    return enriched


def permission_out(row: PermissionRequest) -> dict:
    import json

    return {
        "id": row.id,
        "airport": row.airport,
        "pilot_name": row.pilot_name,
        "call_sign": row.call_sign,
        "aircraft_type": row.aircraft_type,
        "request_type": row.request_type,
        "requested_at": row.requested_at,
        "flight_number": row.flight_number,
        "runway": row.runway,
        "gate": row.gate,
        "status": row.status,
        "recommendation": row.recommendation,
        "risk_score": row.risk_score,
        "reasons": json.loads(row.reasons or "[]"),
        "suggested_runway": row.suggested_runway,
        "notes": row.notes,
        "decided_by": row.decided_by,
        "decided_at": row.decided_at.isoformat() if row.decided_at else None,
    }


def load_flights(db: Session, search: str = "", status: str = "", airport: str = "") -> list[dict]:
    flights = raw_flights(db)
    if search:
        flights = [f for f in flights if search.lower() in f["flight_number"].lower()]
    if status:
        flights = [f for f in flights if f["status"].lower() == status.lower()]
    if airport:
        flights = [f for f in flights if f["airport"] == airport]
    weather = load_weather({f["airport"] for f in raw_flights(db)})
    return enrich_flights(flights, weather)


def build_snapshot(db: Session) -> dict:
    all_raw = raw_flights(db)
    runways = runway_rows(db)
    airports = [f["airport"] for f in all_raw] + [r["airport"] for r in runways]
    weather = load_weather(airports)
    flights = enrich_flights(all_raw, weather)
    sep = settings.runway_separation_minutes

    levels = Counter(f["prediction"]["level"] for f in flights)
    pending = db.query(PermissionRequest).filter(PermissionRequest.status == "Pending").count()
    avg_prob = round(sum(f["prediction"]["probability"] for f in flights) / len(flights), 2) if flights else 0.0
    rw_conf = runway_conflicts(flights, sep)
    gt_conf = gate_conflicts(flights)

    return {
        "synthetic": True,
        "stats": {
            "total_flights": len(flights),
            "at_risk": levels["High"] + levels["Medium"],
            "high_risk": levels["High"],
            "delayed": sum(1 for f in flights if f["status"] == "Delayed"),
            "active_alerts": len(alert_rows(db)),
            "pending_approvals": pending,
            "runway_conflicts": len(rw_conf),
            "gate_conflicts": len(gt_conf),
            "avg_delay_probability": avg_prob,
        },
        "risk_distribution": {"High": levels["High"], "Medium": levels["Medium"], "Low": levels["Low"]},
        "flights": flights,
        "runways": runway_utilization(runways, flights),
        "weather": list(weather.values()),
        "runway_conflicts": rw_conf,
        "gate_conflicts": gt_conf,
        "alerts": alert_rows(db),
        "resources": resource_rows(db),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
