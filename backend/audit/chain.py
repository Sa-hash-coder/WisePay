import datetime
import hashlib
import json
import sys
from pathlib import Path
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from models import AuditEvent
except ImportError:
    from backend.models import AuditEvent

def get_hash(data: str) -> str:
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def create_audit_event(transaction_id: str, event_type: str, event_data: dict, db: Session):
    # Get last event in the global ledger
    last_event = db.query(AuditEvent).order_by(AuditEvent.block_index.desc()).first()
    
    prev_hash = last_event.hash if last_event else "0"
    block_index = (last_event.block_index + 1) if last_event else 0
    
    event_data_str = json.dumps(event_data, sort_keys=True) if isinstance(event_data, (dict, list)) else str(event_data)
    timestamp = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    ts_str = timestamp.isoformat()
    
    # Compute SHA-256 hash
    hash_input = f"{transaction_id}{event_type}{event_data_str}{ts_str}{prev_hash}{block_index}"
    current_hash = get_hash(hash_input)
    
    new_event = AuditEvent(
        transaction_id=transaction_id,
        event_type=event_type,
        event_data=event_data,
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
        if isinstance(event.event_data, (dict, list)):
            event_data_str = json.dumps(event.event_data, sort_keys=True)
        else:
            try:
                parsed = json.loads(event.event_data)
                event_data_str = json.dumps(parsed, sort_keys=True)
            except Exception:
                event_data_str = str(event.event_data)

        ts = event.timestamp.replace(tzinfo=None) if (event.timestamp and event.timestamp.tzinfo) else event.timestamp
        ts_str = ts.isoformat() if ts else ""
        
        # Check standard ISO variants (e.g. with/without +00:00 suffix)
        ts_candidates = [ts_str, f"{ts_str}+00:00", ts_str.replace("+00:00", "")]
        matched = False
        for cand in ts_candidates:
            hash_input = f"{event.transaction_id}{event.event_type}{event_data_str}{cand}{event.prev_hash}{event.block_index}"
            if get_hash(hash_input) == event.hash:
                matched = True
                break

        if not matched:
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


def verify_global_ledger(db: Session):
    """
    Verifies the entire sequential SHA-256 cryptographic audit ledger.
    Recalculates all historical block hashes and chain links to detect any tampering.
    """
    events = db.query(AuditEvent).order_by(AuditEvent.block_index.asc()).all()
    if not events:
        return {
            "verified": True,
            "total_entries": 0,
            "verified_entries": 0,
            "signatures_verified": 0,
            "broken_links": 0,
            "status": "VALID",
            "broken_details": [],
            "verification_time": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "business_id": "WISEPAY-SOX-404-LEDGER-CORP",
        }

    broken_links = 0
    verified_entries = 0
    broken_details = []

    for idx, event in enumerate(events):
        is_block_valid = True
        reason = None

        # 1. Verify link to previous ledger block
        if event.block_index > 0:
            prev_block = events[idx - 1]
            if event.prev_hash != prev_block.hash:
                is_block_valid = False
                reason = "Previous block hash pointer mismatch"

        # 2. Recompute payload hash
        if isinstance(event.event_data, (dict, list)):
            event_data_str = json.dumps(event.event_data, sort_keys=True)
        else:
            try:
                parsed = json.loads(event.event_data)
                event_data_str = json.dumps(parsed, sort_keys=True)
            except Exception:
                event_data_str = str(event.event_data)

        ts = event.timestamp.replace(tzinfo=None) if (event.timestamp and event.timestamp.tzinfo) else event.timestamp
        ts_str = ts.isoformat() if ts else ""

        # Check standard ISO variants (e.g. with/without +00:00 suffix)
        ts_candidates = [ts_str, f"{ts_str}+00:00", ts_str.replace("+00:00", "")]
        payload_matched = False
        for cand in ts_candidates:
            hash_input = f"{event.transaction_id}{event.event_type}{event_data_str}{cand}{event.prev_hash}{event.block_index}"
            if get_hash(hash_input) == event.hash:
                payload_matched = True
                break

        if not payload_matched:
            is_block_valid = False
            reason = "Cryptographic payload tampering / content hash mismatch"

        if is_block_valid:
            verified_entries += 1
        else:
            broken_links += 1
            broken_details.append({
                "block_index": event.block_index,
                "transaction_id": event.transaction_id,
                "event_type": event.event_type,
                "hash": event.hash,
                "reason": reason
            })

    is_chain_intact = (broken_links == 0)
    return {
        "verified": is_chain_intact,
        "total_entries": len(events),
        "verified_entries": verified_entries,
        "signatures_verified": verified_entries,
        "broken_links": broken_links,
        "status": "VALID" if is_chain_intact else "COMPROMISED",
        "broken_details": broken_details,
        "verification_time": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "business_id": "WISEPAY-SOX-404-LEDGER-CORP",
    }
