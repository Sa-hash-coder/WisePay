import datetime
import json
import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from api.deps import get_db
from audit.chain import create_audit_event
from core.security import create_access_token, get_password_hash
from main import app
from models import (
    AuditEvent,
    Employee,
    Evidence,
    ExceptionRecord,
    HumanDecision,
    Invoice,
    RiskAssessment,
    Role,
    Rule,
    User,
    Vendor,
)


@pytest.fixture
def read_api_fixtures(db_session):
    """
    Populates rich relational demo records for testing dashboard,
    transactions, investigation package, and audit trail read endpoints.
    """
    # 1. Rules
    rule1 = Rule(
        id="POLICY_LIMIT",
        name="Spend Threshold Exceeded",
        description="Amount exceeds standard departmental threshold",
        severity="HIGH",
        score_contribution=Decimal("35.00"),
    )
    rule2 = Rule(
        id="MISSING_RECEIPT",
        name="Missing Itemized Receipt",
        description="Invoice submitted without uploaded GST receipt",
        severity="MEDIUM",
        score_contribution=Decimal("20.00"),
    )
    db_session.add_all([rule1, rule2])

    # 2. Vendors & Employees
    v1 = Vendor(
        id="V-TECH-101",
        name="Global Cloud Systems",
        category="Cloud Infrastructure",
        historical_min=Decimal("5000.00"),
        historical_max=Decimal("50000.00"),
    )
    e1 = Employee(
        id="EMP-900",
        name="Rajesh Sharma",
        department="Engineering Operations",
        typical_spend_limit=Decimal("100000.00"),
    )
    db_session.add_all([v1, e1])

    # 3. Invoices across 3 decision tiers
    # Invoice 1: AUTO_PASS
    inv1 = Invoice(
        id=uuid.uuid4(),
        invoice_id="INV-AUTO-001",
        invoice_number="BILL-1001",
        employee_id="EMP-900",
        employee_name="Rajesh Sharma",
        employee_dept="Engineering Operations",
        vendor_id="V-TECH-101",
        vendor_name="Global Cloud Systems",
        invoice_date=datetime.datetime.utcnow(),
        amount=Decimal("15000.00"),
        currency="INR",
        category="Cloud Infrastructure",
        description="Monthly hosting fee",
        approval_status="APPROVED",
        receipt_status="UPLOADED",
        payment_status="PENDING",
        risk_score=Decimal("12.50"),
        confidence=Decimal("94.00"),
        decision="AUTO_PASS",
        rules_triggered=[],
        anomaly_details={},
    )

    # Invoice 2: HUMAN_REVIEW
    inv2 = Invoice(
        id=uuid.uuid4(),
        invoice_id="INV-REVIEW-002",
        invoice_number="BILL-1002",
        employee_id="EMP-900",
        employee_name="Rajesh Sharma",
        employee_dept="Engineering Operations",
        vendor_id="V-TECH-101",
        vendor_name="Global Cloud Systems",
        invoice_date=datetime.datetime.utcnow(),
        amount=Decimal("75000.00"),
        currency="INR",
        category="Cloud Infrastructure",
        description="Additional server cluster reservation",
        approval_status="PENDING",
        receipt_status="MISSING",
        payment_status="PENDING",
        risk_score=Decimal("58.00"),
        confidence=Decimal("82.00"),
        decision="HUMAN_REVIEW",
        rules_triggered=[{"rule_id": "MISSING_RECEIPT", "rule_name": "Missing Itemized Receipt", "score_contribution": 20.0}],
        anomaly_details={"duplicate_info": {"is_duplicate": False}},
    )

    # Invoice 3: HIGH_RISK
    inv3_id = uuid.uuid4()
    inv3 = Invoice(
        id=inv3_id,
        invoice_id="INV-RISK-003",
        invoice_number="BILL-1003",
        employee_id="EMP-900",
        employee_name="Rajesh Sharma",
        employee_dept="Engineering Operations",
        vendor_id="V-TECH-101",
        vendor_name="Global Cloud Systems",
        invoice_date=datetime.datetime.utcnow(),
        amount=Decimal("450000.00"),
        currency="INR",
        category="Cloud Infrastructure",
        description="Urgent enterprise license renewal",
        approval_status="PENDING",
        receipt_status="MISSING",
        payment_status="PENDING",
        risk_score=Decimal("88.50"),
        confidence=Decimal("89.00"),
        decision="HIGH_RISK",
        rules_triggered=[
            {"rule_id": "POLICY_LIMIT", "rule_name": "Spend Threshold Exceeded", "score_contribution": 35.0},
            {"rule_id": "MISSING_RECEIPT", "rule_name": "Missing Itemized Receipt", "score_contribution": 20.0},
        ],
        anomaly_details={
            "duplicate_info": {
                "is_duplicate": True,
                "similarity_score": 0.95,
                "matched_invoice_id": "INV-REVIEW-002",
            },
            "behavioral_info": {
                "vendor_behavior": {"ratio_to_max": 9.0},
                "behavioral_anomaly_score": 65.0,
            },
        },
    )

    db_session.add_all([inv1, inv2, inv3])
    db_session.commit()

    # Add Exception Records for inv3
    exc1 = ExceptionRecord(
        invoice_id=inv3.id,
        rule_id="POLICY_LIMIT",
        exception_type="POLICY",
        message="Invoice amount ₹450,000 exceeds standard limit ₹100,000",
        severity_score=Decimal("35.00"),
    )
    exc2 = ExceptionRecord(
        invoice_id=inv3.id,
        rule_id="MISSING_RECEIPT",
        exception_type="POLICY",
        message="Itemized invoice proof not provided",
        severity_score=Decimal("20.00"),
    )
    db_session.add_all([exc1, exc2])

    # Add RiskAssessment & Evidence for inv3
    assessment = RiskAssessment(
        invoice_id=inv3.id,
        version=1,
        risk_score=Decimal("88.50"),
        confidence=Decimal("89.00"),
        decision="HIGH_RISK",
        validation_risk=Decimal("10.00"),
        duplicate_risk=Decimal("45.00"),
        behavioral_risk=Decimal("65.00"),
        policy_risk=Decimal("55.00"),
        relationship_risk=Decimal("0.00"),
        anomaly_model_risk=Decimal("70.00"),
    )
    db_session.add(assessment)
    db_session.commit()

    evidence = Evidence(
        assessment_id=assessment.id,
        behavioral_analysis={"behavioral_anomaly_score": 65.0},
        duplicate_evidence={"is_duplicate": True, "similarity_score": 0.95, "matched_invoice_id": "INV-REVIEW-002"},
        recommendation="Critical escalation: Multiple high-risk signals require immediate review.",
    )
    db_session.add(evidence)

    # 4. Create Audit Events
    create_audit_event(
        transaction_id=str(inv3.id),
        event_type="INVOICE_PROCESSED",
        event_data={"decision": "HIGH_RISK", "risk_score": 88.5},
        db=db_session,
    )
    create_audit_event(
        transaction_id=str(inv3.id),
        event_type="POLICY_VIOLATION",
        event_data={"rules": ["POLICY_LIMIT", "MISSING_RECEIPT"]},
        db=db_session,
    )

    db_session.commit()

    return {
        "inv1": inv1,
        "inv2": inv2,
        "inv3": inv3,
    }


def test_dashboard_stats(db_session, read_api_fixtures):
    """Verifies GET /api/dashboard/stats returns accurate KPIs with float amounts."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        response = client.get("/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()

        assert data["total"] == 3
        assert data["auto_pass"] == 1
        assert data["human_review"] == 1
        assert data["high_risk"] == 1
        assert data["human_attention_saved_pct"] == pytest.approx(33.3, 0.1)

        assert isinstance(data["total_amount"], float)
        assert data["total_amount"] == 540000.0  # 15k + 75k + 450k
        assert isinstance(data["flagged_amount"], float)
        assert data["flagged_amount"] == 525000.0  # 75k + 450k
    finally:
        app.dependency_overrides.clear()


def test_dashboard_risk_distribution(db_session, read_api_fixtures):
    """Verifies GET /api/dashboard/risk_distribution produces 10-bucket counts."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        response = client.get("/api/dashboard/risk_distribution")
        assert response.status_code == 200
        data = response.json()

        assert "labels" in data
        assert len(data["labels"]) == 10
        assert "data" in data
        assert len(data["data"]) == 10

        # inv1: 12.5 -> bucket 1
        # inv2: 58.0 -> bucket 5
        # inv3: 88.5 -> bucket 8
        assert data["data"][1] >= 1
        assert data["data"][5] >= 1
        assert data["data"][8] >= 1
    finally:
        app.dependency_overrides.clear()


def test_dashboard_top_risk_categories(db_session, read_api_fixtures):
    """Verifies GET /api/dashboard/top_risk_categories returns top 5 violation categories."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        response = client.get("/api/dashboard/top_risk_categories")
        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        categories = [item["category"] for item in data]
        assert "Missing Itemized Receipt" in categories or "MISSING_RECEIPT" in categories
    finally:
        app.dependency_overrides.clear()


def test_dashboard_network_and_processing_stream(db_session, read_api_fixtures):
    """Verifies GET /api/dashboard/network and /processing_stream formats."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        # Network graph
        net_resp = client.get("/api/dashboard/network")
        assert net_resp.status_code == 200
        net_data = net_resp.json()
        assert "nodes" in net_data
        assert "edges" in net_data
        assert len(net_data["nodes"]) >= 2
        assert len(net_data["edges"]) >= 1

        # Processing stream
        stream_resp = client.get("/api/dashboard/processing_stream")
        assert stream_resp.status_code == 200
        stream_data = stream_resp.json()
        assert isinstance(stream_data, list)
        assert len(stream_data) >= 3
        assert any(t["invoice_id"] == "INV-RISK-003" for t in stream_data)
    finally:
        app.dependency_overrides.clear()


def test_transactions_list_and_filter(db_session, read_api_fixtures):
    """Verifies GET /api/transactions pagination, sorting, and decision filtering."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        # 1. Default list
        resp = client.get("/api/transactions?page=1&size=10")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert len(data["items"]) == 3
        assert isinstance(data["items"][0]["amount"], float)

        # 2. Filtered list: HUMAN_REVIEW,HIGH_RISK
        resp_filtered = client.get("/api/transactions?decision=HUMAN_REVIEW,HIGH_RISK")
        assert resp_filtered.status_code == 200
        filtered_data = resp_filtered.json()
        assert filtered_data["total"] == 2
        decisions = [t["decision"] for t in filtered_data["items"]]
        assert "AUTO_PASS" not in decisions
    finally:
        app.dependency_overrides.clear()


def test_transaction_detail_and_similar(db_session, read_api_fixtures):
    """Verifies GET /api/transactions/{id} and /similar."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        inv3 = read_api_fixtures["inv3"]
        inv3_id = str(inv3.id)

        # Single detail
        detail_resp = client.get(f"/api/transactions/{inv3_id}")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert detail["invoice_id"] == "INV-RISK-003"
        assert detail["decision"] == "HIGH_RISK"
        assert isinstance(detail["risk_score"], float)

        # Similar items
        sim_resp = client.get(f"/api/transactions/{inv3_id}/similar")
        assert sim_resp.status_code == 200
        sim_list = sim_resp.json()
        assert isinstance(sim_list, list)
        assert len(sim_list) >= 1
        assert sim_list[0]["invoice_id"] == "INV-REVIEW-002"
    finally:
        app.dependency_overrides.clear()


def test_investigation_package_endpoint(db_session, read_api_fixtures):
    """Verifies GET /api/investigation/{id} returns complete forensic package."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        inv3 = read_api_fixtures["inv3"]
        inv3_id = str(inv3.id)

        resp = client.get(f"/api/investigation/{inv3_id}")
        assert resp.status_code == 200
        pkg = resp.json()

        assert "transaction" in pkg
        assert pkg["transaction"]["invoice_id"] == "INV-RISK-003"
        assert isinstance(pkg["transaction"]["amount"], float)

        assert "behavioral_analysis" in pkg
        assert "duplicate_evidence" in pkg
        assert pkg["duplicate_evidence"]["is_duplicate"] is True

        assert "policy_violations" in pkg
        assert len(pkg["policy_violations"]) >= 2

        assert "counterfactual_steps" in pkg
        assert len(pkg["counterfactual_steps"]) >= 1

        assert "evidence_graph" in pkg
        assert len(pkg["evidence_graph"]["nodes"]) >= 3
        assert len(pkg["evidence_graph"]["edges"]) >= 2

        assert "audit_timeline" in pkg
        assert len(pkg["audit_timeline"]) >= 2

        assert "recommendation" in pkg
        assert len(pkg["recommendation"]) > 0
    finally:
        app.dependency_overrides.clear()


def test_audit_chain_and_cryptographic_verification(db_session, read_api_fixtures):
    """Verifies GET /api/audit/chain and POST /api/audit/{id}/verify."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    try:
        inv3 = read_api_fixtures["inv3"]
        inv3_id = str(inv3.id)

        # Full chain
        chain_resp = client.get("/api/audit/chain?page=1&size=10")
        assert chain_resp.status_code == 200
        chain = chain_resp.json()
        assert isinstance(chain, list)
        assert len(chain) >= 2

        # Verify trail
        verify_resp = client.post(f"/api/audit/{inv3_id}/verify")
        assert verify_resp.status_code == 200
        ver_data = verify_resp.json()
        assert ver_data["verified"] is True
        assert ver_data["mismatch_at"] is None
        assert len(ver_data["events"]) == 2
    finally:
        app.dependency_overrides.clear()
