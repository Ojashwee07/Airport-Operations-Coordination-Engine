from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./airport_ops.db"
    jwt_secret: str = "change-this-in-development"
    access_token_expire_minutes: int = 480
    demo_mode: bool = True
    # Live Open-Meteo calls are optional. Default is synthetic weather so the demo works offline.
    use_live_weather: bool = False
    weather_cache_seconds: int = 600
    runway_separation_minutes: int = 3
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
