"""Runway scheduling and gate allocation (features 3, 4)."""
from collections import defaultdict
from datetime import datetime

GATE_TURNAROUND_MIN = 45
DEFAULT_DAILY_SLOTS = 12


def parse_time(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d %H:%M")


def minutes_between(a: datetime, b: datetime) -> float:
    return abs((a - b).total_seconds()) / 60


def runway_conflicts(flights: list[dict], separation_min: int) -> list[dict]:
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for flight in flights:
        if flight.get("runway"):
            grouped[(flight["airport"], flight["runway"])].append(flight)

    conflicts = []
    for (airport, runway), items in grouped.items():
        items.sort(key=lambda f: parse_time(f["scheduled_time"]))
        for first, second in zip(items, items[1:]):
            gap = minutes_between(parse_time(first["scheduled_time"]), parse_time(second["scheduled_time"]))
            if gap < separation_min:
                conflicts.append({
                    "type": "runway_separation",
                    "airport": airport,
                    "resource": runway,
                    "flights": [first["flight_number"], second["flight_number"]],
                    "gap_minutes": round(gap, 1),
                    "required_minutes": separation_min,
                })
    return conflicts


def gate_conflicts(flights: list[dict]) -> list[dict]:
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for flight in flights:
        if flight.get("gate"):
            grouped[(flight["airport"], flight["gate"])].append(flight)

    conflicts = []
    for (airport, gate), items in grouped.items():
        items.sort(key=lambda f: parse_time(f["scheduled_time"]))
        for first, second in zip(items, items[1:]):
            gap = minutes_between(parse_time(first["scheduled_time"]), parse_time(second["scheduled_time"]))
            if gap < GATE_TURNAROUND_MIN:
                conflicts.append({
                    "type": "gate",
                    "airport": airport,
                    "resource": gate,
                    "flights": [first["flight_number"], second["flight_number"]],
                    "gap_minutes": round(gap, 1),
                    "required_minutes": GATE_TURNAROUND_MIN,
                })
    return conflicts


def runway_schedule(flights: list[dict], airport: str) -> dict[str, list[dict]]:
    schedule: dict[str, list[dict]] = defaultdict(list)
    for flight in sorted(flights, key=lambda f: f["scheduled_time"]):
        if flight["airport"] == airport and flight.get("runway"):
            schedule[flight["runway"]].append({
                "flight_number": flight["flight_number"],
                "scheduled_time": flight["scheduled_time"],
                "status": flight["status"],
            })
    return dict(schedule)


def runway_utilization(runways: list[dict], flights: list[dict]) -> list[dict]:
    result = []
    for runway in runways:
        count = sum(1 for f in flights if f["airport"] == runway["airport"] and f["runway"] == runway["identifier"])
        capacity = runway.get("capacity_per_day") or DEFAULT_DAILY_SLOTS
        result.append({**runway, "flight_count": count, "utilization_pct": min(100, round(count * 100 / capacity))})
    return result


def suggest_runway(runway_list: list[dict], flights: list[dict], at: datetime, separation_min: int) -> str | None:
    best, best_gap = None, -1.0
    for runway in runway_list:
        if runway["status"] != "Open":
            continue
        gaps = [minutes_between(parse_time(f["scheduled_time"]), at) for f in flights if f["runway"] == runway["identifier"]]
        min_gap = min(gaps) if gaps else 999.0
        if min_gap >= separation_min and min_gap > best_gap:
            best, best_gap = runway["identifier"], min_gap
    return best


def free_gates(resources: list[dict], flights: list[dict], airport: str, at: datetime) -> list[str]:
    free = []
    for resource in resources:
        if resource["resource_type"] != "Gate" or resource["airport"] != airport or resource["status"] == "Maintenance":
            continue
        code = resource["name"].replace("Gate ", "").strip()
        busy = any(
            f["airport"] == airport and f["gate"] == code and minutes_between(parse_time(f["scheduled_time"]), at) < GATE_TURNAROUND_MIN
            for f in flights
        )
        if not busy:
            free.append(code)
    return free
