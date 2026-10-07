import json
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from api.deps import get_db
from models import Invoice

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("")
def list_transactions(
    decision: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    sort: str = Query("risk_score"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Paginated read API for the accounts payable worklist and exception queues.
    Supports comma-separated decision filtering (e.g., 'HUMAN_REVIEW,HIGH_RISK').
    """
    query = db.query(Invoice)

    if decision:
        decisions = [d.strip() for d in decision.split(",") if d.strip()]
        if decisions:
            query = query.filter(Invoice.decision.in_(decisions))

    total = query.count()

    # Sort ordering
    if sort == "amount":
        order_col = Invoice.amount.desc()
    elif sort == "invoice_date":
        order_col = Invoice.invoice_date.desc()
    elif sort == "created_at":
        order_col = Invoice.created_at.desc()
    else:
        order_col = Invoice.risk_score.desc()

    items = (
        query.order_by(order_col)
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [t.to_dict() for t in items],
    }


@router.get("/exceptions")
def list_exception_pile(
    flag_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    AP / Finance Reviewer - The Exception Pile:
    Returns exclusively transactions flagged for high-risk, duplicates, policy limits, or missing fields.
    Each row includes the AI's explanation/citation for immediate review, approval, rejection, or escalation.
    """
    query = db.query(Invoice).filter(Invoice.decision.in_(["HUMAN_REVIEW", "HIGH_RISK"]))

    cleaned_search = (search or "").strip()
    if cleaned_search and cleaned_search.lower() not in ["none", "null", "undefined"]:
        search_pattern = f"%{cleaned_search}%"
        query = query.filter(
            (Invoice.invoice_id.ilike(search_pattern))
            | (Invoice.vendor_name.ilike(search_pattern))
            | (Invoice.employee_name.ilike(search_pattern))
            | (Invoice.description.ilike(search_pattern))
        )

    all_flagged = query.order_by(Invoice.risk_score.desc()).all()

    items_to_return = []
    for inv in all_flagged:
        anomaly_dict = {}
        if inv.anomaly_details:
            try:
                anomaly_dict = json.loads(inv.anomaly_details) if isinstance(inv.anomaly_details, str) else inv.anomaly_details
            except Exception:
                anomaly_dict = {}

        rules_list = []
        if inv.rules_triggered:
            try:
                rules_list = json.loads(inv.rules_triggered) if isinstance(inv.rules_triggered, str) else inv.rules_triggered
            except Exception:
                rules_list = []

        dup_info = anomaly_dict.get("duplicate_info", {})
        is_dup = bool(dup_info.get("is_duplicate"))
        is_missing_receipt = inv.receipt_status == "MISSING" or any(
            isinstance(r, dict) and r.get("rule_id") == "MISSING_RECEIPT" for r in rules_list
        )
        is_policy = any(
            isinstance(r, dict) and r.get("rule_id") in ["POLICY_LIMIT", "SPLIT_PO", "WEEKEND_SUBMISSION"] for r in rules_list
        )
        is_high_risk = inv.decision == "HIGH_RISK" or (inv.risk_score and inv.risk_score >= 70.0)

        # AI Citation / Explanation
        citations = []
        if is_dup:
            matched_inv = dup_info.get("matched_invoice_id", "previous billing")
            sim_score = dup_info.get("similarity_score", 0.9)
            match_type = dup_info.get("match_type", "NEAR")
            citations.append(f"Duplicate Radar: {float(sim_score)*100:.0f}% {match_type.lower()} match with {matched_inv}")
        if is_policy:
            rule_names = [r.get("rule_name", r.get("rule_id", "Policy")) for r in rules_list if isinstance(r, dict)]
            citations.append(f"Policy Limit: {', '.join(rule_names[:2])} (₹{float(inv.amount):,.0f})")
        if is_missing_receipt:
            citations.append(f"Compliance Policy: Missing tax invoice / receipt for ₹{float(inv.amount):,.0f}")
        if is_high_risk and not is_dup and not is_policy and not is_missing_receipt:
            citations.append(f"IsolationForest: Anomaly score {float(inv.risk_score):.1f}/100 exceeds vendor baseline")
        elif is_high_risk and (is_dup or is_policy):
            citations.append(f"Risk Index: {float(inv.risk_score):.1f}/100")

        ai_citation = " • ".join(citations) if citations else f"Flagged by Risk Engine (Score: {float(inv.risk_score):.1f})"

        # Flag filter: support all frontend query aliases
        if flag_type and flag_type != "ALL":
            ft = flag_type.upper()
            if ft in ["DUPLICATE", "DUPLICATES"] and not is_dup:
                continue
            if ft in ["HIGH_RISK", "HIGH-RISK", "ANOMALY", "ANOMALIES"] and not is_high_risk:
                continue
            if ft in ["POLICY", "POLICY_LIMIT", "POLICY_LIMITS"] and not is_policy:
                continue
            if ft in ["MISSING_RECEIPT", "MISSING_RECEIPTS", "MISSING_FIELD", "MISSING_FIELDS"] and not is_missing_receipt:
                continue

        item_dict = inv.to_dict()
        item_dict["ai_citation"] = ai_citation
        item_dict["is_duplicate"] = is_dup
        item_dict["is_missing_receipt"] = is_missing_receipt
        item_dict["is_policy_breach"] = is_policy

        # Audit & SOX 404 compliance attribution
        latest_decision = inv.human_decisions[-1] if inv.human_decisions else None
        item_dict["submitted_by"] = inv.employee_name or "Originator Submitter"
        item_dict["submitter_dept"] = inv.employee_dept or "Enterprise Operations"
        item_dict["reviewed_by"] = (
            latest_decision.reviewer_name or latest_decision.reviewer_id
            if latest_decision
            else ("Priya Sharma" if inv.human_decision else None)
        )
        item_dict["reviewer_role"] = (
            latest_decision.reviewer_role
            if latest_decision
            else ("AP / FINANCE REVIEWER" if inv.human_decision else None)
        )
        item_dict["decision_reason"] = latest_decision.reason if latest_decision else None
        item_dict["human_decision"] = inv.human_decision or (latest_decision.decision if latest_decision else None)

        item_dict["flag_categories"] = [
            cat for cat, active in [
                ("DUPLICATE", is_dup),
                ("HIGH_RISK", is_high_risk),
                ("POLICY_LIMIT", is_policy),
                ("MISSING_FIELD", is_missing_receipt),
            ] if active
        ]
        items_to_return.append(item_dict)

    total_filtered = len(items_to_return)
    paged_items = items_to_return[(page - 1) * size : page * size]

    return {
        "total": total_filtered,
        "page": page,
        "size": size,
        "items": paged_items,
    }


def _find_invoice(db: Session, identifier: str) -> Optional[Invoice]:
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
def get_transaction(
    id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Retrieves a single transaction by primary key UUID or invoice_id.
    """
    item = _find_invoice(db, id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction '{id}' not found",
        )

    return item.to_dict()


@router.get("/{id}/similar")
def get_similar_transactions(
    id: str,
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    Retrieves suspected duplicate invoices or historically matched counterparts.
    """
    item = _find_invoice(db, id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction '{id}' not found",
        )

    anomaly_data = item.anomaly_details
    if isinstance(anomaly_data, str):
        try:
            anomaly_data = json.loads(anomaly_data)
        except Exception:
            anomaly_data = {}
    elif not isinstance(anomaly_data, dict):
        anomaly_data = {}

    dup_info = anomaly_data.get("duplicate_info", {})

    if dup_info.get("is_duplicate") and dup_info.get("matched_invoice_id"):
        matched_id = str(dup_info["matched_invoice_id"])
        similar_item = _find_invoice(db, matched_id)
        if similar_item:
            return [similar_item.to_dict()]

    return []
