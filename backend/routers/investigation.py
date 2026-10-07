from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Transaction, AuditEvent
import json
from engine.counterfactual import generate_counterfactuals

import uuid

router = APIRouter(prefix="/api/investigation", tags=["investigation"])

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

@router.get("/{id}")
def get_investigation_package(id: str, db: Session = Depends(get_db)):
    t = find_transaction(id, db)
    if not t:
        return {"error": "Not found"}
        
    anomaly_details = json.loads(t.anomaly_details) if t.anomaly_details else {}
    policy_rules = json.loads(t.rules_triggered) if t.rules_triggered else []
    
    # Counterfactuals
    counterfactuals = generate_counterfactuals(
        t.to_dict(), 
        policy_rules, 
        anomaly_details.get('duplicate_info', {}),
        anomaly_details.get('behavioral_info', {}),
        t.risk_score,
        t.decision
    )
    
    # Audit Timeline — enrich with descriptions
    id_candidates = list({str(id), str(t.id), str(t.invoice_id)})
    events = db.query(AuditEvent).filter(AuditEvent.transaction_id.in_(id_candidates)).order_by(AuditEvent.block_index.asc()).all()
    
    event_descriptions = {
        "TRANSACTION_PROCESSED": "Transaction processed by risk engine",
        "HUMAN_REVIEW_SUBMITTED": "Human reviewer submitted decision",
        "VALIDATION_FAILED": "Validation checks failed",
        "DUPLICATE_DETECTED": "Possible duplicate detected",
        "POLICY_VIOLATION": "Policy rule triggered",
        "ANOMALY_DETECTED": "Behavioral anomaly detected",
    }
    
    audit_timeline = []
    for e in events:
        event_data = {}
        try:
            event_data = json.loads(e.event_data) if e.event_data else {}
        except Exception:
            pass
            
        audit_timeline.append({
            "type": e.event_type,
            "timestamp": e.timestamp.isoformat(),
            "hash": e.hash,
            "prev_hash": e.prev_hash,
            "block_index": e.block_index,
            "description": event_descriptions.get(e.event_type, e.event_type),
            "data": event_data
        })
    
    # Evidence Graph — build rich graph structure
    relationship_info = anomaly_details.get('relationship_info', {})
    nodes = []
    edges = []
    
    # Core nodes
    nodes.append({"id": t.id, "label": f"Invoice\n{t.invoice_id}", "type": "transaction", "risk": t.risk_score})
    nodes.append({"id": f"vendor_{t.vendor_id}", "label": t.vendor_name, "type": "vendor"})
    nodes.append({"id": f"emp_{t.employee_id}", "label": t.employee_name, "type": "employee"})
    
    edges.append({"source": f"emp_{t.employee_id}", "target": t.id, "label": "submitted"})
    edges.append({"source": t.id, "target": f"vendor_{t.vendor_id}", "label": "paid to"})
    
    # Rule nodes
    for rule in policy_rules:
        r_id = f"rule_{rule['rule_id']}"
        nodes.append({"id": r_id, "label": rule['rule_name'], "type": "rule", "contribution": rule['score_contribution']})
        edges.append({"source": t.id, "target": r_id, "label": "triggered"})
    
    # Duplicate node
    dup_info = anomaly_details.get('duplicate_info', {})
    if dup_info and dup_info.get('is_duplicate'):
        matched_id = dup_info.get('matched_invoice_id', 'unknown')
        sim = dup_info.get('similarity_score', 0)
        nodes.append({"id": f"dup_{matched_id}", "label": f"Matched Invoice\n({int(sim*100)}% similar)", "type": "duplicate"})
        edges.append({"source": t.id, "target": f"dup_{matched_id}", "label": f"{int(sim*100)}% similar"})
    
    # Risk score node
    nodes.append({"id": "risk_score", "label": f"Risk Score\n{t.risk_score:.0f}", "type": "risk", "value": t.risk_score})
    edges.append({"source": t.id, "target": "risk_score", "label": "scored"})
    
    # Decision node
    decision_id = f"decision_{t.decision}"
    nodes.append({"id": decision_id, "label": t.decision.replace("_", " "), "type": "decision"})
    edges.append({"source": "risk_score", "target": decision_id, "label": "resulted in"})
    
    # Build recommendation text grounded in data
    reasons = []
    if policy_rules:
        reasons.append(f"{len(policy_rules)} policy rule(s) triggered")
    if dup_info and dup_info.get('is_duplicate'):
        reasons.append(f"possible duplicate detected ({int(dup_info.get('similarity_score', 0)*100)}% similarity)")
    beh = anomaly_details.get('behavioral_info', {})
    if beh and isinstance(beh, dict):
        score = beh.get('behavioral_anomaly_score', 0)
        if score and score > 30:
            reasons.append("significant behavioral anomaly detected")
    rel_flags = relationship_info.get('relationship_flags', [])
    if rel_flags:
        reasons.append(f"{len(rel_flags)} relationship anomaly flag(s)")
    
    if t.decision == "AUTO_PASS":
        recommendation = "Transaction falls within normal parameters and all policies. Automatically approved with high confidence."
    elif t.decision == "HIGH_RISK":
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
    
    return {
        "transaction": t.to_dict(),
        "behavioral_analysis": anomaly_details.get('behavioral_info', {}),
        "duplicate_evidence": anomaly_details.get('duplicate_info', {}),
        "policy_violations": policy_rules,
        "anomaly_details": anomaly_details.get('anomaly_info', {}),
        "relationship_flags": relationship_info.get('relationship_flags', []),
        "evidence_graph": {
            "nodes": nodes,
            "edges": edges
        },
        "counterfactual_steps": counterfactuals,
        "audit_timeline": audit_timeline,
        "recommendation": recommendation
    }
