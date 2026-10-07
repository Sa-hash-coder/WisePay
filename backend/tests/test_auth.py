import uuid
from decimal import Decimal

import pytest
from fastapi import Depends, FastAPI, HTTPException
from fastapi.testclient import TestClient

from api.deps import get_current_user, get_db, require_role
from core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from main import app
from models import Role, User


def test_password_hashing_and_verification():
    """Verifies that password hashing produces valid hashes and verifies correctly."""
    plain = "SuperSecurePassword2026!"
    hashed = get_password_hash(plain)

    assert hashed != plain
    assert len(hashed) > 10
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


def test_jwt_token_creation_and_decoding():
    """Verifies access token generation, claims encoding, and signature decoding."""
    subject = "alex.chen@wisepay.internal"
    claims = {"role": "THE ORIGINATOR", "org": "Global Enterprise Corp"}

    token = create_access_token(subject=subject, extra_claims=claims)
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload["sub"] == subject
    assert payload["role"] == "THE ORIGINATOR"
    assert payload["org"] == "Global Enterprise Corp"
    assert "exp" in payload


def test_login_endpoint_success_and_failure(db_session):
    """Verifies /api/auth/login OAuth2 form authentication and token issuance."""
    # Seed role and test user
    role = Role(
        id="AP / FINANCE REVIEWER",
        title="AP Reviewer",
        department="AP Ops",
        approval_limit=Decimal("500000.00"),
    )
    db_session.add(role)
    db_session.commit()

    user = User(
        id=uuid.uuid4(),
        email="test.auth@wisepay.internal",
        full_name="Auth Tester",
        role_id="AP / FINANCE REVIEWER",
        hashed_password=get_password_hash("CorrectPassword123!"),
        organization="Test Corp",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    # Override database dependency for isolated in-memory test
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        # Successful login
        resp_success = client.post(
            "/api/auth/login",
            data={"username": "test.auth@wisepay.internal", "password": "CorrectPassword123!"},
        )
        assert resp_success.status_code == 200
        data = resp_success.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "test.auth@wisepay.internal"

        # Invalid password
        resp_fail = client.post(
            "/api/auth/login",
            data={"username": "test.auth@wisepay.internal", "password": "WrongPassword123!"},
        )
        assert resp_fail.status_code == 401

        # Non-existent user
        resp_missing = client.post(
            "/api/auth/login",
            data={"username": "unknown@wisepay.internal", "password": "AnyPassword"},
        )
        assert resp_missing.status_code == 401

    finally:
        app.dependency_overrides.clear()


def test_current_user_and_rbac_enforcement(db_session):
    """
    Verifies /api/auth/me token authentication and role-based access control (RBAC).
    Ensures Segregation of Duties (SoD) blocks unauthorized roles with 403 Forbidden.
    """
    role_ap = Role(id="AP / FINANCE REVIEWER", title="AP", department="AP", approval_limit=Decimal("-1.00"))
    role_orig = Role(id="THE ORIGINATOR", title="Originator", department="Ingestion", approval_limit=Decimal("0.00"))
    db_session.add_all([role_ap, role_orig])
    db_session.commit()

    user_ap = User(
        id=uuid.uuid4(),
        email="ap.user@wisepay.internal",
        full_name="AP Submitter",
        role_id="AP / FINANCE REVIEWER",
        hashed_password=get_password_hash("Pass123!"),
    )
    user_orig = User(
        id=uuid.uuid4(),
        email="orig.user@wisepay.internal",
        full_name="The Originator",
        role_id="THE ORIGINATOR",
        hashed_password=get_password_hash("Pass123!"),
    )
    db_session.add_all([user_ap, user_orig])
    db_session.commit()

    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        # Create tokens
        token_ap = create_access_token(subject=user_ap.email)
        token_orig = create_access_token(subject=user_orig.email)

        # GET /api/auth/me with AP token
        resp_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_ap}"})
        assert resp_me.status_code == 200
        assert resp_me.json()["user"]["email"] == "ap.user@wisepay.internal"

        # GET /api/auth/me without token -> 401
        assert client.get("/api/auth/me").status_code == 401

        # Test RBAC protected test route requiring AP / FINANCE REVIEWER
        rbac_app = FastAPI()
        rbac_app.dependency_overrides[get_db] = lambda: db_session

        @rbac_app.get("/reviewer-only")
        def reviewer_only(current_user: User = Depends(require_role(["AP / FINANCE REVIEWER"]))):
            return {"authorized": True, "user": current_user.email}

        rbac_client = TestClient(rbac_app)

        # Reviewer is authorized (200)
        rev_resp = rbac_client.get("/reviewer-only", headers={"Authorization": f"Bearer {token_ap}"})
        assert rev_resp.status_code == 200
        assert rev_resp.json()["authorized"] is True

        # Originator is blocked by SoD (403 Forbidden)
        orig_resp = rbac_client.get("/reviewer-only", headers={"Authorization": f"Bearer {token_orig}"})
        assert orig_resp.status_code == 403
        assert "Access Denied" in orig_resp.json()["detail"]

    finally:
        app.dependency_overrides.clear()
