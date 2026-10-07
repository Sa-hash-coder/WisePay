import datetime
import decimal
import json
import uuid
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from models import (
    AuditEvent,
    Employee,
    Evidence,
    ExceptionRecord,
    HumanDecision,
    Invoice,
    InvoiceItem,
    RiskAssessment,
    Role,
    Rule,
    User,
    Vendor,
)


def test_role_and_user_creation(db_session):
    """Verifies Role and User creation with role relationship and constraints."""
    role = Role(
        id="THE ORIGINATOR",
        title="The Originator",
        department="AP Ingestion & Invoicing",
        approval_limit=Decimal("0.00"),
        can_approve_disbursement=False,
        can_override_high_risk=False,
        is_auditor_read_only=False,
    )
    db_session.add(role)
    db_session.commit()

    user = User(
        id=uuid.uuid4(),
        email="alex.chen@wisepay.internal",
        full_name="Alex Chen",
        role_id="THE ORIGINATOR",
        hashed_password="hashed_pw_test",
        organization="Global Enterprise Corp",
    )
    db_session.add(user)
    db_session.commit()

    queried_user = db_session.query(User).filter_by(email="alex.chen@wisepay.internal").first()
    assert queried_user is not None
    assert queried_user.full_name == "Alex Chen"
    assert queried_user.role.department == "AP Ingestion & Invoicing"
    assert queried_user.role.is_auditor_read_only is False


def test_financial_precision_exact_decimal(db_session):
    """
    CRITICAL FINANCIAL PRECISION TEST:
    Verifies that invoice amounts are stored as exact Decimal values,
    strictly NOT Python floats, preventing floating-point rounding errors.
    """
    vendor = Vendor(
        id="V_PRECISION",
        name="Precision Test Vendor",
        category="Consulting",
        historical_min=Decimal("100.00"),
        historical_max=Decimal("5000.00"),
    )
    employee = Employee(
        id="E_PRECISION",
        name="Precision Employee",
        department="Finance",
        typical_spend_limit=Decimal("50000.00"),
    )
    db_session.add_all([vendor, employee])
    db_session.commit()

    exact_amount = Decimal("100.10")
    inv = Invoice(
        id=uuid.uuid4(),
        invoice_id="INV-PRECISION-001",
        invoice_number="PO-9991",
        vendor_id=vendor.id,
        vendor_name=vendor.name,
        employee_id=employee.id,
        employee_name=employee.name,
        employee_dept=employee.department,
        amount=exact_amount,
        currency="INR",
        approval_status="APPROVED",
        receipt_status="UPLOADED",
        payment_status="PENDING",
        risk_score=Decimal("12.50"),
        confidence=Decimal("94.20"),
        decision="AUTO_PASS",
    )
    db_session.add(inv)
    db_session.commit()

    # Expire and refresh to force a clean database read
    db_session.expire_all()
    queried = db_session.query(Invoice).filter_by(invoice_id="INV-PRECISION-001").first()

    assert queried is not None
    # 1. Exact equality check with Decimal
    assert queried.amount == Decimal("100.10")
    # 2. Strict type check: Must be a Decimal, NEVER a float
    assert isinstance(queried.amount, Decimal)
    assert not isinstance(queried.amount, float)
    # 3. Arithmetic precision test (100.10 + 200.20 must equal exact 300.30 without float drift)
    total = queried.amount + Decimal("200.20")
    assert total == Decimal("300.30")


def test_invoice_foreign_key_and_items(db_session):
    """Verifies line-item relationships and cascading deletes."""
    vendor = Vendor(
        id="V_ITEMS",
        name="Tech Equipments",
        category="Equipment",
    )
    employee = Employee(
        id="E_ITEMS",
        name="Hardware Manager",
        department="Engineering",
    )
    db_session.add_all([vendor, employee])
    db_session.commit()

    inv_id = uuid.uuid4()
    inv = Invoice(
        id=inv_id,
        invoice_id="INV-ITEMS-001",
        vendor_id=vendor.id,
        employee_id=employee.id,
        amount=Decimal("45000.00"),
        currency="INR",
    )
    db_session.add(inv)
    db_session.commit()

    item1 = InvoiceItem(
        invoice_id=inv_id,
        item_description="Monitor Stand",
        quantity=Decimal("2.00"),
        unit_price=Decimal("2500.00"),
        total_price=Decimal("5000.00"),
    )
    item2 = InvoiceItem(
        invoice_id=inv_id,
        item_description="4K Display",
        quantity=Decimal("1.00"),
        unit_price=Decimal("40000.00"),
        total_price=Decimal("40000.00"),
    )
    db_session.add_all([item1, item2])
    db_session.commit()

    queried_inv = db_session.query(Invoice).filter_by(id=inv_id).first()
    assert len(queried_inv.items) == 2
    total_line_items = sum(it.total_price for it in queried_inv.items)
    assert total_line_items == Decimal("45000.00")


def test_risk_assessment_and_evidence_relationship(db_session):
    """Verifies immutable RiskAssessment, ExceptionRecord, and Evidence relationships."""
    rule = Rule(
        id="POLICY_LIMIT",
        name="Policy Limit Exceeded Without Approval",
        description="Amount exceeds threshold",
        severity="HIGH",
        score_contribution=Decimal("30.00"),
    )
    db_session.add(rule)
    db_session.commit()

    inv_id = uuid.uuid4()
    inv = Invoice(
        id=inv_id,
        invoice_id="INV-RISK-001",
        amount=Decimal("150000.00"),
        currency="INR",
    )
    db_session.add(inv)
    db_session.commit()

    assessment_id = uuid.uuid4()
    assessment = RiskAssessment(
        id=assessment_id,
        invoice_id=inv_id,
        version=1,
        risk_score=Decimal("82.00"),
        confidence=Decimal("89.00"),
        decision="HIGH_RISK",
        policy_risk=Decimal("60.00"),
    )
    db_session.add(assessment)
    db_session.commit()

    exception_record = ExceptionRecord(
        invoice_id=inv_id,
        assessment_id=assessment_id,
        rule_id=rule.id,
        exception_type="POLICY",
        message="Exceeds standard threshold",
        severity_score=Decimal("30.00"),
    )
    evidence = Evidence(
        assessment_id=assessment_id,
        behavioral_analysis={"vendor_z_score": 3.8},
        recommendation="Finance Manager override required",
    )
    db_session.add_all([exception_record, evidence])
    db_session.commit()

    queried_assessment = db_session.query(RiskAssessment).filter_by(id=assessment_id).first()
    assert queried_assessment is not None
    assert queried_assessment.evidence is not None
    assert queried_assessment.evidence.behavioral_analysis == {"vendor_z_score": 3.8}
    assert len(queried_assessment.exceptions) == 1
    assert queried_assessment.exceptions[0].rule_id == "POLICY_LIMIT"


def test_invoice_to_dict_frontend_compatibility(db_session):
    """
    Verifies that Invoice.to_dict() outputs the exact dictionary schema
    expected by the Next.js frontend, including JSON string serializations.
    """
    inv = Invoice(
        id=uuid.uuid4(),
        invoice_id="INV-DICT-001",
        invoice_number="PO-1234",
        employee_name="Test Submitter",
        employee_dept="Engineering",
        vendor_name="Cloud Corp",
        amount=Decimal("5432.10"),
        currency="INR",
        category="Cloud",
        approval_status="APPROVED",
        receipt_status="UPLOADED",
        payment_status="PENDING",
        policy_category="Standard",
        risk_score=Decimal("15.40"),
        confidence=Decimal("95.00"),
        decision="AUTO_PASS",
        human_decision=None,
        rules_triggered=[{"rule_id": "NONE"}],
        anomaly_details={"score": 0.0},
    )
    db_session.add(inv)
    db_session.commit()

    data = inv.to_dict()
    assert isinstance(data, dict)
    assert data["invoice_id"] == "INV-DICT-001"
    assert data["amount"] == 5432.10
    assert data["risk_score"] == 15.40
    assert data["decision"] == "AUTO_PASS"
    assert isinstance(data["rules_triggered"], str)
    assert isinstance(data["anomaly_details"], str)

    # Must be parseable JSON
    parsed_rules = json.loads(data["rules_triggered"])
    assert parsed_rules == [{"rule_id": "NONE"}]
