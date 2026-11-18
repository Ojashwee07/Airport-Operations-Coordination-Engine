import os
import tempfile

# Use an isolated SQLite file and offline weather before the app is imported.
_db_file = os.path.join(tempfile.mkdtemp(), "test_ops.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db_file}"
os.environ["USE_LIVE_WEATHER"] = "false"
