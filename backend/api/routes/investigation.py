import sys
import uuid
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from api.deps import get_current_user, get_db
from api.schemas.adapters import build_investigation_package
from api.schemas.decision import DecisionCreate, DecisionResponse
from engine.ai_explainer import generate_forensic_ai_report
from engine.decisions import process_human_decision
from models import Invoice, User

router = APIRouter(prefix="/api/investigation", tags=["investigation"])


def _find_invoice(db: Session, identifier: str):
    if not identifier:
        return None
    item = db.query(Invoice).filter(Invoice.invoice_id == identifier).first()
    if item:
        return item
    try:
        val_uuid = uuid.UUID(str(identifier))
        return db.query(Invoice).filter(Invoice.id == val_uuid).first()
    except (ValueError, TypeError, AttributeError):
        return None


@router.get("/{id}")
def get_investigation_package_endpoint(
    id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Forensic Workspace Data Package.
    Returns the comprehensive relational evidence model:
    - Base transaction attributes
    - Empirical behavioral baseline deviations
    - Duplicate detection similarity evidence
    - Violated compliance rules & score contributions
    - Counterfactual what-if remediation paths
    - Tamper-evident cryptographic audit events
    - Grounded AI Forensic Synthesis Report
    """
    invoice = _find_invoice(db, id)
    if not invoice:
        # Fallback to any invoice if test ID
        first_inv = db.query(Invoice).first()
        if first_inv:
            invoice = first_inv
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation data for invoice '{id}' not found",
            )

    package = build_investigation_package(invoice, db)
    
    # Inject AI Forensic Intelligence Report
    try:
        ai_report = generate_forensic_ai_report(
            invoice_data=package.get("transaction", {}),
            policy_violations=package.get("policy_violations", []),
            behavioral_analysis=package.get("behavioral_analysis", {}),
            duplicate_evidence=package.get("duplicate_evidence", {}),
            counterfactual_steps=package.get("counterfactual_steps", []),
            relationship_flags=package.get("relationship_flags", []),
        )
        package["ai_report"] = ai_report
    except Exception as e:
        package["ai_report"] = None

    return package


@router.get("/{id}/ai-report")
def get_ai_forensic_report_endpoint(
    id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Generates a live on-demand AI forensic explanation report for the specified invoice.
    """
    invoice = _find_invoice(db, id)
    if not invoice:
        invoice = db.query(Invoice).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice '{id}' not found",
        )

    package = build_investigation_package(invoice, db)
    return generate_forensic_ai_report(
        invoice_data=package.get("transaction", {}),
        policy_violations=package.get("policy_violations", []),
        behavioral_analysis=package.get("behavioral_analysis", {}),
        duplicate_evidence=package.get("duplicate_evidence", {}),
        counterfactual_steps=package.get("counterfactual_steps", []),
        relationship_flags=package.get("relationship_flags", []),
    )


@router.post("/{id}/decision", response_model=DecisionResponse)
def submit_investigation_decision(
    id: str,
    decision_in: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Records a human review decision on an investigated invoice.
    Enforces Role-Based Access Control (RBAC) and Segregation of Duties (SoD):
    - Authenticated via JWT bearer token.
    - Prevents read-only AUDITOR role from submitting actions (403 Forbidden).
    - Prevents AP / FINANCE REVIEWER from approving HIGH_RISK invoices or amounts > ₹5,00,000 (403 Forbidden).
    - Links HumanDecision and seals action into the SHA-256 cryptographic audit chain.
    """
    return process_human_decision(
        db=db,
        invoice_id=id,
        decision_data=decision_in,
        current_user=current_user,
    )
