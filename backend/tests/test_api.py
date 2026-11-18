import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def login(client, email="ops@example.com", password="demo123"):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_login_rejects_bad_password(client):
    response = client.post("/api/auth/login", json={"email": "ops@example.com", "password": "wrong"})
    assert response.status_code == 401


def test_dashboard_contains_all_sections(client):
    data = client.get("/api/dashboard", headers=login(client)).json()
    for key in ["stats", "flights", "runways", "weather", "runway_conflicts", "gate_conflicts", "alerts", "workflow"]:
        assert key in data
    assert data["stats"]["total_flights"] == 4
    assert data["workflow"]["agents"][0]["name"] == "Research"


def test_runway_conflict_is_detected(client):
    headers = login(client)
    conflicts = client.get("/api/runways/schedule?airport=DEL", headers=headers).json()["conflicts"]
    assert any(c["resource"] == "10/28" for c in conflicts)


def test_flights_filter_by_status(client):
    flights = client.get("/api/flights?status=Delayed", headers=login(client)).json()
    assert [f["flight_number"] for f in flights] == ["EK-517"]


def test_permission_recommendation_and_approval_flow(client):
    headers = login(client, "duty@example.com")
    created = client.post("/api/permissions", headers=headers, json={
        "airport": "DEL", "pilot_name": "Test Pilot", "call_sign": "AI-999",
        "aircraft_type": "A320", "request_type": "Takeoff", "requested_at": "2026-10-13 18:30",
    })
    assert created.status_code == 200
    body = created.json()
    assert body["status"] == "Pending"
    assert body["recommendation"] in {"Grant", "Hold", "Delay"}
    assert body["reasons"]

    approved = client.post(f"/api/permissions/{body['id']}/decision", headers=headers, json={"action": "approve"})
    assert approved.json()["status"] == "Approved"
    again = client.post(f"/api/permissions/{body['id']}/decision", headers=headers, json={"action": "reject"})
    assert again.status_code == 409


def test_ground_staff_cannot_decide(client):
    headers = login(client, "ground@example.com")
    response = client.post("/api/permissions/1/decision", headers=headers, json={"action": "approve"})
    assert response.status_code == 403


def test_invalid_airport_rejected(client):
    response = client.get("/api/weather?airport=XXX", headers=login(client))
    assert response.status_code == 422


def test_workflow_run_stores_memory(client):
    headers = login(client, "analyst@example.com")
    result = client.post("/api/workflows/run", headers=headers)
    assert result.status_code == 200
    memory = client.get("/api/memory?query=delay risk", headers=headers).json()
    assert memory
