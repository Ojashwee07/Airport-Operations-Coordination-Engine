import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent / "database" / "airport_operations.db"

conn = sqlite3.connect(db_path)

tables = conn.execute(
    "SELECT name FROM sqlite_master "
    "WHERE type = 'table' ORDER BY name"
).fetchall()

print("Tables in database:")
for table in tables:
    print("-", table[0])

conn.close()