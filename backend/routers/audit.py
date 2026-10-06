from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import AuditEvent
from audit.chain import verify_audit_trail

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/chain")
def get_full_chain(
    page: int = Query(1, ge=1), 
    size: int = Query(50, ge=1, le=100), 
    db: Session = Depends(get_db)
):
    events = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).offset((page - 1) * size).limit(size).all()
    return [e.to_dict() for e in events]

@router.get("/{transaction_id}")
def get_audit_trail(transaction_id: str, db: Session = Depends(get_db)):
    events = db.query(AuditEvent).filter(
        AuditEvent.transaction_id == transaction_id
    ).order_by(AuditEvent.block_index.asc()).all()
    return [e.to_dict() for e in events]

@router.post("/{transaction_id}/verify")
def verify_trail(transaction_id: str, db: Session = Depends(get_db)):
    return verify_audit_trail(transaction_id, db)
