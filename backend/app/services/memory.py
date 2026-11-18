"""Long-term memory for the agents (feature 8). Keyword-overlap recall keeps it dependency-free."""
import re

from sqlalchemy.orm import Session

from app.models import MemoryEntry


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def memory_dict(entry: MemoryEntry) -> dict:
    return {
        "id": entry.id,
        "kind": entry.kind,
        "title": entry.title,
        "content": entry.content,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
    }


def remember(db: Session, kind: str, title: str, content: str) -> MemoryEntry:
    entry = MemoryEntry(kind=kind, title=title[:255], content=content)
    db.add(entry)
    return entry


def recall(db: Session, query: str = "", limit: int = 5) -> list[dict]:
    rows = db.query(MemoryEntry).order_by(MemoryEntry.id.desc()).all()
    tokens = _tokens(query)
    if not tokens:
        return [memory_dict(r) for r in rows[:limit]]
    scored = []
    for row in rows:
        score = len(tokens & _tokens(f"{row.title} {row.content}"))
        if score:
            scored.append((score, row))
    scored.sort(key=lambda item: -item[0])
    return [memory_dict(row) for _, row in scored[:limit]]
