from fastapi import APIRouter, Depends, Body, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Transaction, HumanDecision
from audit.chain import create_audit_event

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

# EXACTLY 3 organizational roles permitted
PERMITTED_ROLES = {
    "AP / FINANCE REVIEWER",
    "FINANCE MANAGER",
    "AUDITOR"
}

AP_REVIEWER_APPROVAL_LIMIT = 500000.0  # ₹5,00,000

@router.post("/{transaction_id}")
def submit_feedback(transaction_id: str, body: dict = Body(...), db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == transaction_id).first()
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

    # Segregation of Duties (SoD) enforcement for AUDITOR
    if reviewer_role == "AUDITOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Segregation of Duties (SoD) policy: Auditors have independent read-only forensic clearance and cannot authorize or reject disbursement decisions."
        )

    # Authority threshold check for AP / FINANCE REVIEWER
    if reviewer_role == "AP / FINANCE REVIEWER" and decision == "APPROVE":
        if t.decision == "HIGH_RISK":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="High-Risk exception hold requires Finance Manager override sign-off. Please Escalate to Manager."
            )
        if t.amount and t.amount > AP_REVIEWER_APPROVAL_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Amount (₹{t.amount:,.2f}) exceeds AP Reviewer threshold of ₹{AP_REVIEWER_APPROVAL_LIMIT:,.2f}. Escalate to Finance Manager."
            )

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
                "id": "AP / FINANCE REVIEWER",
                "department": "Accounts Payable Operations",
                "authority": "Standard review up to ₹5,00,000. Escalate high-risk to Manager.",
                "can_approve_disbursement": True,
                "can_override_high_risk": False,
                "can_audit_ledger": False
            },
            {
                "id": "FINANCE MANAGER",
                "department": "Financial Control & Treasury",
                "authority": "Full approval authority, high-risk quarantine release, and heuristic overrides.",
                "can_approve_disbursement": True,
                "can_override_high_risk": True,
                "can_audit_ledger": True
            },
            {
                "id": "AUDITOR",
                "department": "Independent Compliance & SOX Audit",
                "authority": "Forensic ledger inspection & Solana SHA-256 verification. Segregation of Duties (read-only for disbursements).",
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
