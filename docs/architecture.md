# Architecture notes

The current implementation keeps the critical operational path deterministic:

1. FastAPI validates and authenticates the operator.
2. SQLAlchemy persists flights, resources, alerts, permission requests, and audit events.
3. Rule services calculate risk bands and approval recommendations.
4. LangGraph coordinates research, analysis, resource, and decision nodes.
5. The React client renders recommendations as non-binding until an authorized operator records Grant, Hold, or Delay.

Adapters for external providers should be added behind service interfaces and should preserve the `synthetic` provenance flag when a provider is unavailable.
