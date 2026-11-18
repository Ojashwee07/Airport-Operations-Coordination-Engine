from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models import Alert, Flight, MemoryEntry, Resource, Runway, User
from app.services.demo_data import ALERTS, FLIGHTS, MEMORY_RULES, RESOURCES, RUNWAYS, USERS


def seed_database() -> None:
    """Idempotent: creates tables, users, and demo data only when missing."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for item in USERS:
            if not db.query(User).filter(User.email == item["email"]).first():
                db.add(User(
                    email=item["email"],
                    full_name=item["full_name"],
                    password_hash=hash_password(item["password"]),
                    role=item["role"],
                ))
        if not db.query(Flight).first():
            db.add_all([Flight(**item) for item in FLIGHTS])
            db.add_all([Runway(**item) for item in RUNWAYS])
            db.add_all([Resource(**item) for item in RESOURCES])
            db.add_all([Alert(**item) for item in ALERTS])
        if not db.query(MemoryEntry).first():
            db.add_all([MemoryEntry(**item) for item in MEMORY_RULES])
        db.commit()
    finally:
        db.close()
