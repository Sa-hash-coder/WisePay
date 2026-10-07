from fastapi import APIRouter, Depends, Body, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Transaction, HumanDecision
from audit.chain import create_audit_event

import uuid

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

def find_transaction(id_val: str, db: Session):
    if not id_val:
        return None
    item = db.query(Transaction).filter(Transaction.invoice_id == id_val).first()
    if item:
        return item
    try:
        val_uuid = uuid.UUID(str(id_val))
        return db.query(Transaction).filter(Transaction.id == val_uuid).first()
    except (ValueError, TypeError, AttributeError):
        return None

# EXACTLY 3 organizational roles permitted
PERMITTED_ROLES = {
    "THE ORIGINATOR",
    "AP / FINANCE REVIEWER",
    "AUDITOR"
}

@router.post("/{transaction_id}")
def submit_feedback(transaction_id: str, body: dict = Body(...), db: Session = Depends(get_db)):
    t = find_transaction(transaction_id, db)
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    reviewer_id = body.get("reviewer_id", "Operations Reviewer")
    reviewer_role = body.get("reviewer_role", "AP / FINANCE REVIEWER")
    decision = body.get("decision")
    reason = body.get("reason", "")

    # Role validation
    if reviewer_role not in PERMITTED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unauthorized role: '{reviewer_role}'. Must be one of {sorted(list(PERMITTED_ROLES))}."
        )

    # Segregation of Duties (SoD) enforcement for THE ORIGINATOR
    if reviewer_role == "THE ORIGINATOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Segregation of Duties (SoD) policy: The Originator role is dedicated to data ingestion and cannot review or approve exceptions."
        )

    # Segregation of Duties (SoD) enforcement for AUDITOR
    if reviewer_role in ["AUDITOR", "COMPLIANCE AUDITOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Segregation of Duties (SoD) policy: Auditors have independent read-only forensic clearance and cannot authorize or reject disbursement decisions."
        )

    # AP / FINANCE REVIEWER has direct authority to Approve, Reject, or Escalate any flagged row.

    # 1. Create HumanDecision record
    hd = HumanDecision(
        transaction_id=transaction_id,
        reviewer_id=reviewer_id,
        reviewer_role=reviewer_role,
        decision=decision,
        reason=reason,
        original_decision=t.decision
    )
    db.add(hd)
    db.commit()
    db.refresh(hd)
    
    # 2. Create Audit Event
    ae = create_audit_event(
        transaction_id=transaction_id,
        event_type="HUMAN_REVIEW_SUBMITTED",
        event_data={
            "decision": decision,
            "reason": reason,
            "reviewer_id": reviewer_id,
            "reviewer_role": reviewer_role,
            "sod_compliance_verified": True
        },
        db=db
    )
    
    hd.audit_event_id = ae.id
    
    # 3. Update Transaction record
    t.human_decision = decision
    db.commit()
    
    return {
        "status": "success",
        "decision_id": hd.id,
        "reviewer_role": reviewer_role,
        "decision": decision
    }

@router.get("/roles")
def get_available_roles():
    """Returns the EXACT 3 organizational roles and their governance policies."""
    return {
        "roles": [
            {
                "id": "THE ORIGINATOR",
                "title": "The Originator",
                "department": "AP Ingestion & Invoicing",
                "authority": "Single entry receipt/invoice submissions and bulk batch enterprise simulation.",
                "can_approve_disbursement": False,
                "can_override_high_risk": False,
                "can_audit_ledger": False
            },
            {
                "id": "AP / FINANCE REVIEWER",
                "title": "AP / Finance Reviewer",
                "department": "Exception Handling & Operations",
                "authority": "Primary human-in-the-loop exception handler. Direct authority to Approve, Reject, or Escalate flagged anomalies.",
                "can_approve_disbursement": True,
                "can_override_high_risk": True,
                "can_audit_ledger": False
            },
            {
                "id": "AUDITOR",
                "title": "Compliance Auditor",
                "department": "Independent Compliance & SOX Audit",
                "authority": "Read-only forensic inspection, 90% auto-pass vs 10% flagged verification, and cryptographic SHA-256 audit trail.",
                "can_approve_disbursement": False,
                "can_override_high_risk": False,
                "can_audit_ledger": True
            }
        ]
    }

@router.get("/stats")
def get_feedback_stats(db: Session = Depends(get_db)):
    total_reviews = db.query(HumanDecision).count()
    
    approved = db.query(HumanDecision).filter(HumanDecision.decision == "APPROVE").count()
    rejected = db.query(HumanDecision).filter(HumanDecision.decision == "REJECT").count()
    escalated = db.query(HumanDecision).filter(HumanDecision.decision == "ESCALATE").count()
    
    return {
        "total_reviews": total_reviews,
        "approved": approved,
        "rejected": rejected,
        "escalated": escalated
    }
