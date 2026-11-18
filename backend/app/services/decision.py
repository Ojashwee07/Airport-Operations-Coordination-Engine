"""Takeoff / landing permission evaluation (feature 6). Advisory only; a human approves."""
from datetime import datetime

from app.services.rules import recommend_permission
from app.services.scheduler import GATE_TURNAROUND_MIN, minutes_between, parse_time, suggest_runway


def evaluate_request(
    *,
    airport: str,
    runway: str,
    gate: str,
    requested_at: str,
    flights: list[dict],
    runways: list[dict],
    weather: dict,
    separation_min: int,
) -> dict:
    at: datetime = parse_time(requested_at)
    reasons: list[str] = []
    same_airport = [f for f in flights if f["airport"] == airport]
    runway_list = [r for r in runways if r["airport"] == airport]

    runway_conflict = False
    suggested = ""
    if runway:
        runway_used = runway
        match = next((r for r in runway_list if r["identifier"] == runway), None)
        if match is None:
            runway_conflict = True
            reasons.append(f"Runway {runway} is not configured at {airport}")
        elif match["status"] != "Open":
            runway_conflict = True
            reasons.append(f"Runway {runway} is {match['status']}")
    else:
        suggested = suggest_runway(runway_list, same_airport, at, separation_min) or ""
        runway_used = suggested
        if suggested:
            reasons.append(f"Runway {suggested} auto-assigned: widest free separation window")
        else:
            runway_conflict = True
            reasons.append("No open runway has a free separation window at this time")

    if runway_used:
        for flight in same_airport:
            if flight["runway"] == runway_used:
                gap = minutes_between(parse_time(flight["scheduled_time"]), at)
                if gap < separation_min:
                    runway_conflict = True
                    reasons.append(
                        f"{gap:.0f} min from {flight['flight_number']} on runway {runway_used}; "
                        f"{separation_min} min separation required"
                    )

    gate_conflict = False
    if gate:
        for flight in same_airport:
            if flight["gate"] == gate:
                gap = minutes_between(parse_time(flight["scheduled_time"]), at)
                if gap < GATE_TURNAROUND_MIN:
                    gate_conflict = True
                    reasons.append(f"Gate {gate} is needed by {flight['flight_number']} {gap:.0f} min away")

    reasons.extend(weather["reasons"])
    recommendation = recommend_permission(weather["risk"], runway_conflict, gate_conflict)
    if not reasons:
        reasons.append("No runway, gate or weather conflicts found")
    risk_score = round(min(1.0, weather["risk"] + (0.3 if runway_conflict else 0) + (0.3 if gate_conflict else 0)), 2)

    return {
        "recommendation": recommendation,
        "risk_score": risk_score,
        "reasons": reasons,
        "runway": runway_used,
        "suggested_runway": suggested,
        "runway_conflict": runway_conflict,
        "gate_conflict": gate_conflict,
    }
