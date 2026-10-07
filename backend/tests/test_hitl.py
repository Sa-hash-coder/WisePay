import datetime
import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from api.deps import get_db
from core.security import create_access_token, get_password_hash
from main import app
from models import AuditEvent, HumanDecision, Invoice, Role, User


@pytest.fixture
def hitl_setup(db_session):
    """
    Sets up roles, users with JWT tokens, and invoices in different risk tiers.
    """
    # 1. Roles
    role_originator = Role(
        id="THE ORIGINATOR",
        title="The Originator",
        department="AP Ingestion & Invoicing",
        approval_limit=Decimal("0.00"),
        can_approve_disbursement=False,
    )
    role_ap = Role(
        id="AP / FINANCE REVIEWER",
        title="AP Reviewer",
        department="Accounts Payable Operations",
        approval_limit=Decimal("-1.00"),
        can_approve_disbursement=True,
    )
    role_auditor = Role(
        id="AUDITOR",
        title="Compliance Auditor",
        department="Independent Compliance",
        approval_limit=Decimal("0.00"),
        can_approve_disbursement=False,
    )
    db_session.add_all([role_originator, role_ap, role_auditor])

    # 2. Users
    user_orig = User(
        id=uuid.uuid4(),
        email="alex.chen@wisepay.internal",
        full_name="Alex Chen",
        role_id="THE ORIGINATOR",
        hashed_password=get_password_hash("SecretPass123!"),
    )
    user_ap = User(
        id=uuid.uuid4(),
        email="priya.sharma@wisepay.internal",
        full_name="Priya Sharma",
        role_id="AP / FINANCE REVIEWER",
        hashed_password=get_password_hash("SecretPass123!"),
    )
    user_auditor = User(
        id=uuid.uuid4(),
        email="elena.rostova@sox.audit.internal",
        full_name="Elena Rostova",
        role_id="AUDITOR",
        hashed_password=get_password_hash("SecretPass123!"),
    )
    db_session.add_all([user_orig, user_ap, user_auditor])

    # 3. Test Invoices
    inv_standard = Invoice(
        id=uuid.uuid4(),
        invoice_id="INV-HITL-STD-001",
        amount=Decimal("45000.00"),
        risk_score=Decimal("48.00"),
        decision="HUMAN_REVIEW",
        approval_status="PENDING",
    )
    inv_high_risk = Invoice(
        id=uuid.uuid4(),
        invoice_id="INV-HITL-RISK-002",
        amount=Decimal("120000.00"),
        risk_score=Decimal("85.00"),
        decision="HIGH_RISK",
        approval_status="PENDING",
    )
    inv_over_limit = Invoice(
        id=uuid.uuid4(),
        invoice_id="INV-HITL-LIMIT-003",
        amount=Decimal("600000.00"),
        risk_score=Decimal("52.00"),
        decision="HUMAN_REVIEW",
        approval_status="PENDING",
    )
    db_session.add_all([inv_standard, inv_high_risk, inv_over_limit])
    db_session.commit()

    token_orig = create_access_token(subject=user_orig.email)
    token_ap = create_access_token(subject=user_ap.email)
    token_auditor = create_access_token(subject=user_auditor.email)

    return {
        "user_orig": user_orig,
        "token_orig": token_orig,
        "user_ap": user_ap,
        "token_ap": token_ap,
        "user_auditor": user_auditor,
        "token_auditor": token_auditor,
        "inv_standard": inv_standard,
        "inv_high_risk": inv_high_risk,
        "inv_over_limit": inv_over_limit,
    }


def test_ap_reviewer_submits_valid_decision(db_session, hitl_setup):
    """
    Verifies that an authorized AP_REVIEWER user can approve a standard invoice,
    persisting a HumanDecision record and sealing it in the cryptographic SHA-256 audit ledger.
    """
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        inv = hitl_setup["inv_standard"]
        token = hitl_setup["token_ap"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "decision": "APPROVE",
            "reason": "Verified purchase order PO-102 and delivery receipt.",
        }

        response = client.post(f"/api/investigation/{inv.id}/decision", json=payload, headers=headers)
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert data["decision"] == "APPROVE"
        assert data["reviewer_role"] == "AP / FINANCE REVIEWER"
        assert data["reviewer_id"] == hitl_setup["user_ap"].email
        assert data["audit_hash"] is not None
        assert len(data["audit_hash"]) == 64

        # Verify Database state mutation
        db_inv = db_session.query(Invoice).filter_by(id=inv.id).first()
        assert db_inv.human_decision == "APPROVE"
        assert db_inv.approval_status == "APPROVED"

        # Verify HumanDecision entity
        hd = db_session.query(HumanDecision).filter_by(invoice_id=inv.id).first()
        assert hd is not None
        assert hd.decision == "APPROVE"
        assert hd.user_id == hitl_setup["user_ap"].id

        # Verify AuditEvent
        ae = db_session.query(AuditEvent).filter_by(id=hd.audit_event_id).first()
        assert ae is not None
        assert ae.event_type == "HUMAN_REVIEW_SUBMITTED"
        assert ae.hash == data["audit_hash"]
    finally:
        app.dependency_overrides.clear()


def test_ap_reviewer_can_handle_high_risk_and_escalate(db_session, hitl_setup):
    """
    Exception Pile TEST:
    Verifies that AP_REVIEWER has full direct authority to triage HIGH_RISK invoices
    (Approving or Escalating without obsolete Finance Manager blocking loops).
    """
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        inv = hitl_setup["inv_high_risk"]
        token = hitl_setup["token_ap"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Test ESCALATE
        payload_esc = {
            "decision": "ESCALATE",
            "reason": "Escalating suspicious duplicate counterpart to compliance.",
        }
        resp_esc = client.post(f"/api/investigation/{inv.id}/decision", json=payload_esc, headers=headers)
        assert resp_esc.status_code == 200
        assert resp_esc.json()["decision"] == "ESCALATE"

        # 2. Test APPROVE on exception
        payload_app = {
            "decision": "APPROVE",
            "reason": "Verified legitimate one-off emergency expenditure.",
        }
        resp_app = client.post(f"/api/investigation/{inv.id}/decision", json=payload_app, headers=headers)
        assert resp_app.status_code == 200
        assert resp_app.json()["decision"] == "APPROVE"
    finally:
        app.dependency_overrides.clear()


def test_originator_blocked_from_decision_making(db_session, hitl_setup):
    """
    SoD TEST:
    Verifies that THE ORIGINATOR is strictly a data entry point and blocked from
    approving/rejecting exception rows (403 Forbidden).
    """
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        inv = hitl_setup["inv_standard"]
        token = hitl_setup["token_orig"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "decision": "APPROVE",
            "reason": "Originator attempting to self-approve.",
        }

        response = client.post(f"/api/investigation/{inv.id}/decision", json=payload, headers=headers)
        assert response.status_code == 403
        error = response.json()
        assert "Originator role is dedicated to data ingestion" in error["detail"]
    finally:
        app.dependency_overrides.clear()


def test_auditor_decisions_prevented_read_only(db_session, hitl_setup):
    """
    SoD TEST:
    Verifies that an AUDITOR is strictly read-only and blocked from submitting decisions (403 Forbidden).
    """
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        inv = hitl_setup["inv_standard"]
        token = hitl_setup["token_auditor"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "decision": "APPROVE",
            "reason": "Auditor attempting approval.",
        }

        response = client.post(f"/api/investigation/{inv.id}/decision", json=payload, headers=headers)
        assert response.status_code == 403
        error = response.json()
        assert "Segregation of Duties" in error["detail"]
    finally:
        app.dependency_overrides.clear()


def test_legacy_frontend_feedback_endpoint_compatibility(db_session, hitl_setup):
    """
    Frontend Compatibility TEST:
    Verifies POST /api/feedback/{id} accepts the exact payload structure sent by the Next.js UI.
    """
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        inv = hitl_setup["inv_standard"]

        # Payload structure from frontend/lib/api.ts api.feedback.submit
        payload = {
            "reviewer_id": "Priya Sharma",
            "reviewer_role": "AP / FINANCE REVIEWER",
            "decision": "ESCALATE",
            "reason": "Escalating for secondary managerial review.",
        }

        response = client.post(f"/api/feedback/{inv.id}", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert data["decision"] == "ESCALATE"
        assert data["reviewer_role"] == "AP / FINANCE REVIEWER"

        db_inv = db_session.query(Invoice).filter_by(id=inv.id).first()
        assert db_inv.human_decision == "ESCALATE"
        assert db_inv.approval_status == "ESCALATED"
    finally:
        app.dependency_overrides.clear()
