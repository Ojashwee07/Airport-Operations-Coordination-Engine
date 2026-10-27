import sqlite3
from pathlib import Path

from db import DB_PATH

SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def initialize_database():
    conn = sqlite3.connect(DB_PATH)

    try:
        conn.execute("PRAGMA foreign_keys = ON")
        schema = SCHEMA_PATH.read_text(encoding="utf-8")
        conn.executescript(schema)
        conn.commit()
        print("Database and tables created successfully!")

    finally:
        conn.close()


if __name__ == "__main__":
    initialize_database()
