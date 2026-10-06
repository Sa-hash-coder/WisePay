from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Transaction
import json

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Transaction).count()
    auto_pass = db.query(Transaction).filter(Transaction.decision == "AUTO_PASS").count()
    human_review = db.query(Transaction).filter(Transaction.decision == "HUMAN_REVIEW").count()
    high_risk = db.query(Transaction).filter(Transaction.decision == "HIGH_RISK").count()
    
    human_attention_saved_pct = round((auto_pass / total) * 100, 1) if total > 0 else 0
    
    total_amount = db.query(func.sum(Transaction.amount)).scalar() or 0
    flagged_amount = db.query(func.sum(Transaction.amount)).filter(Transaction.decision != "AUTO_PASS").scalar() or 0
    
    return {
        "total": total,
        "auto_pass": auto_pass,
        "human_review": human_review,
        "high_risk": high_risk,
        "human_attention_saved_pct": human_attention_saved_pct,
        "total_amount": float(total_amount),
        "flagged_amount": float(flagged_amount)
    }

@router.get("/risk_distribution")
def get_risk_distribution(db: Session = Depends(get_db)):
    distribution = [0] * 10
    scores = db.query(Transaction.risk_score).all()
    
    for (score,) in scores:
        if score is not None:
            bucket = min(9, int(score // 10))
            distribution[bucket] += 1
        
    return {
        "labels": [f"{i*10}-{i*10+9}" for i in range(10)],
        "data": distribution
    }

@router.get("/top_risk_categories")
def get_top_risk_categories(db: Session = Depends(get_db)):
    transactions = db.query(Transaction.rules_triggered).filter(
        Transaction.rules_triggered != "[]",
        Transaction.rules_triggered != None,
        Transaction.decision != "AUTO_PASS"
    ).all()
    rule_counts = {}
    
    for (rules_str,) in transactions:
        if not rules_str: continue
        try:
            rules = json.loads(rules_str)
            for rule in rules:
                r_name = rule.get('rule_name', 'Unknown')
                rule_counts[r_name] = rule_counts.get(r_name, 0) + 1
        except Exception:
            continue
            
    sorted_rules = sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    return [{"category": k, "count": v} for k, v in sorted_rules]

@router.get("/recent_activity")
def get_recent_activity(db: Session = Depends(get_db)):
    recent = db.query(Transaction).order_by(Transaction.processed_at.desc()).limit(20).all()
    return [t.to_dict() for t in recent]

@router.get("/network")
def get_network(db: Session = Depends(get_db)):
    # Return simplified network of flagged transactions
    flagged = db.query(Transaction).filter(
        Transaction.decision != "AUTO_PASS"
    ).order_by(Transaction.risk_score.desc()).limit(80).all()
    
    nodes_map = {}
    edges = []
    edge_weights = {}
    
    for t in flagged:
        e_node_id = f"emp_{t.employee_id}"
        v_node_id = f"ven_{t.vendor_id}"
        
        if e_node_id not in nodes_map:
            nodes_map[e_node_id] = {
                "id": e_node_id, 
                "label": t.employee_name, 
                "type": "employee",
                "dept": t.employee_dept,
                "count": 0
            }
        if v_node_id not in nodes_map:
            nodes_map[v_node_id] = {
                "id": v_node_id, 
                "label": t.vendor_name, 
                "type": "vendor",
                "category": t.category,
                "count": 0
            }
        
        nodes_map[e_node_id]["count"] += 1
        nodes_map[v_node_id]["count"] += 1
            
        edge_key = f"{e_node_id}-{v_node_id}"
        if edge_key not in edge_weights:
            edge_weights[edge_key] = {"source": e_node_id, "target": v_node_id, "weight": 0, "count": 0}
        edge_weights[edge_key]["weight"] += t.amount
        edge_weights[edge_key]["count"] += 1
        
    return {
        "nodes": list(nodes_map.values()),
        "edges": list(edge_weights.values())
    }

@router.get("/processing_stream")
def get_processing_stream(db: Session = Depends(get_db)):
    # Mix of decisions for visual interest
    high_risk = db.query(Transaction).filter(Transaction.decision == "HIGH_RISK").limit(5).all()
    human_review = db.query(Transaction).filter(Transaction.decision == "HUMAN_REVIEW").limit(8).all()
    auto_pass = db.query(Transaction).filter(Transaction.decision == "AUTO_PASS").limit(7).all()
    combined = high_risk + human_review + auto_pass
    combined.sort(key=lambda t: t.processed_at, reverse=True)
    return [t.to_dict() for t in combined]
