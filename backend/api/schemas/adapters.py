import datetime
import json
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.schemas.invoice import InvoiceResponse
from engine.counterfactual import generate_counterfactuals
from models import AuditEvent, Evidence, ExceptionRecord, Invoice, RiskAssessment


class InvestigationResponse(BaseModel):
    """
    Forensic Workspace Adapter Schema.
    Deeply joins normalized Invoice, RiskAssessment, Exceptions, Evidence,
    and AuditEvents into the exact flat dictionary shape expected by the Next.js UI.
    """
    transaction: InvoiceResponse
    behavioral_analysis: Dict[str, Any]
    duplicate_evidence: Optional[Dict[str, Any]] = None
    policy_violations: List[Dict[str, Any]]
    anomaly_details: Dict[str, Any]
    relationship_flags: List[Any]
    evidence_graph: Dict[str, Any]
    counterfactual_steps: List[Dict[str, Any]]
    audit_timeline: List[Dict[str, Any]]
    recommendation: str


def build_investigation_package(invoice: Invoice, db: Session) -> Dict[str, Any]:
    """
    Adapter function that joins relational models and serializes the complete
    forensic investigation package for the Next.js /investigate/[id] workspace.
    """
    # 1. Base transaction payload
    tx_dict = invoice.to_dict()

    # 2. Extract latest Assessment and Evidence if present
    latest_assessment = (
        db.query(RiskAssessment)
        .filter_by(invoice_id=invoice.id)
        .order_by(RiskAssessment.version.desc())
        .first()
    )

    evidence_obj = None
    if latest_assessment:
        evidence_obj = db.query(Evidence).filter_by(assessment_id=latest_assessment.id).first()

    # Parse fallback anomaly details
    raw_anomaly = invoice.anomaly_details
    if isinstance(raw_anomaly, str):
        try:
            raw_anomaly = json.loads(raw_anomaly)
        except Exception:
            raw_anomaly = {}
    elif not isinstance(raw_anomaly, dict):
        raw_anomaly = {}

    behavioral_analysis = (
        (evidence_obj.behavioral_analysis if evidence_obj and evidence_obj.behavioral_analysis else None)
        or raw_anomaly.get("behavioral_info")
        or {}
    )

    duplicate_evidence = (
        (evidence_obj.duplicate_evidence if evidence_obj and evidence_obj.duplicate_evidence else None)
        or raw_anomaly.get("duplicate_info")
        or {}
    )

    relationship_flags = (
        (evidence_obj.relationship_flags if evidence_obj and evidence_obj.relationship_flags else None)
        or raw_anomaly.get("relationship_info", {}).get("relationship_flags")
        or []
    )

    # 3. Policy Violations
    exceptions = (
        db.query(ExceptionRecord)
        .filter_by(invoice_id=invoice.id)
        .all()
    )

    policy_violations = []
    if exceptions:
        for exc in exceptions:
            policy_violations.append({
                "rule_id": exc.rule_id,
                "rule_name": exc.rule.name if exc.rule else exc.rule_id,
                "description": exc.message,
                "score_contribution": float(exc.severity_score),
            })
    else:
        raw_rules = invoice.rules_triggered
        if isinstance(raw_rules, str):
            try:
                raw_rules = json.loads(raw_rules)
            except Exception:
                raw_rules = []
        if isinstance(raw_rules, list):
            policy_violations = raw_rules

    # 4. Counterfactual steps
    counterfactual_steps = []
    if evidence_obj and evidence_obj.counterfactual_steps:
        counterfactual_steps = evidence_obj.counterfactual_steps
    else:
        try:
            counterfactual_steps = generate_counterfactuals(
                transaction=tx_dict,
                policy_rules=policy_violations,
                duplicate_info=duplicate_evidence,
                behavioral_info=behavioral_analysis,
                risk_score=invoice.risk_score or 0.0,
                decision=invoice.decision or "AUTO_PASS",
            )
        except Exception:
            counterfactual_steps = []

    # 5. Evidence Graph
    evidence_graph = {"nodes": [], "edges": []}
    if evidence_obj and evidence_obj.evidence_graph and evidence_obj.evidence_graph.get("nodes"):
        evidence_graph = evidence_obj.evidence_graph
    else:
        nodes = []
        edges = []

        # Core nodes
        nodes.append({
            "id": str(invoice.id),
            "label": f"Invoice\n{invoice.invoice_id}",
            "type": "transaction",
            "risk": float(invoice.risk_score or 0.0),
        })
        ven_id = invoice.vendor_id or "unknown"
        ven_name = invoice.vendor_name or "Unknown Vendor"
        emp_id = invoice.employee_id or "unknown"
        emp_name = invoice.employee_name or "Unknown Employee"

        nodes.append({"id": f"vendor_{ven_id}", "label": ven_name, "type": "vendor"})
        nodes.append({"id": f"emp_{emp_id}", "label": emp_name, "type": "employee"})

        edges.append({"source": f"emp_{emp_id}", "target": str(invoice.id), "label": "submitted"})
        edges.append({"source": str(invoice.id), "target": f"vendor_{ven_id}", "label": "paid to"})

        # Rule nodes
        for rule in policy_violations:
            r_id = f"rule_{rule.get('rule_id', 'unknown')}"
            nodes.append({
                "id": r_id,
                "label": rule.get("rule_name", "Rule"),
                "type": "rule",
                "contribution": rule.get("score_contribution", 0.0),
            })
            edges.append({"source": str(invoice.id), "target": r_id, "label": "triggered"})

        # Duplicate node
        if duplicate_evidence and duplicate_evidence.get("is_duplicate"):
            matched_id = duplicate_evidence.get("matched_invoice_id", "unknown")
            sim = duplicate_evidence.get("similarity_score", 0.0)
            nodes.append({
                "id": f"dup_{matched_id}",
                "label": f"Matched Invoice\n({int(sim * 100)}% similar)",
                "type": "duplicate",
            })
            edges.append({
                "source": str(invoice.id),
                "target": f"dup_{matched_id}",
                "label": f"{int(sim * 100)}% similar",
            })

        # Risk score node
        score_val = float(invoice.risk_score or 0.0)
        nodes.append({
            "id": "risk_score",
            "label": f"Risk Score\n{score_val:.0f}",
            "type": "risk",
            "value": score_val,
        })
        edges.append({"source": str(invoice.id), "target": "risk_score", "label": "scored"})

        # Decision node
        dec = invoice.decision or "PENDING"
        decision_id = f"decision_{dec}"
        nodes.append({"id": decision_id, "label": dec.replace("_", " "), "type": "decision"})
        edges.append({"source": "risk_score", "target": decision_id, "label": "resulted in"})

        evidence_graph = {"nodes": nodes, "edges": edges}

    # 6. Recommendation
    recommendation = ""
    if evidence_obj and evidence_obj.recommendation:
        recommendation = evidence_obj.recommendation
    else:
        reasons = []
        if policy_violations:
            reasons.append(f"{len(policy_violations)} policy rule(s) triggered")
        if duplicate_evidence and duplicate_evidence.get("is_duplicate"):
            sim_pct = int(duplicate_evidence.get("similarity_score", 0) * 100)
            reasons.append(f"possible duplicate detected ({sim_pct}% similarity)")
        if behavioral_analysis and isinstance(behavioral_analysis, dict):
            b_score = behavioral_analysis.get("behavioral_anomaly_score", 0)
            if b_score and b_score > 30:
                reasons.append("significant behavioral anomaly detected")
        if relationship_flags:
            reasons.append(f"{len(relationship_flags)} relationship anomaly flag(s)")

        if invoice.decision == "AUTO_PASS":
            recommendation = "Transaction falls within normal parameters and all policies. Automatically approved with high confidence."
        elif invoice.decision == "HIGH_RISK":
            rec_parts = ["Multiple high-risk signals require immediate investigation."]
            if reasons:
                rec_parts.append(f"Key findings: {'; '.join(reasons)}.")
            rec_parts.append("Recommend holding payment pending review.")
            recommendation = " ".join(rec_parts)
        else:
            rec_parts = ["Manual review required."]
            if reasons:
                rec_parts.append(f"Findings: {'; '.join(reasons)}.")
            rec_parts.append("Verify supporting documentation before approval.")
            recommendation = " ".join(rec_parts)

    # 7. Audit Timeline
    events = (
        db.query(AuditEvent)
        .filter(
            (AuditEvent.transaction_id == str(invoice.id))
            | (AuditEvent.transaction_id == invoice.invoice_id)
        )
        .order_by(AuditEvent.block_index.asc())
        .all()
    )

    event_descriptions = {
        "INVOICE_PROCESSED": "Invoice processed by AI risk engine",
        "TRANSACTION_PROCESSED": "Transaction processed by risk engine",
        "HUMAN_REVIEW_SUBMITTED": "Human reviewer submitted governance decision",
        "VALIDATION_FAILED": "Validation checks flagged exception",
        "DUPLICATE_DETECTED": "Possible duplicate invoice detected",
        "POLICY_VIOLATION": "Deterministic compliance rule triggered",
        "ANOMALY_DETECTED": "Behavioral anomaly detected",
    }

    audit_timeline = []
    for e in events:
        e_data = e.event_data
        if isinstance(e_data, str):
            try:
                e_data = json.loads(e_data)
            except Exception:
                e_data = {}

        audit_timeline.append({
            "type": e.event_type,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "hash": e.hash,
            "prev_hash": e.prev_hash,
            "block_index": e.block_index,
            "description": event_descriptions.get(e.event_type, e.event_type),
            "data": e_data,
        })

    return {
        "transaction": tx_dict,
        "behavioral_analysis": behavioral_analysis,
        "duplicate_evidence": duplicate_evidence,
        "policy_violations": policy_violations,
        "anomaly_details": raw_anomaly.get("anomaly_info", {}),
        "relationship_flags": relationship_flags,
        "evidence_graph": evidence_graph,
        "counterfactual_steps": counterfactual_steps,
        "audit_timeline": audit_timeline,
        "recommendation": recommendation,
    }
