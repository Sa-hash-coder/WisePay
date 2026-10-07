import sys
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from api.deps import get_db
from models import Invoice

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns aggregated metrics for the top KPI row on the dashboard.
    Coerces financial sums and metrics to float for strict Next.js compatibility.
    """
    total = db.query(Invoice).count()
    auto_pass = db.query(Invoice).filter(Invoice.decision == "AUTO_PASS").count()
    human_review = db.query(Invoice).filter(Invoice.decision == "HUMAN_REVIEW").count()
    high_risk = db.query(Invoice).filter(Invoice.decision == "HIGH_RISK").count()

    human_attention_saved_pct = round((auto_pass / total) * 100, 1) if total > 0 else 0.0

    total_amount_dec = db.query(func.sum(Invoice.amount)).scalar()
    flagged_amount_dec = (
        db.query(func.sum(Invoice.amount))
        .filter(Invoice.decision != "AUTO_PASS")
        .scalar()
    )

    total_amount = float(total_amount_dec) if total_amount_dec is not None else 0.0
    flagged_amount = float(flagged_amount_dec) if flagged_amount_dec is not None else 0.0

    return {
        "total": total,
        "auto_pass": auto_pass,
        "human_review": human_review,
        "high_risk": high_risk,
        "human_attention_saved_pct": human_attention_saved_pct,
        "total_amount": round(total_amount, 2),
        "flagged_amount": round(flagged_amount, 2),
    }


@router.get("/risk_distribution")
def get_risk_distribution(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Generates a 10-bucket histogram of risk scores across all ingested invoices.
    Labels: 0-9, 10-19, ..., 90-99
    """
    distribution = [0] * 10
    scores = db.query(Invoice.risk_score).all()

    for (score,) in scores:
        if score is not None:
            bucket = min(9, max(0, int(float(score) // 10)))
            distribution[bucket] += 1

    return {
        "labels": [f"{i * 10}-{i * 10 + 9}" for i in range(10)],
        "data": distribution,
    }


@router.get("/top_risk_categories")
def get_top_risk_categories(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Calculates the top 5 most frequently triggered policy violation categories
    among non-auto-pass invoices.
    """
    invoices = (
        db.query(Invoice.rules_triggered)
        .filter(
            Invoice.rules_triggered.isnot(None),
            Invoice.decision != "AUTO_PASS",
        )
        .all()
    )

    rule_counts: Dict[str, int] = {}
    import json

    for (rules_raw,) in invoices:
        if not rules_raw:
            continue
        rules_list = []
        if isinstance(rules_raw, str):
            try:
                rules_list = json.loads(rules_raw)
            except Exception:
                continue
        elif isinstance(rules_raw, list):
            rules_list = rules_raw

        for rule in rules_list:
            if isinstance(rule, dict):
                r_name = rule.get("rule_name") or rule.get("rule_id") or "Unknown"
                rule_counts[r_name] = rule_counts.get(r_name, 0) + 1

    sorted_rules = sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    return [{"category": k, "count": v} for k, v in sorted_rules]


@router.get("/recent_activity")
def get_recent_activity(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Returns the 20 most recently processed invoices formatted with to_dict().
    """
    recent = db.query(Invoice).order_by(Invoice.processed_at.desc()).limit(20).all()
    return [t.to_dict() for t in recent]


@router.get("/network")
def get_network(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Builds the high-risk employee-vendor cluster graph for the interactive network visualization.
    """
    flagged = (
        db.query(Invoice)
        .filter(Invoice.decision != "AUTO_PASS")
        .order_by(Invoice.risk_score.desc())
        .limit(80)
        .all()
    )

    nodes_map: Dict[str, Dict[str, Any]] = {}
    edge_weights: Dict[str, Dict[str, Any]] = {}

    for t in flagged:
        emp_id = t.employee_id or "EMP_UNKNOWN"
        ven_id = t.vendor_id or "VEN_UNKNOWN"
        emp_name = t.employee_name or (t.employee.name if t.employee else emp_id)
        ven_name = t.vendor_name or (t.vendor.name if t.vendor else ven_id)

        e_node_id = f"emp_{emp_id}"
        v_node_id = f"ven_{ven_id}"

        if e_node_id not in nodes_map:
            nodes_map[e_node_id] = {
                "id": e_node_id,
                "label": emp_name,
                "type": "employee",
                "dept": t.employee_dept or (t.employee.department if t.employee else "General"),
                "count": 0,
            }
        if v_node_id not in nodes_map:
            nodes_map[v_node_id] = {
                "id": v_node_id,
                "label": ven_name,
                "type": "vendor",
                "category": t.category or "General",
                "count": 0,
            }

        nodes_map[e_node_id]["count"] += 1
        nodes_map[v_node_id]["count"] += 1

        edge_key = f"{e_node_id}-{v_node_id}"
        if edge_key not in edge_weights:
            edge_weights[edge_key] = {
                "source": e_node_id,
                "target": v_node_id,
                "weight": 0.0,
                "count": 0,
            }
        edge_weights[edge_key]["weight"] += float(t.amount) if t.amount is not None else 0.0
        edge_weights[edge_key]["count"] += 1

    return {
        "nodes": list(nodes_map.values()),
        "edges": list(edge_weights.values()),
    }


@router.get("/processing_stream")
def get_processing_stream(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Returns an informative sample across all 3 decision tiers for the live stream UI component.
    """
    high_risk = db.query(Invoice).filter(Invoice.decision == "HIGH_RISK").limit(5).all()
    human_review = db.query(Invoice).filter(Invoice.decision == "HUMAN_REVIEW").limit(8).all()
    auto_pass = db.query(Invoice).filter(Invoice.decision == "AUTO_PASS").limit(7).all()

    combined = high_risk + human_review + auto_pass
    combined.sort(key=lambda t: t.processed_at or t.created_at, reverse=True)
    return [t.to_dict() for t in combined]
