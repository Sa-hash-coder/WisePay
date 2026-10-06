from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Transaction
import json

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.get("")
def get_transactions(
    decision: str = None, 
    page: int = Query(1, ge=1), 
    size: int = Query(50, ge=1, le=200),
    sort: str = Query("risk_score"),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if decision:
        # Support comma-separated decisions e.g. HUMAN_REVIEW,HIGH_RISK
        decisions = [d.strip() for d in decision.split(",")]
        query = query.filter(Transaction.decision.in_(decisions))
        
    total = query.count()
    items = query.order_by(Transaction.risk_score.desc()).offset((page - 1) * size).limit(size).all()
    
    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [t.to_dict() for t in items]
    }

@router.get("/{id}")
def get_transaction(id: str, db: Session = Depends(get_db)):
    item = db.query(Transaction).filter(Transaction.id == id).first()
    if not item:
         return {"error": "Not found"}
    return item.to_dict()

@router.get("/{id}/similar")
def get_similar(id: str, db: Session = Depends(get_db)):
    item = db.query(Transaction).filter(Transaction.id == id).first()
    if not item:
         return {"error": "Not found"}
         
    anomaly_details = json.loads(item.anomaly_details) if item.anomaly_details else {}
    duplicate_info = anomaly_details.get('duplicate_info', {})
    
    if duplicate_info.get('is_duplicate') and duplicate_info.get('matched_invoice_id'):
        matched_id = duplicate_info['matched_invoice_id']
        similar_item = db.query(Transaction).filter(Transaction.id == matched_id).first()
        if similar_item:
            return [similar_item.to_dict()]
            
    return []
