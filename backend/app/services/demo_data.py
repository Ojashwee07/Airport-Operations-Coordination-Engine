from datetime import datetime, timezone

USERS = [
    {"email": "ops@example.com", "full_name": "Airport Operations Lead", "password": "demo123", "role": "operations_admin"},
    {"email": "manager@example.com", "full_name": "Duty Manager", "password": "demo123", "role": "manager"},
    {"email": "duty@example.com", "full_name": "Duty Officer", "password": "demo123", "role": "duty_officer"},
    {"email": "analyst@example.com", "full_name": "Ops Analyst", "password": "demo123", "role": "analyst"},
    {"email": "ground@example.com", "full_name": "Ground Staff Supervisor", "password": "demo123", "role": "ground_staff"},
]

FLIGHTS = [
    {"flight_number": "AI-202", "airline": "Air India", "origin": "DEL", "destination": "BOM", "airport": "DEL",
     "scheduled_time": "2026-10-13 18:10", "status": "Boarding", "gate": "A12", "runway": "10/28",
     "delay_minutes": 0, "risk_probability": 0.18, "lat": 28.56, "lon": 77.10, "altitude_ft": 0},
    {"flight_number": "6E-641", "airline": "IndiGo", "origin": "BLR", "destination": "DEL", "airport": "DEL",
     "scheduled_time": "2026-10-13 18:12", "status": "At risk", "gate": "B04", "runway": "10/28",
     "delay_minutes": 25, "risk_probability": 0.72, "lat": 21.40, "lon": 77.35, "altitude_ft": 18000},
    {"flight_number": "UK-955", "airline": "Vistara", "origin": "BOM", "destination": "DXB", "airport": "BOM",
     "scheduled_time": "2026-10-13 19:05", "status": "Scheduled", "gate": "C02", "runway": "09/27",
     "delay_minutes": 0, "risk_probability": 0.31, "lat": 19.09, "lon": 72.87, "altitude_ft": 0},
    {"flight_number": "EK-517", "airline": "Emirates", "origin": "DXB", "destination": "DEL", "airport": "DEL",
     "scheduled_time": "2026-10-13 19:40", "status": "Delayed", "gate": "A03", "runway": "09/27",
     "delay_minutes": 42, "risk_probability": 0.91, "lat": 23.90, "lon": 62.40, "altitude_ft": 34000},
]

RUNWAYS = [
    {"airport": "DEL", "identifier": "10/28", "length_m": 3810, "status": "Open", "capacity_per_day": 12},
    {"airport": "DEL", "identifier": "09/27", "length_m": 4430, "status": "Open", "capacity_per_day": 12},
    {"airport": "BOM", "identifier": "09/27", "length_m": 3660, "status": "Open", "capacity_per_day": 12},
]

RESOURCES = [
    {"airport": "DEL", "resource_type": "Gate", "name": "Gate A12", "status": "Occupied", "location": "Terminal 1"},
    {"airport": "DEL", "resource_type": "Gate", "name": "Gate B04", "status": "Reserved", "location": "Terminal 1"},
    {"airport": "DEL", "resource_type": "Gate", "name": "Gate A03", "status": "Occupied", "location": "Terminal 1"},
    {"airport": "DEL", "resource_type": "Gate", "name": "Gate B07", "status": "Available", "location": "Terminal 1"},
    {"airport": "DEL", "resource_type": "Gate", "name": "Gate C05", "status": "Available", "location": "Terminal 2"},
    {"airport": "DEL", "resource_type": "Gate", "name": "Gate D01", "status": "Maintenance", "location": "Terminal 2"},
    {"airport": "BOM", "resource_type": "Gate", "name": "Gate C02", "status": "Reserved", "location": "Terminal 2"},
    {"airport": "BOM", "resource_type": "Gate", "name": "Gate C06", "status": "Available", "location": "Terminal 2"},
    {"airport": "DEL", "resource_type": "Staff", "name": "Ramp Team Alpha", "status": "Assigned", "location": "Apron East"},
    {"airport": "DEL", "resource_type": "Staff", "name": "Ramp Team Bravo", "status": "Standby", "location": "Apron West"},
    {"airport": "DEL", "resource_type": "Staff", "name": "Ground Handling Crew 2", "status": "Available", "location": "Terminal 1"},
    {"airport": "DEL", "resource_type": "Staff", "name": "Security Team North", "status": "Available", "location": "Checkpoint N"},
    {"airport": "DEL", "resource_type": "Crew", "name": "Flight Crew 6E-641", "status": "On duty", "location": "Crew Centre"},
    {"airport": "DEL", "resource_type": "Crew", "name": "Flight Crew EK-517", "status": "Standby", "location": "Crew Centre"},
    {"airport": "BOM", "resource_type": "Crew", "name": "Flight Crew UK-955", "status": "Standby", "location": "Crew Centre"},
]

ALERTS = [
    {"severity": "High", "title": "Thunderstorm cell near DEL", "message": "Weather adapter reports a thunderstorm code and 38 km/h wind. Review runway sequencing.", "source": "Open-Meteo / rules"},
    {"severity": "High", "title": "Runway separation conflict on 10/28", "message": "AI-202 and 6E-641 are 2 minutes apart; 3 minutes separation is required.", "source": "Runway scheduler"},
    {"severity": "Medium", "title": "Gate B04 turnaround window", "message": "Gate B04 has 6E-641 arriving while a reserved slot is pending.", "source": "Gate allocation"},
    {"severity": "Low", "title": "Runway slot utilization rising", "message": "Projected utilization is 82% for the 19:00-20:00 window.", "source": "Analysis agent"},
]

MEMORY_RULES = [
    {"kind": "rule", "title": "Wind limits", "content": "Takeoffs and landings are suspended when wind exceeds 45 km/h; caution starts at 30 km/h."},
    {"kind": "rule", "title": "Visibility limits", "content": "Visibility at or below 800 m requires a Delay; below 3000 m triggers caution."},
    {"kind": "rule", "title": "Runway separation", "content": "Minimum 3 minutes between movements on the same runway."},
    {"kind": "rule", "title": "Gate turnaround", "content": "45 minute minimum gate turnaround before another flight can use the gate."},
    {"kind": "rule", "title": "Human approval", "content": "Every permission recommendation stays Pending until a duty officer approves or rejects it."},
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
