"""Weather adapter (feature 2). Open-Meteo is free and keyless; synthetic data is the offline fallback."""
import logging
import time
from datetime import datetime, timezone

import httpx

from app.core.config import settings
from app.services.airports import AIRPORTS

logger = logging.getLogger("aoce.weather")
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

SYNTHETIC_WEATHER = {
    "DEL": {"wind_kmh": 38.0, "visibility_m": 6000.0, "precipitation_mm": 4.5, "weather_code": 95},
    "BOM": {"wind_kmh": 32.0, "visibility_m": 9000.0, "precipitation_mm": 0.0, "weather_code": 3},
    "BLR": {"wind_kmh": 12.0, "visibility_m": 10000.0, "precipitation_mm": 0.0, "weather_code": 1},
    "DXB": {"wind_kmh": 18.0, "visibility_m": 10000.0, "precipitation_mm": 0.0, "weather_code": 0},
}

_cache: dict[str, tuple[float, dict]] = {}


def _fetch_live(code: str) -> dict:
    airport = AIRPORTS[code]
    params = {
        "latitude": airport["lat"],
        "longitude": airport["lon"],
        "current": "wind_speed_10m,precipitation,weather_code",
        "hourly": "visibility",
        "forecast_days": 1,
        "timezone": "auto",
    }
    last_error: Exception | None = None
    for attempt in range(2):  # retry once with a short backoff (feature 9)
        try:
            response = httpx.get(OPEN_METEO_URL, params=params, timeout=3.0)
            response.raise_for_status()
            body = response.json()
            current = body["current"]
            visibility = body.get("hourly", {}).get("visibility") or [10000]
            # Open-Meteo returns hourly visibility; the first value is used as a close approximation.
            return {
                "wind_kmh": float(current.get("wind_speed_10m", 0)),
                "visibility_m": float(visibility[0]),
                "precipitation_mm": float(current.get("precipitation", 0)),
                "weather_code": int(current.get("weather_code", 0)),
                "source": "open-meteo",
            }
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            last_error = exc
            time.sleep(0.5 * (attempt + 1))
    raise RuntimeError(str(last_error))


def get_weather(code: str) -> dict:
    if code not in AIRPORTS:
        raise KeyError(f"Unknown airport code: {code}")
    now = time.monotonic()
    cached = _cache.get(code)
    if cached and now - cached[0] < settings.weather_cache_seconds:
        return cached[1]

    data: dict | None = None
    if settings.use_live_weather:
        try:
            data = _fetch_live(code)
        except Exception as exc:  # fall back instead of breaking the dashboard
            logger.warning("Live weather failed for %s, using synthetic fallback: %s", code, exc)
    if data is None:
        data = {**SYNTHETIC_WEATHER[code], "source": "synthetic"}

    data = {**data, "airport": code, "fetched_at": datetime.now(timezone.utc).isoformat()}
    _cache[code] = (now, data)
    logger.info("Weather for %s loaded from %s", code, data["source"])
    return data
