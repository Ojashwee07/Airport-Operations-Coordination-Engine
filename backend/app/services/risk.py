"""Predictive delay and risk scoring (feature 13).

Heuristic v1: transparent weighted score, no training data needed.
A scikit-learn model trained on BTS data can replace predict_delay later without changing callers.
"""

AIRLINE_BASE_DELAY = {"Air India": 0.22, "IndiGo": 0.18, "Vistara": 0.15, "Emirates": 0.12}


def predict_delay(flight: dict, weather_risk: float) -> dict:
    base = AIRLINE_BASE_DELAY.get(flight["airline"], 0.2)
    live_delay = min(flight.get("delay_minutes", 0) / 60, 0.4)
    status_bonus = 0.1 if flight.get("status") in {"At risk", "Delayed"} else 0.0
    probability = min(0.98, base + 0.5 * weather_risk + live_delay + status_bonus)
    expected_minutes = round(probability * 45 + flight.get("delay_minutes", 0) * 0.5)
    if probability >= 0.6:
        level = "High"
    elif probability >= 0.35:
        level = "Medium"
    else:
        level = "Low"
    return {
        "probability": round(probability, 2),
        "expected_delay_minutes": int(expected_minutes),
        "level": level,
        "method": "heuristic-v1",
    }
