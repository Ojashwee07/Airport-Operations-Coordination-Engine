from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="analyst")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Flight(Base):
    __tablename__ = "flights"
    id: Mapped[int] = mapped_column(primary_key=True)
    flight_number: Mapped[str] = mapped_column(String(20), index=True)
    airline: Mapped[str] = mapped_column(String(100))
    origin: Mapped[str] = mapped_column(String(10))
    destination: Mapped[str] = mapped_column(String(10))
    airport: Mapped[str] = mapped_column(String(10), default="DEL")
    scheduled_time: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(30), default="Scheduled")
    gate: Mapped[str] = mapped_column(String(10), default="")
    runway: Mapped[str] = mapped_column(String(10), default="")
    delay_minutes: Mapped[int] = mapped_column(Integer, default=0)
    risk_probability: Mapped[float] = mapped_column(Float, default=0.1)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    altitude_ft: Mapped[int] = mapped_column(Integer, default=0)
    data_source: Mapped[str] = mapped_column(String(40), default="synthetic")
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)


class Runway(Base):
    __tablename__ = "runways"
    id: Mapped[int] = mapped_column(primary_key=True)
    airport: Mapped[str] = mapped_column(String(10), index=True)
    identifier: Mapped[str] = mapped_column(String(10))
    length_m: Mapped[int] = mapped_column(Integer, default=3000)
    status: Mapped[str] = mapped_column(String(20), default="Open")
    capacity_per_day: Mapped[int] = mapped_column(Integer, default=12)


class Resource(Base):
    __tablename__ = "resources"
    id: Mapped[int] = mapped_column(primary_key=True)
    airport: Mapped[str] = mapped_column(String(10), default="DEL")
    resource_type: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(30), default="Available")
    location: Mapped[str] = mapped_column(String(100))


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    severity: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(50), default="rules")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)


class PermissionRequest(Base):
    __tablename__ = "permission_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    airport: Mapped[str] = mapped_column(String(10), default="DEL")
    pilot_name: Mapped[str] = mapped_column(String(120))
    call_sign: Mapped[str] = mapped_column(String(30))
    aircraft_type: Mapped[str] = mapped_column(String(80))
    request_type: Mapped[str] = mapped_column(String(80))
    requested_at: Mapped[str] = mapped_column(String(40))
    flight_number: Mapped[str] = mapped_column(String(20), default="")
    runway: Mapped[str] = mapped_column(String(10), default="")
    gate: Mapped[str] = mapped_column(String(10), default="")
    status: Mapped[str] = mapped_column(String(30), default="Pending")
    recommendation: Mapped[str] = mapped_column(String(30), default="Hold")
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    reasons: Mapped[str] = mapped_column(Text, default="[]")  # JSON list
    suggested_runway: Mapped[str] = mapped_column(String(10), default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    decided_by: Mapped[str] = mapped_column(String(255), default="")
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    actor: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(255))
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str] = mapped_column(String(80))
    details: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class MemoryEntry(Base):
    """Long-term agent memory: airport rules, disruptions and decisions (feature 8)."""
    __tablename__ = "memory_entries"
    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
