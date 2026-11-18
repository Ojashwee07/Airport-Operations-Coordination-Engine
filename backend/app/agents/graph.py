"""Multi-agent coordination (feature 7) using a LangGraph StateGraph.

Research -> Analysis -> Resources -> Decision. Every agent reads and writes shared state.
Output is non-binding; recommendations wait for human approval.
"""
from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from app.core.config import settings
from app.services.scheduler import gate_conflicts, runway_conflicts


class OpsState(TypedDict, total=False):
    flights: list[dict]
    runways: list[dict]
    weather: dict[str, dict]
    at_risk: list[dict]
    conflicts: list[dict]
    recommendations: list[dict]
    summary: str
    history: list[str]


def research_agent(state: OpsState) -> dict:
    message = (
        f"Research agent loaded {len(state.get('flights', []))} flights, "
        f"{len(state.get('weather', {}))} airport weather feeds and {len(state.get('runways', []))} runways."
    )
    return {"history": [*state.get("history", []), message]}


def analysis_agent(state: OpsState) -> dict:
    at_risk = []
    for flight in state.get("flights", []):
        prediction = flight["prediction"]
        if prediction["level"] in ("High", "Medium"):
            at_risk.append({
                "flight_number": flight["flight_number"],
                "level": prediction["level"],
                "probability": prediction["probability"],
                "expected_delay_minutes": prediction["expected_delay_minutes"],
                "airport": flight["airport"],
            })
    at_risk.sort(key=lambda item: -item["probability"])
    message = f"Analysis agent scored delay risk: {len(at_risk)} flights at risk."
    return {"at_risk": at_risk, "history": [*state.get("history", []), message]}


def resource_agent(state: OpsState) -> dict:
    flights = state.get("flights", [])
    conflicts = runway_conflicts(flights, settings.runway_separation_minutes) + gate_conflicts(flights)
    message = f"Resource agent checked runway separation and gate turnarounds: {len(conflicts)} conflicts."
    return {"conflicts": conflicts, "history": [*state.get("history", []), message]}


def decision_agent(state: OpsState) -> dict:
    recommendations = []
    for item in state.get("at_risk", []):
        action = (
            "Escalate to duty officer; prepare alternate runway and gate"
            if item["level"] == "High"
            else "Monitor closely; keep an alternate slot ready"
        )
        recommendations.append({"flight_number": item["flight_number"], "level": item["level"], "action": action})
    for conflict in state.get("conflicts", []):
        recommendations.append({
            "flight_number": ", ".join(conflict["flights"]),
            "level": "High",
            "action": f"Resolve {conflict['type'].replace('_', ' ')} conflict on {conflict['resource']}",
        })
    summary = (
        f"{len(state.get('at_risk', []))} flights at risk and {len(state.get('conflicts', []))} conflicts. "
        "All recommendations are non-binding and await human approval."
    )
    return {
        "recommendations": recommendations,
        "summary": summary,
        "history": [*state.get("history", []), "Decision agent prepared non-binding recommendations."],
    }


def _build_graph():
    graph = StateGraph(OpsState)
    graph.add_node("research", research_agent)
    graph.add_node("analysis", analysis_agent)
    graph.add_node("resources", resource_agent)
    graph.add_node("decision", decision_agent)
    graph.add_edge(START, "research")
    graph.add_edge("research", "analysis")
    graph.add_edge("analysis", "resources")
    graph.add_edge("resources", "decision")
    graph.add_edge("decision", END)
    return graph.compile()


_GRAPH = _build_graph()


def run_ops_workflow(snapshot: dict) -> dict:
    state = _GRAPH.invoke({
        "flights": snapshot["flights"],
        "runways": snapshot["runways"],
        "weather": {w["airport"]: w for w in snapshot["weather"]},
        "history": [],
    })
    agents = [
        {"name": "Research", "status": "Complete"},
        {"name": "Analysis", "status": "Complete"},
        {"name": "Resource", "status": "Complete" if not state.get("conflicts") else "Conflicts found"},
        {"name": "Decision", "status": "Awaiting approval" if state.get("recommendations") else "Monitoring"},
    ]
    return {
        "summary": state["summary"],
        "at_risk": state["at_risk"],
        "conflicts": state["conflicts"],
        "recommendations": state["recommendations"],
        "trace": state["history"],
        "agents": agents,
    }
