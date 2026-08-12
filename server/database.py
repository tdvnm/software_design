import os
import sqlite3
from pathlib import Path

SCHEMA = Path(__file__).with_name("schema.sql")
DEFAULT_PATH = Path(__file__).resolve().parent.parent / "data" / "tracey.sqlite"


def open_database(path=None):
    path = path or os.environ.get("TRACEY_DB") or str(DEFAULT_PATH)
    if path != ":memory:":
        Path(path).parent.mkdir(parents=True, exist_ok=True)
    # isolation_level=None: every statement commits on its own, so a write
    # is on disk as soon as it runs. Multi-statement work uses BEGIN/COMMIT.
    db = sqlite3.connect(path, isolation_level=None, check_same_thread=False)
    db.row_factory = sqlite3.Row
    try:
        version = db.execute("PRAGMA user_version").fetchone()[0]
        if version > 1:
            raise RuntimeError("This database uses a newer schema than this app.")
        db.executescript(SCHEMA.read_text(encoding="utf-8"))
        # Foreign keys are per-connection in SQLite; the PRAGMA in the script
        # runs, but set it again here so it can never be skipped.
        db.execute("PRAGMA foreign_keys = ON")
        return db
    except Exception:
        db.close()
        raise
