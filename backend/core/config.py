import os
from pathlib import Path
from dotenv import load_dotenv

# Locate and load .env file from project root or backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

dotenv_path = ROOT_DIR / ".env"
if not dotenv_path.exists():
    dotenv_path = BASE_DIR / ".env"

load_dotenv(dotenv_path=dotenv_path)

# Database Configuration
raw_db_url = os.getenv(
    "DATABASE_URL",
    "sqlite:///./wisepay.db",
)
if "sqlite" in raw_db_url and ("./" in raw_db_url or not os.path.isabs(raw_db_url.replace("sqlite:///", ""))):
    db_file = (BASE_DIR / "wisepay.db").resolve()
    DATABASE_URL = f"sqlite:///{db_file.as_posix()}"
else:
    DATABASE_URL = raw_db_url

# Application & Security Settings
SECRET_KEY: str = os.getenv(
    "SECRET_KEY",
    "wisepay-secure-hackathon-jwt-secret-key-2026-32chars-min!",
)
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

# Helper to check dialect
def is_sqlite() -> bool:
    return DATABASE_URL.startswith("sqlite")
