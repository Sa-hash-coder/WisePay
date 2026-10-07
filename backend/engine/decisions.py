import datetime
import uuid
from decimal import Decimal
from typing import Any, Dict, Optional, Union

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from api.schemas.decision import DecisionCreate
from audit.chain import create_audit_event
from models import AuditEvent, HumanDecision, Invoice, User

PERMITTED_ROLES = {
    "THE ORIGINATOR",
    "AP / FINANCE REVIEWER",
    "AUDITOR",
}


def normalize_role(role_name: Optional[str]) -> str:
    """Normalizes role strings and aliases to standardized DB role IDs."""
    if not role_name:
        return "AP / FINANCE REVIEWER"
    role_upper = role_name.upper().strip()
    if role_upper in ["AP_REVIEWER", "AP REVIEWER"]:
        return "AP / FINANCE REVIEWER"
    if role_upper in ["ORIGINATOR", "THE ORIGINATOR", "THE_ORIGINATOR"]:
        return "THE ORIGINATOR"
    if role_upper in ["AUDITOR", "COMPLIANCE AUDITOR", "COMPLIANCE_AUDITOR"]:
        return "AUDITOR"
    return role_name


def process_human_decision(
    db: Session,
    invoice_id: Union[uuid.UUID, str],
    decision_data: DecisionCreate,
    current_user: Optional[User] = None,
) -> Dict[str, Any]:
    """
    Executes Human-in-the-Loop (HITL) review processing with strict RBAC & SoD enforcement:
    1. Finds target Invoice by UUID or business invoice_id.
    2. Determines active reviewer identity and role (from User or incoming payload).
    3. Enforces Segregation of Duties (SoD):
       - THE ORIGINATOR: Data entry point only. Blocked from review/disbursement actions (403 Forbidden).
       - AUDITOR: Read-only compliance clearance. Cannot approve, reject, or decide disbursements (403 Forbidden).
       - AP / FINANCE REVIEWER: Primary human-in-the-loop exception handler.
         Direct authority to Approve, Reject, or Escalate flagged exceptions in the Exception Pile.
    4. Records immutable HumanDecision entity in the database.
    5. Mutates Invoice.human_decision and approval_status fields.
    6. Appends sequential SHA-256 block to the cryptographic audit chain (HUMAN_REVIEW_SUBMITTED).
    7. Atomically commits the transaction to preserve ledger integrity.
    """
    # 1. Target Invoice lookup
    str_id = str(invoice_id)
    inv = db.query(Invoice).filter(Invoice.invoice_id == str_id).first()
    if not inv:
        try:
            val_uuid = uuid.UUID(str_id)
            inv = db.query(Invoice).filter(Invoice.id == val_uuid).first()
        except (ValueError, TypeError, AttributeError):
            pass

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice '{str_id}' not found",
        )

    # 2. Determine active identity and role
    if current_user:
        active_role = normalize_role(current_user.role_id)
        reviewer_id = current_user.email
        reviewer_name = current_user.full_name
        user_uuid = current_user.id
    else:
        active_role = normalize_role(decision_data.reviewer_role)
        reviewer_name = decision_data.reviewer_id or "Operations Reviewer"
        reviewer_id = reviewer_name
        user_uuid = None

    # Validate role membership
    if active_role not in PERMITTED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unauthorized role: '{active_role}'. Must be one of {sorted(list(PERMITTED_ROLES))}.",
        )

    verdict = decision_data.decision.upper().strip()
    valid_decisions = {"APPROVE", "REJECT", "EXCEPTION", "ESCALATE"}
    if verdict not in valid_decisions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid decision verdict: '{verdict}'. Allowed: {sorted(list(valid_decisions))}.",
        )

    # 3. Segregation of Duties (SoD) Enforcement
    # THE ORIGINATOR: Data entry point only
    if active_role == "THE ORIGINATOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Segregation of Duties (SoD) policy: The Originator role is dedicated to data ingestion and cannot review or approve exceptions.",
        )

    # AUDITOR: Read-only under SOX 404 / SOC2 controls
    if active_role == "AUDITOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Segregation of Duties (SoD) policy: Compliance Auditors operate in independent read-only governance and cannot authorize or reject disbursement decisions.",
        )

    # AP / FINANCE REVIEWER: Full exception triage authority (Approve, Reject, Escalate)
    # Legacy Finance Manager approval loop has been eliminated.

    reason = decision_data.reason or f"{active_role} review recorded: {verdict}"

    # 4. Create immutable HumanDecision entity
    hd = HumanDecision(
        invoice_id=inv.id,
        transaction_id=str(inv.id),
        user_id=user_uuid,
        reviewer_id=reviewer_id,
        reviewer_name=reviewer_name,
        reviewer_role=active_role,
        decision=verdict,
        reason=reason,
        original_decision=inv.decision,
    )
    db.add(hd)

    # 5. Mutate Invoice state
    inv.human_decision = verdict
    if verdict == "APPROVE":
        inv.approval_status = "APPROVED"
    elif verdict == "REJECT":
        inv.approval_status = "REJECTED"
    elif verdict == "ESCALATE":
        inv.approval_status = "ESCALATED"
    elif verdict == "EXCEPTION":
        inv.approval_status = "APPROVED_EXCEPTION"

    # 6. Append to cryptographic SHA-256 audit chain
    event_payload = {
        "decision": verdict,
        "reason": reason,
        "reviewer_id": reviewer_id,
        "reviewer_role": active_role,
        "original_ai_decision": inv.decision,
        "invoice_amount": float(inv.amount) if inv.amount is not None else 0.0,
        "sod_compliance_verified": True,
    }
    if decision_data.metadata:
        event_payload["metadata"] = decision_data.metadata

    ae = create_audit_event(
        transaction_id=str(inv.id),
        event_type="HUMAN_REVIEW_SUBMITTED",
        event_data=event_payload,
        db=db,
    )

    hd.audit_event_id = ae.id

    # 7. Commit single transaction
    db.commit()
    db.refresh(hd)
    db.refresh(inv)

    return {
        "status": "success",
        "decision_id": hd.id,
        "decision_uuid": str(hd.decision_uuid),
        "transaction_id": str(inv.id),
        "reviewer_id": reviewer_id,
        "reviewer_role": active_role,
        "decision": verdict,
        "reason": reason,
        "audit_event_id": ae.id,
        "audit_hash": ae.hash,
    }
