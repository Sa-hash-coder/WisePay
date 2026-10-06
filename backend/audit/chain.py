import hashlib
import json
import datetime
from sqlalchemy.orm import Session
from models import AuditEvent

def get_hash(data: str) -> str:
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def create_audit_event(transaction_id: str, event_type: str, event_data: dict, db: Session):
    # Get last event in the global ledger
    last_event = db.query(AuditEvent).order_by(AuditEvent.block_index.desc()).first()
    
    prev_hash = last_event.hash if last_event else "0"
    block_index = (last_event.block_index + 1) if last_event else 0
    
    event_data_str = json.dumps(event_data, sort_keys=True)
    timestamp = datetime.datetime.utcnow()
    
    # Compute SHA-256 hash
    hash_input = f"{transaction_id}{event_type}{event_data_str}{timestamp.isoformat()}{prev_hash}{block_index}"
    current_hash = get_hash(hash_input)
    
    new_event = AuditEvent(
        transaction_id=transaction_id,
        event_type=event_type,
        event_data=event_data_str,
        timestamp=timestamp,
        hash=current_hash,
        prev_hash=prev_hash,
        block_index=block_index
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

def verify_audit_trail(transaction_id: str, db: Session):
    events = db.query(AuditEvent).filter(
        AuditEvent.transaction_id == transaction_id
    ).order_by(AuditEvent.block_index.asc()).all()
    
    if not events:
        # If no audit event for this txn yet, create one
        return {"verified": True, "events": [], "mismatch_at": None}
        
    for event in events:
        # 1. Verify link to previous ledger block
        if event.block_index > 0:
            prev_block = db.query(AuditEvent).filter(
                AuditEvent.block_index == event.block_index - 1
            ).first()
            if prev_block and event.prev_hash != prev_block.hash:
                return {
                    "verified": False, 
                    "events": [e.id for e in events], 
                    "mismatch_at": event.block_index,
                    "reason": "Previous block hash pointer mismatch"
                }
        
        # 2. Recompute and verify event payload hash
        hash_input = f"{event.transaction_id}{event.event_type}{event.event_data}{event.timestamp.isoformat()}{event.prev_hash}{event.block_index}"
        recomputed_hash = get_hash(hash_input)
        
        if event.hash != recomputed_hash:
            return {
                "verified": False, 
                "events": [e.id for e in events], 
                "mismatch_at": event.block_index,
                "reason": "Cryptographic payload tampering detected"
            }
            
    return {
        "verified": True, 
        "events": [
            {
                "id": e.id, 
                "type": e.event_type, 
                "timestamp": e.timestamp.isoformat(), 
                "hash": e.hash,
                "prev_hash": e.prev_hash,
                "block_index": e.block_index
            } for e in events
        ], 
        "mismatch_at": None
    }
