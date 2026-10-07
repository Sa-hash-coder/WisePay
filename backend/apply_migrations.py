"""
Programmatic migration runner for WisePay database schema.
Applies Alembic 'head' migration, with fallback to Base.metadata.create_all.
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import engine, Base
import models  # Ensure all models are registered

def apply_migrations():
    print("Applying database schema migrations...")
    try:
        from alembic.config import Config
        from alembic import command

        alembic_cfg = Config(str(BASE_DIR / "alembic.ini"))
        alembic_cfg.set_main_option("script_location", str(BASE_DIR / "alembic"))
        command.upgrade(alembic_cfg, "head")
        print("Alembic upgrade head applied successfully.")
    except Exception as e:
        print(f"Notice: Alembic programmatic run ({e}). Applying Base.metadata.create_all directly...")
        Base.metadata.create_all(bind=engine)
        print("Base.metadata.create_all completed successfully.")

if __name__ == "__main__":
    apply_migrations()
