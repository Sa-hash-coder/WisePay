import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
import models  # Register all declarative models


@pytest.fixture(scope="session")
def db_engine():
    """
    Session-scoped database engine pointing to an isolated in-memory SQLite database.
    StaticPool ensures all connections share the same in-memory database instance.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    return engine


@pytest.fixture(scope="function")
def db_session(db_engine):
    """
    Function-scoped database session.
    Creates all tables before each test and tears them down after the test finishes,
    completely isolating tests and never touching main application storage.
    """
    # Create schema for isolated test
    Base.metadata.create_all(bind=db_engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.rollback()
        session.close()
        Base.metadata.drop_all(bind=db_engine)
