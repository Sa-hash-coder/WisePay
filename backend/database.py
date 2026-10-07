import os
import sys
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from core.config import DATABASE_URL, is_sqlite
except ImportError:
    try:
        from backend.core.config import DATABASE_URL, is_sqlite
    except ImportError:
        DATABASE_URL = os.getenv(
            "DATABASE_URL",
            "sqlite:///./wisepay.db",
        )

        def is_sqlite() -> bool:
            return DATABASE_URL.startswith("sqlite")

# Configure SQLAlchemy 2.0 engine supporting PostgreSQL with auto-fallback to SQLite
if is_sqlite():
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
else:
    try:
        engine = create_engine(
            DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
        )
    except Exception as e:
        # Graceful fallback to SQLite if psycopg2 is missing in Python environment
        print(f"[WisePay DB] PostgreSQL connection failed ({e}). Falling back to SQLite.")
        sqlite_url = "sqlite:///./wisepay.db"
        engine = create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
