# Airport Operations Coordination Engine (AOCE)

A demo control room for airport operations: flight monitoring, weather disruption handling,
runway and gate planning, staff and crew visibility, takeoff/landing permission workflow,
multi-agent coordination, memory, RBAC and audit logging.

> Synthetic data only. Advisory tool. Not for real air traffic control.

## Feature coverage (from the Feasible Feature Plan)

| # | Feature | Where it lives |
|---|---------|----------------|
| 1 | Flight data & status monitoring | `services/ops.py`, `GET /api/flights`, Flight monitor page, map on dashboard |
| 2 | Weather disruption handling | `services/weather.py` (Open-Meteo optional, synthetic fallback), `services/rules.py`, `GET /api/weather` |
| 3 | Runway scheduling & conflict analysis | `services/scheduler.py`, `GET /api/runways/schedule`, Runways & gates page |
| 4 | Gate allocation & conflict detection | `services/scheduler.py`, `GET /api/gates`, Runways & gates page |
| 5 | Staff & crew resource management | `GET /api/resources`, `GET /api/resources/summary`, Staff & crew page |
| 6 | Takeoff & landing permission request | `services/decision.py`, `POST /api/permissions`, Approval center |
| 7 | Multi-agent coordination | `agents/graph.py` (LangGraph: Research, Analysis, Resource, Decision), `GET /api/agents` |
| 8 | Memory management | `models.MemoryEntry`, `services/memory.py`, `GET/POST /api/memory`, Agent memory panel |
| 9 | Tool validation & error handling | Pydantic validation, retry + fallback in `weather.py`, global error handler in `main.py`, logging |
| 10 | Operations dashboard | `pages/Dashboard.jsx`, Recharts + react-leaflet (OpenStreetMap tiles) |
| 11 | REST API | `api/routes.py` (FastAPI, interactive docs at `/docs`) |
| 12 | Human approval & audit log | Requests stay `Pending` until approve/reject, `AuditLog` on every action, Audit trail page |
| 13 | Predictive delay & risk scoring | `services/risk.py` (transparent heuristic-v1; swap for a scikit-learn model later) |
| 14 | Role-based access & approval workflow | `core/security.py` (`ROLE_PERMISSIONS`), `api/deps.py` (`require`), seeded demo users |

Design choices for "free resources only": OpenSky, AviationStack and BTS are not called (they need keys or large
downloads). Positions and history are synthetic and stored in SQLite. Open-Meteo is keyless and used only when
`USE_LIVE_WEATHER=true`.

## Roles

| Role | View | Submit requests | Approve / reject | Admin |
|------|:---:|:---:|:---:|:---:|
| operations_admin | yes | yes | yes | yes |
| manager | yes | no | yes | no |
| duty_officer | yes | yes | yes | no |
| analyst | yes | yes | no | no |
| ground_staff | yes | no | no | no |

Demo accounts (password `demo123`): `ops@example.com`, `manager@example.com`, `duty@example.com`,
`analyst@example.com`, `ground@example.com`.

## Run locally

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # optional
uvicorn app.main:app --reload --port 8000
```
Open http://localhost:8000/docs for the API. Demo data is seeded automatically on first start.

**Upgrading from v1:** delete the old `airport_ops.db` file once, because new columns were added.
Demo data is recreated on the next start.

To enable live Open-Meteo weather, set `USE_LIVE_WEATHER=true` in `backend/.env`.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173 and sign in with `ops@example.com` / `demo123`.

### Tests
```bash
cd backend
pytest -q
```

## Project layout
```
backend/
  app/
    api/        routes.py (REST), deps.py (auth + RBAC)
    agents/     graph.py (LangGraph multi-agent workflow)
    core/       config.py, security.py (JWT, password hashing, role permissions)
    models/     SQLAlchemy models
    schemas/    Pydantic request/response models
    services/   weather, rules, scheduler, risk, decision, memory, ops snapshot, seed data
  tests/        pytest API tests
frontend/
  src/
    components/ Layout, StatCard, Panel, Badge, FlightMap
    pages/      Dashboard, Flights, Schedule, Approvals, Resources, Agents, Audit, Login
    lib/        api client with auth + role helpers, formatting
docs/           architecture notes
```
