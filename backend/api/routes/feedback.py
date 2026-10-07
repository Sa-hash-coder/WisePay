import sys
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from api.deps import get_current_user, get_db
from api.schemas.decision import DecisionCreate, DecisionResponse
from engine.decisions import PERMITTED_ROLES, process_human_decision
from models import HumanDecision, Invoice, User

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("/{transaction_id}")
def submit_feedback(
    transaction_id: str,
    body: dict = Body(...),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Direct endpoint called by the Next.js frontend (api.feedback.submit).
    Processes decision and enforces Segregation of Duties (SoD) policies.
    """
    decision_payload = DecisionCreate(
        decision=body.get("decision", ""),
        reason=body.get("reason", ""),
        reviewer_id=body.get("reviewer_id", "Operations Reviewer"),
        reviewer_role=body.get("reviewer_role", "AP / FINANCE REVIEWER"),
        metadata=body.get("metadata"),
    )

    result = process_human_decision(
        db=db,
        invoice_id=transaction_id,
        decision_data=decision_payload,
        current_user=None,
    )

    return result


@router.get("/roles")
def get_available_roles() -> Dict[str, Any]:
    """Returns the EXACT 3 organizational roles and their governance policies."""
    return {
        "roles": [
            {
                "id": "AP / FINANCE REVIEWER",
                "department": "Accounts Payable Operations",
                "authority": "Standard review up to ₹5,00,000. Escalate high-risk to Manager.",
                "can_approve_disbursement": True,
                "can_override_high_risk": False,
                "can_audit_ledger": False,
            },
            {
                "id": "FINANCE MANAGER",
                "department": "Financial Control & Treasury",
                "authority": "Full approval authority, high-risk quarantine release, and heuristic overrides.",
                "can_approve_disbursement": True,
                "can_override_high_risk": True,
                "can_audit_ledger": True,
            },
            {
                "id": "AUDITOR",
                "department": "Independent Compliance & SOX Audit",
                "authority": "Forensic ledger inspection & Solana SHA-256 verification. Segregation of Duties (read-only for disbursements).",
                "can_approve_disbursement": False,
                "can_override_high_risk": False,
                "can_audit_ledger": True,
            },
        ]
    }


@router.get("/stats")
def get_feedback_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    total_reviews = db.query(HumanDecision).count()

    approved = db.query(HumanDecision).filter(HumanDecision.decision == "APPROVE").count()
    rejected = db.query(HumanDecision).filter(HumanDecision.decision == "REJECT").count()
    escalated = db.query(HumanDecision).filter(HumanDecision.decision == "ESCALATE").count()

    return {
        "total_reviews": total_reviews,
        "approved": approved,
        "rejected": rejected,
        "escalated": escalated,
    }
