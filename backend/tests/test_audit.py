import datetime
import hashlib
import json
import pytest

from audit.chain import create_audit_event, get_hash, verify_audit_trail
from models import AuditEvent


def test_audit_chain_sequential_linking(db_session):
    """
    Verifies that sequential audit blocks maintain correct prev_hash linkage
    and monotonically increasing block indices.
    """
    txn_id = "TX_AUDIT_TEST_001"

    ev1 = create_audit_event(
        transaction_id=txn_id,
        event_type="INVOICE_INGESTED",
        event_data={"amount": 1000.0, "status": "PENDING"},
        db=db_session,
    )
    assert ev1.block_index == 0
    assert ev1.prev_hash == "0"
    assert len(ev1.hash) == 64

    ev2 = create_audit_event(
        transaction_id=txn_id,
        event_type="EVALUATION_COMPLETED",
        event_data={"risk_score": 15.0, "decision": "AUTO_PASS"},
        db=db_session,
    )
    assert ev2.block_index == 1
    assert ev2.prev_hash == ev1.hash

    ev3 = create_audit_event(
        transaction_id=txn_id,
        event_type="PAYMENT_AUTHORIZED",
        event_data={"authorized_by": "System"},
        db=db_session,
    )
    assert ev3.block_index == 2
    assert ev3.prev_hash == ev2.hash

    # Full trail verification
    verification = verify_audit_trail(txn_id, db_session)
    assert verification["verified"] is True
    assert len(verification["events"]) == 3
    assert verification["mismatch_at"] is None


def test_audit_chain_tamper_detection_payload(db_session):
    """
    CRITICAL FORENSIC SECURITY TEST:
    Modifying any historical event payload must immediately invalidate
    cryptographic verification and flag payload tampering.
    """
    txn_id = "TX_TAMPER_TEST_002"

    ev1 = create_audit_event(
        transaction_id=txn_id,
        event_type="INVOICE_INGESTED",
        event_data={"amount": 50000.0, "vendor": "Original Vendor"},
        db=db_session,
    )

    ev2 = create_audit_event(
        transaction_id=txn_id,
        event_type="HUMAN_OVERRIDE",
        event_data={"action": "APPROVED", "amount": 50000.0},
        db=db_session,
    )

    # Initial chain is valid
    assert verify_audit_trail(txn_id, db_session)["verified"] is True

    # Malicious actor tampers with event_data in database directly
    tampered_event = db_session.query(AuditEvent).filter_by(id=ev1.id).first()
    tampered_event.event_data = {"amount": 5000.0, "vendor": "Fraudulent Vendor"}
    db_session.commit()

    # Verification must catch the tampering
    verification = verify_audit_trail(txn_id, db_session)
    assert verification["verified"] is False
    assert verification["mismatch_at"] == 0
    assert "tampering detected" in verification["reason"].lower()


def test_audit_chain_tamper_detection_prev_hash_pointer(db_session):
    """
    Verifies that altering a prev_hash pointer is immediately detected
    as a hash pointer mismatch.
    """
    txn_id = "TX_TAMPER_TEST_003"

    ev1 = create_audit_event(
        transaction_id=txn_id,
        event_type="BLOCK_1",
        event_data={"step": 1},
        db=db_session,
    )
    ev2 = create_audit_event(
        transaction_id=txn_id,
        event_type="BLOCK_2",
        event_data={"step": 2},
        db=db_session,
    )

    # Alter block 2's prev_hash pointer
    block_2 = db_session.query(AuditEvent).filter_by(id=ev2.id).first()
    block_2.prev_hash = "deadbeef" * 8
    db_session.commit()

    verification = verify_audit_trail(txn_id, db_session)
    assert verification["verified"] is False
    assert verification["mismatch_at"] == 1
    assert "mismatch" in verification["reason"].lower()
