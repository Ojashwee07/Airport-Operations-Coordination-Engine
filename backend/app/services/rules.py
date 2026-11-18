"""Deterministic airport rules (features 2, 6). Thresholds are conservative demo values."""

WIND_CAUTION_KMH = 30
WIND_LIMIT_KMH = 45
VISIBILITY_CAUTION_M = 3000
VISIBILITY_LIMIT_M = 800
PRECIP_CAUTION_MM = 2.0
THUNDERSTORM_CODES = {95, 96, 99}  # WMO codes for thunderstorm


def weather_risk(weather: dict) -> tuple[float, list[str]]:
    risk = 0.0
    reasons: list[str] = []
    wind = weather.get("wind_kmh", 0.0)
    visibility = weather.get("visibility_m", 10000.0)
    precipitation = weather.get("precipitation_mm", 0.0)
    code = weather.get("weather_code", 0)

    if wind >= WIND_LIMIT_KMH:
        risk += 0.4
        reasons.append(f"Wind {wind:.0f} km/h is above the {WIND_LIMIT_KMH} km/h limit")
    elif wind >= WIND_CAUTION_KMH:
        risk += 0.2
        reasons.append(f"Wind {wind:.0f} km/h is in the caution band")

    if visibility <= VISIBILITY_LIMIT_M:
        risk += 0.4
        reasons.append(f"Visibility {visibility:.0f} m is below {VISIBILITY_LIMIT_M} m")
    elif visibility <= VISIBILITY_CAUTION_M:
        risk += 0.2
        reasons.append(f"Visibility {visibility:.0f} m is in the caution band")

    if code in THUNDERSTORM_CODES:
        risk += 0.4
        reasons.append("Thunderstorm reported in the airport area")
    elif precipitation >= PRECIP_CAUTION_MM:
        risk += 0.15
        reasons.append(f"Precipitation {precipitation:.1f} mm")

    return round(min(risk, 1.0), 2), reasons


def recommend_permission(weather_risk_score: float, runway_conflict: bool, gate_conflict: bool) -> str:
    """Grant / Hold / Delay. Advisory only; a duty officer makes the final call."""
    if gate_conflict or weather_risk_score >= 0.7:
        return "Delay"
    if runway_conflict or weather_risk_score >= 0.4:
        return "Hold"
    return "Grant"
