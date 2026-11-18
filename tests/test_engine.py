import json
import threading
import unittest
import urllib.request

from airport_engine.db import Database
from airport_engine.orchestration import run_specialists
from airport_engine.server import make_handler
from http.server import ThreadingHTTPServer


class EngineTests(unittest.TestCase):
    def test_orchestration_is_deterministic(self):
        # Database connections are intentionally short-lived, so use a file for SQLite persistence.
        db = Database("test-engine.sqlite3")
        db.initialize()
        db.create_flight({"flight_number": "AO1", "airline": "A", "origin": "DEL", "destination": "BOM", "scheduled_departure": "2026-01-01T10:00:00Z", "gate": "A1"})
        incident = db.create_incident({"kind": "weather", "severity": "high", "title": "Storm at A1", "description": "Weather affects AO1 baggage"})
        a = run_specialists(incident, db.list_flights())
        b = run_specialists(incident, db.list_flights())
        self.assertEqual(a, b)
        self.assertTrue(any(x["owner"] == "Baggage Control" for x in a["actions"]))
        import os
        os.remove("test-engine.sqlite3")

    def test_database_round_trip(self):
        db = Database("test-engine.sqlite3")
        db.initialize()
        incident = db.create_incident({"kind": "gate", "severity": "critical", "title": "Gate closed", "description": "A gate is unavailable"})
        decision = db.save_decision(incident["id"], run_specialists(incident, []))
        self.assertEqual(db.list_decisions()[0]["id"], decision["id"])
        self.assertEqual(len(db.list_tasks()), len(decision["actions"]))
        import os
        os.remove("test-engine.sqlite3")

    def test_json_api(self):
        db = Database("test-engine.sqlite3")
        db.initialize()
        server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(db))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            base = f"http://127.0.0.1:{server.server_port}"
            req = urllib.request.Request(base + "/api/incidents", data=json.dumps({"kind":"gate","title":"Test","description":"Gate issue"}).encode(), headers={"Content-Type":"application/json"}, method="POST")
            with urllib.request.urlopen(req) as response:
                body = json.load(response)
            self.assertEqual(response.status, 201)
            self.assertTrue(body["decision"]["actions"])
            with urllib.request.urlopen(base + "/api/health") as response:
                self.assertTrue(json.load(response)["ok"])
        finally:
            server.shutdown()
            server.server_close()
            import os
            os.remove("test-engine.sqlite3")
