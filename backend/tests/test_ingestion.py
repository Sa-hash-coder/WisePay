import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from api.deps import get_db
from core.security import create_access_token, get_password_hash
from main import app
from models import (
    AuditEvent,
    Employee,
    Evidence,
    ExceptionRecord,
    Invoice,
    RiskAssessment,
    Role,
    User,
    Vendor,
)


@pytest.fixture
def auth_setup(db_session):
    """Sets up a test user, role, vendor, and employee with an active JWT token."""
    role = Role(
        id="AP / FINANCE REVIEWER",
        title="AP Reviewer",
        department="AP Ops",
        approval_limit=Decimal("500000.00"),
        can_approve_disbursement=True,
    )
    db_session.add(role)

    user = User(
        id=uuid.uuid4(),
        email="ingest.tester@wisepay.internal",
        full_name="Ingestion Tester",
        role_id="AP / FINANCE REVIEWER",
        hashed_password=get_password_hash("SecretPass123!"),
    )
    db_session.add(user)

    vendor = Vendor(
        id="V001",
        name="Infosys Technologies",
        category="IT Services",
        historical_min=Decimal("10000.00"),
        historical_max=Decimal("100000.00"),
    )
    db_session.add(vendor)

    employee = Employee(
        id="E001",
        name="Alice Submitter",
        department="Engineering",
    )
    db_session.add(employee)
    db_session.commit()

    token = create_access_token(subject=user.email)
    return {
        "user": user,
        "token": token,
        "vendor": vendor,
        "employee": employee,
    }


def test_single_invoice_ingestion_pipeline(db_session, auth_setup):
    """
    CORE INGESTION TEST:
    1. Authenticates using valid Bearer JWT.
    2. Posts a valid invoice to POST /api/invoices.
    3. Verifies HTTP 201 response with correct float types for amount and risk scores.
    4. Verifies database records: Invoice, Immutable RiskAssessment, Evidence, and chained AuditEvent.
    """
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        headers = {"Authorization": f"Bearer {auth_setup['token']}"}
        payload = {
            "invoice_id": "INV-TEST-INGEST-001",
            "invoice_number": "PO-8812",
            "vendor_id": "V001",
            "employee_id": "E001",
            "amount": 25000.00,
            "currency": "INR",
            "category": "IT Services",
            "description": "Quarterly cloud maintenance license",
            "approval_status": "APPROVED",
            "receipt_status": "UPLOADED",
        }

        response = client.post("/api/invoices", json=payload, headers=headers)
        assert response.status_code == 201
        data = response.json()

        # 1. Frontend-compatible typing checks
        assert data["invoice_id"] == "INV-TEST-INGEST-001"
        assert isinstance(data["amount"], float)
        assert data["amount"] == 25000.0
        assert isinstance(data["risk_score"], float)
        assert isinstance(data["confidence"], float)
        assert data["decision"] in ["AUTO_PASS", "HUMAN_REVIEW", "HIGH_RISK"]
        assert isinstance(data["rules_triggered"], str)
        assert isinstance(data["anomaly_details"], str)

        # 2. Database entity verification
        inv_db = db_session.query(Invoice).filter_by(invoice_id="INV-TEST-INGEST-001").first()
        assert inv_db is not None
        assert inv_db.amount == Decimal("25000.00")
        assert inv_db.vendor_name == "Infosys Technologies"
        assert inv_db.employee_name == "Alice Submitter"

        # 3. Immutable RiskAssessment verification
        assessment_db = db_session.query(RiskAssessment).filter_by(invoice_id=inv_db.id).first()
        assert assessment_db is not None
        assert assessment_db.version == 1
        assert assessment_db.is_active is True
        assert assessment_db.risk_score is not None

        # 4. Evidence package verification
        evidence_db = db_session.query(Evidence).filter_by(assessment_id=assessment_db.id).first()
        assert evidence_db is not None
        assert evidence_db.evidence_graph is not None
        assert len(evidence_db.evidence_graph.get("nodes", [])) >= 4

        # 5. Cryptographic SHA-256 AuditEvent verification
        audit_db = db_session.query(AuditEvent).filter_by(transaction_id=str(inv_db.id)).first()
        assert audit_db is not None
        assert audit_db.event_type == "INVOICE_PROCESSED"
        assert len(audit_db.hash) == 64
        assert audit_db.block_index >= 0

    finally:
        app.dependency_overrides.clear()


def test_policy_breach_and_exception_creation(db_session, auth_setup):
    """
    Verifies that policy limit breaches trigger deterministic rules,
    generate ExceptionRecord entities, and escalate the decision.
    """
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        headers = {"Authorization": f"Bearer {auth_setup['token']}"}
        payload = {
            "invoice_id": "INV-TEST-BREACH-002",
            "vendor_id": "V001",
            "employee_id": "E001",
            "amount": 280000.00,  # Exceeds limit
            "approval_status": "PENDING",  # Not approved -> triggers POLICY_LIMIT
            "receipt_status": "MISSING",   # Missing receipt -> triggers MISSING_RECEIPT
        }

        response = client.post("/api/invoices", json=payload, headers=headers)
        assert response.status_code == 201
        data = response.json()

        assert data["decision"] in ["HIGH_RISK", "HUMAN_REVIEW"]
        assert data["risk_score"] >= 50.0

        # Verify ExceptionRecord created in DB
        inv_db = db_session.query(Invoice).filter_by(invoice_id="INV-TEST-BREACH-002").first()
        exceptions_db = db_session.query(ExceptionRecord).filter_by(invoice_id=inv_db.id).all()
        assert len(exceptions_db) >= 1
        rule_ids = [exc.rule_id for exc in exceptions_db]
        assert "POLICY_LIMIT" in rule_ids

    finally:
        app.dependency_overrides.clear()


def test_bulk_invoice_ingestion(db_session, auth_setup):
    """Verifies POST /api/invoices/bulk batches and returns processing summary."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        headers = {"Authorization": f"Bearer {auth_setup['token']}"}
        bulk_payload = {
            "invoices": [
                {
                    "invoice_id": "INV-BULK-001",
                    "vendor_id": "V001",
                    "amount": 12000.00,
                    "approval_status": "APPROVED",
                },
                {
                    "invoice_id": "INV-BULK-002",
                    "vendor_id": "V001",
                    "amount": 18000.00,
                    "approval_status": "APPROVED",
                },
            ]
        }

        response = client.post("/api/invoices/bulk", json=bulk_payload, headers=headers)
        assert response.status_code == 201
        data = response.json()

        assert data["total"] == 2
        assert data["success_count"] == 2
        assert data["failure_count"] == 0
        assert len(data["results"]) == 2
        assert data["results"][0]["invoice_id"] == "INV-BULK-001"
        assert data["results"][1]["invoice_id"] == "INV-BULK-002"

    finally:
        app.dependency_overrides.clear()


def test_unauthenticated_ingestion_blocked(db_session):
    """Verifies that requests without a valid JWT token receive HTTP 401 Unauthorized."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        payload = {
            "vendor_id": "V001",
            "amount": 5000.00,
        }
        response = client.post("/api/invoices", json=payload)
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()
