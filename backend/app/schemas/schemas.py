from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PermissionCreate(BaseModel):
    airport: str = Field(default="DEL", min_length=3, max_length=5)
    pilot_name: str = Field(min_length=2, max_length=120)
    call_sign: str = Field(min_length=2, max_length=30)
    aircraft_type: str = Field(min_length=2, max_length=80)
    request_type: Literal["Taxi clearance", "Takeoff", "Landing", "Pushback"]
    requested_at: str = Field(pattern=r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$")
    flight_number: str = Field(default="", max_length=20)
    runway: str = Field(default="", max_length=10)
    gate: str = Field(default="", max_length=10)
    notes: str = Field(default="", max_length=500)


class DecisionRequest(BaseModel):
    action: Literal["approve", "reject"]
    note: str = Field(default="", max_length=300)


class PermissionOut(BaseModel):
    id: int
    airport: str
    pilot_name: str
    call_sign: str
    aircraft_type: str
    request_type: str
    requested_at: str
    flight_number: str
    runway: str
    gate: str
    status: str
    recommendation: str
    risk_score: float
    reasons: list[str]
    suggested_runway: str
    notes: str
    decided_by: str
    decided_at: str | None
