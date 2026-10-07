import pytest
from models import (
    AuditEvent,
    Employee,
    Evidence,
    ExceptionRecord,
    HumanDecision,
    Invoice,
    Role,
    Rule,
    User,
    Vendor,
)
from scripts.seed_demo_data import (
    seed_employees,
    seed_invoices,
    seed_roles,
    seed_rules,
    seed_users,
    seed_vendors,
)


def run_full_seed(db, count: int):
    roles = seed_roles(db)
    users = seed_users(db, roles)
    rules = seed_rules(db)
    vendors = seed_vendors(db)
    employees = seed_employees(db)
    seed_invoices(db, count, vendors, employees, rules, users)


def test_seed_demo_data_and_idempotency(db_session):
    """
    IDEMPOTENCY & SEED VERIFICATION TEST:
    1. Executes seed for 10 records.
    2. Verifies invoices, rules, vendors, and audit events exist.
    3. Re-executes the exact same seed logic again.
    4. Asserts that the second execution does NOT crash with Unique Constraint errors
       and does NOT duplicate records (count remains strictly 10).
    """
    # First seed run
    run_full_seed(db_session, count=10)

    first_run_invoice_count = db_session.query(Invoice).count()
    first_run_vendor_count = db_session.query(Vendor).count()
    first_run_employee_count = db_session.query(Employee).count()
    first_run_audit_count = db_session.query(AuditEvent).count()

    assert first_run_invoice_count == 10
    assert first_run_vendor_count == 16
    assert first_run_employee_count == 50
    assert first_run_audit_count >= 10

    # Second seed run (Idempotency assertion)
    # Must succeed without throwing IntegrityError
    run_full_seed(db_session, count=10)

    second_run_invoice_count = db_session.query(Invoice).count()
    second_run_vendor_count = db_session.query(Vendor).count()
    second_run_employee_count = db_session.query(Employee).count()

    assert second_run_invoice_count == 10, "Idempotency failed: invoice count duplicated"
    assert second_run_vendor_count == 16, "Idempotency failed: vendor count duplicated"
    assert second_run_employee_count == 50, "Idempotency failed: employee count duplicated"


def test_seed_scenario_distribution(db_session):
    """
    Verifies that the generated invoices represent diverse real-world AP scenarios:
    Clean (AUTO_PASS), Over Limit (HIGH_RISK), Duplicate, and Missing Receipts.
    """
    run_full_seed(db_session, count=10)

    invoices = db_session.query(Invoice).all()
    decisions = {inv.decision for inv in invoices}

    # Must contain both AUTO_PASS and escalated decisions
    assert "AUTO_PASS" in decisions
    assert ("HIGH_RISK" in decisions or "HUMAN_REVIEW" in decisions)

    # Check for specific scenario invoices
    inv_2 = db_session.query(Invoice).filter_by(invoice_id="INV-DEMO-000002").first()
    assert inv_2 is not None
    assert inv_2.decision in ["HIGH_RISK", "HUMAN_REVIEW"]

    inv_4 = db_session.query(Invoice).filter_by(invoice_id="INV-DEMO-000004").first()
    assert inv_4 is not None
    assert inv_4.decision == "HIGH_RISK"
    assert inv_4.anomaly_details.get("duplicate_info", {}).get("is_duplicate") is True
