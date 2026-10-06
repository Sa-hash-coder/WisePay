import random
import datetime
import pandas as pd
import numpy as np
import json
import uuid
from sqlalchemy.orm import Session
from models import Transaction, AuditEvent
from engine.validator import validate_transaction
from engine.duplicate_detector import detect_duplicates
from engine.policy_engine import evaluate_policies
from engine.behavioral import analyze_behavior
from engine.anomaly import train_anomaly_model, detect_anomaly
from engine.relationship import analyze_relationships
from engine.risk_scorer import calculate_risk
from audit.chain import create_audit_event

class NumpyJSONEncoder(json.JSONEncoder):
    """Custom encoder that handles numpy types."""
    def default(self, obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, (np.bool_,)):
            return bool(obj)
        if isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        return super().default(obj)

def safe_dumps(obj):
    return json.dumps(obj, cls=NumpyJSONEncoder)


def seed_database(db: Session):
    print("Starting database seed...")
    random.seed(42)
    np.random.seed(42)
    
    # 1. Generate Base Data
    vendors = [
        {"id": "V001", "name": "Infosys Technologies", "category": "IT Services", "historical_min": 50000, "historical_max": 500000},
        {"id": "V002", "name": "Tata Consultancy Services", "category": "IT Services", "historical_min": 80000, "historical_max": 800000},
        {"id": "V003", "name": "Office Supplies Co", "category": "Office", "historical_min": 2000, "historical_max": 25000},
        {"id": "V004", "name": "Azure Cloud Solutions", "category": "Cloud", "historical_min": 100000, "historical_max": 2000000},
        {"id": "V005", "name": "QuickPrint Pvt Ltd", "category": "Printing", "historical_min": 1500, "historical_max": 15000},
        {"id": "V006", "name": "Sharma Travels", "category": "Travel", "historical_min": 5000, "historical_max": 80000},
        {"id": "V007", "name": "Metro Catering", "category": "Food", "historical_min": 3000, "historical_max": 30000},
        {"id": "V008", "name": "TechEquip Solutions", "category": "Equipment", "historical_min": 25000, "historical_max": 300000},
        {"id": "V009", "name": "LegalEase Associates", "category": "Legal", "historical_min": 50000, "historical_max": 500000},
        {"id": "V010", "name": "GreenClean Facilities", "category": "Facility", "historical_min": 8000, "historical_max": 45000},
        {"id": "V011", "name": "DataVault Security", "category": "Security", "historical_min": 30000, "historical_max": 200000},
        {"id": "V012", "name": "Pioneer Logistics", "category": "Logistics", "historical_min": 10000, "historical_max": 100000},
        {"id": "V013", "name": "FinanceFirst Consulting", "category": "Consulting", "historical_min": 75000, "historical_max": 750000},
        {"id": "V014", "name": "MediaWorks Studio", "category": "Marketing", "historical_min": 20000, "historical_max": 150000},
        {"id": "V015", "name": "Rajesh Trading Co", "category": "Supplies", "historical_min": 4000, "historical_max": 40000},
        {"id": "V016", "name": "New Vendor Startup", "category": "Consulting", "historical_min": 10000, "historical_max": 20000} # New vendor
    ]
    
    depts = ["Finance", "Engineering", "Marketing", "Operations", "HR", "Legal", "Sales"]
    employees = [{"id": f"E{i:03d}", "name": f"Employee {i}", "dept": random.choice(depts)} for i in range(1, 51)]
    
    transactions = []
    start_date = datetime.datetime.now() - datetime.timedelta(days=365)
    
    # Generate ~9000 clean transactions
    for _ in range(9000):
        v = random.choice(vendors[:-1])
        e = random.choice(employees)
        amount = random.uniform(v['historical_min'], v['historical_max'])
        inv_date = start_date + datetime.timedelta(days=random.randint(0, 360))
        
        # Ensure not weekend for clean ones mostly
        if inv_date.weekday() >= 5 and random.random() < 0.9:
            inv_date -= datetime.timedelta(days=2)
            
        transactions.append({
            "id": str(uuid.uuid4()),
            "invoice_id": f"INV-{random.randint(10000, 99999)}",
            "employee_id": e['id'],
            "employee_name": e['name'],
            "employee_dept": e['dept'],
            "vendor_id": v['id'],
            "vendor_name": v['name'],
            "invoice_date": inv_date.isoformat(),
            "amount": round(amount, 2),
            "currency": "INR",
            "category": v['category'],
            "description": f"Standard payment for {v['category']}",
            "invoice_number": f"{v['id']}-{random.randint(1000, 9999)}",
            "approval_status": "APPROVED",
            "receipt_status": "UPLOADED",
            "payment_status": "PENDING",
            "policy_category": "Standard"
        })
        
    # Inject Anomalies (remaining ~1000)
    
    # 1. Exact duplicates (~30 pairs)
    for _ in range(30):
        t = random.choice(transactions).copy()
        t['id'] = str(uuid.uuid4())
        inv_date = datetime.datetime.fromisoformat(t['invoice_date']) + datetime.timedelta(days=random.randint(1, 5))
        t['invoice_date'] = inv_date.isoformat()
        transactions.append(t)
        
    # 2. Near-duplicates (~50 cases)
    for _ in range(50):
        t = random.choice(transactions).copy()
        t['id'] = str(uuid.uuid4())
        t['description'] = t['description'] + " (duplicate attempt)"
        inv_date = datetime.datetime.fromisoformat(t['invoice_date']) + datetime.timedelta(days=random.randint(1, 10))
        t['invoice_date'] = inv_date.isoformat()
        t['invoice_number'] = f"{t['vendor_id']}-{random.randint(1000, 9999)}" # Different invoice number
        transactions.append(t)
        
    # 3. Missing fields (~200 cases)
    for _ in range(200):
        v = random.choice(vendors[:-1])
        e = random.choice(employees)
        amount = random.uniform(v['historical_min'], v['historical_max'])
        inv_date = start_date + datetime.timedelta(days=random.randint(0, 360))
        
        t = {
            "id": str(uuid.uuid4()),
            "invoice_id": f"INV-{random.randint(10000, 99999)}",
            "employee_id": e['id'],
            "employee_name": e['name'],
            "employee_dept": e['dept'],
            "vendor_id": v['id'],
            "vendor_name": v['name'],
            "invoice_date": inv_date.isoformat(),
            "amount": round(amount, 2),
            "currency": "INR",
            "category": v['category'],
            "description": f"Payment for {v['category']}",
            "invoice_number": f"{v['id']}-{random.randint(1000, 9999)}",
            "approval_status": "PENDING", # Missing
            "receipt_status": "MISSING",  # Missing
            "payment_status": "PENDING",
            "policy_category": "Standard"
        }
        if random.random() < 0.2: t['invoice_number'] = None # Missing invoice num
        transactions.append(t)
        
    # 4. Policy violations (~100 cases)
    for _ in range(100):
        v = random.choice(vendors[:-1])
        e = random.choice(employees)
        amount = random.uniform(100000, 500000) # Large amount
        inv_date = start_date + datetime.timedelta(days=random.randint(0, 360))
        transactions.append({
            "id": str(uuid.uuid4()),
            "invoice_id": f"INV-{random.randint(10000, 99999)}",
            "employee_id": e['id'],
            "employee_name": e['name'],
            "employee_dept": e['dept'],
            "vendor_id": v['id'],
            "vendor_name": v['name'],
            "invoice_date": inv_date.isoformat(),
            "amount": round(amount, 2),
            "currency": "INR",
            "category": v['category'],
            "description": f"Large payment",
            "invoice_number": f"{v['id']}-{random.randint(1000, 9999)}",
            "approval_status": "PENDING", # Not approved
            "receipt_status": "UPLOADED",
            "payment_status": "PENDING",
            "policy_category": "Exception"
        })
        
    # 5. Vendor behavioral anomalies (~80 cases) - specifically V003 getting large amount
    for _ in range(80):
        v = vendors[2] # Office Supplies Co
        e = random.choice(employees)
        amount = random.uniform(300000, 500000) # Extremely large for this vendor (hist max 25k)
        inv_date = start_date + datetime.timedelta(days=random.randint(0, 360))
        transactions.append({
            "id": str(uuid.uuid4()),
            "invoice_id": f"INV-{random.randint(10000, 99999)}",
            "employee_id": e['id'],
            "employee_name": e['name'],
            "employee_dept": e['dept'],
            "vendor_id": v['id'],
            "vendor_name": v['name'],
            "invoice_date": inv_date.isoformat(),
            "amount": round(amount, 2),
            "currency": "INR",
            "category": v['category'],
            "description": f"Bulk office supplies anomaly",
            "invoice_number": f"{v['id']}-{random.randint(1000, 9999)}",
            "approval_status": "APPROVED",
            "receipt_status": "UPLOADED",
            "payment_status": "PENDING",
            "policy_category": "Standard"
        })
        
    # 6. Employee anomalies (employee expense > 3x typical) ~60 cases
    # We'll just generate high amounts. It will trigger since typical is lower.
    
    # 7. Suspicious clusters (~40 cases) - same emp, same vendor in short time
    e = employees[0]
    v = vendors[1]
    cluster_date = start_date + datetime.timedelta(days=180)
    for _ in range(15): # 15 invoices in 10 days
        inv_date = cluster_date + datetime.timedelta(days=random.randint(0, 10))
        transactions.append({
            "id": str(uuid.uuid4()),
            "invoice_id": f"INV-{random.randint(10000, 99999)}",
            "employee_id": e['id'],
            "employee_name": e['name'],
            "employee_dept": e['dept'],
            "vendor_id": v['id'],
            "vendor_name": v['name'],
            "invoice_date": inv_date.isoformat(),
            "amount": round(random.uniform(50000, 100000), 2),
            "currency": "INR",
            "category": v['category'],
            "description": f"Cluster payment",
            "invoice_number": f"{v['id']}-{random.randint(1000, 9999)}",
            "approval_status": "APPROVED",
            "receipt_status": "UPLOADED",
            "payment_status": "PENDING",
            "policy_category": "Standard"
        })
        
    # 8. Round number bias (~30 cases)
    for amount in [50000, 100000, 200000] * 10:
        v = random.choice(vendors[:-1])
        e = random.choice(employees)
        inv_date = start_date + datetime.timedelta(days=random.randint(0, 360))
        transactions.append({
            "id": str(uuid.uuid4()),
            "invoice_id": f"INV-{random.randint(10000, 99999)}",
            "employee_id": e['id'],
            "employee_name": e['name'],
            "employee_dept": e['dept'],
            "vendor_id": v['id'],
            "vendor_name": v['name'],
            "invoice_date": inv_date.isoformat(),
            "amount": float(amount),
            "currency": "INR",
            "category": v['category'],
            "description": f"Round number payment",
            "invoice_number": f"{v['id']}-{random.randint(1000, 9999)}",
            "approval_status": "APPROVED",
            "receipt_status": "UPLOADED",
            "payment_status": "PENDING",
            "policy_category": "Standard"
        })
        
    # 10. New vendor large invoice (~30 cases)
    v_new = vendors[-1] # New Vendor Startup
    for _ in range(30):
        e = random.choice(employees)
        amount = random.uniform(500000, 1000000) # Extremely large
        inv_date = start_date + datetime.timedelta(days=random.randint(300, 360)) # Recent
        transactions.append({
            "id": str(uuid.uuid4()),
            "invoice_id": f"INV-{random.randint(10000, 99999)}",
            "employee_id": e['id'],
            "employee_name": e['name'],
            "employee_dept": e['dept'],
            "vendor_id": v_new['id'],
            "vendor_name": v_new['name'],
            "invoice_date": inv_date.isoformat(),
            "amount": round(amount, 2),
            "currency": "INR",
            "category": v_new['category'],
            "description": f"First large payment",
            "invoice_number": f"{v_new['id']}-{random.randint(1000, 9999)}",
            "approval_status": "APPROVED",
            "receipt_status": "UPLOADED",
            "payment_status": "PENDING",
            "policy_category": "Standard"
        })
        
    # Build vendor profile lookup (used as fallback when history is sparse)
    vendor_profiles = {v['id']: v for v in vendors}
    
    df = pd.DataFrame(transactions)
    
    # Pre-inject synthetic "prior history" rows for each vendor 
    # (representing the established baseline from before our dataset period)
    # These will always be at position 0 so every vendor has baseline data from the start
    prior_history_rows = []
    prior_date = start_date - datetime.timedelta(days=30)
    
    for vendor in vendors[:-1]:  # Exclude new vendor (V016)
        hist_min = vendor['historical_min']
        hist_max = vendor['historical_max']
        hist_mean = (hist_min + hist_max) / 2
        
        # Inject 20 "prior" normal transactions for each vendor
        for k in range(20):
            amount = random.uniform(hist_min, hist_max)
            e = random.choice(employees)
            prior_date_row = prior_date + datetime.timedelta(days=random.randint(0, 25))
            prior_history_rows.append({
                "id": str(uuid.uuid4()),
                "invoice_id": f"HIST-{random.randint(10000, 99999)}",
                "employee_id": e['id'],
                "employee_name": e['name'],
                "employee_dept": e['dept'],
                "vendor_id": vendor['id'],
                "vendor_name": vendor['name'],
                "invoice_date": prior_date_row.isoformat(),
                "amount": round(amount, 2),
                "currency": "INR",
                "category": vendor['category'],
                "description": f"Historical payment for {vendor['category']}",
                "invoice_number": f"{vendor['id']}-HIST-{k}",
                "approval_status": "APPROVED",
                "receipt_status": "UPLOADED",
                "payment_status": "PAID",
                "policy_category": "Standard",
                "_is_historical": True  # Flag to skip risk scoring
            })
    
    # Combine: historical rows first, then current transactions
    prior_df = pd.DataFrame(prior_history_rows)
    df = pd.concat([prior_df, df], ignore_index=True)
    df['_is_historical'] = df['_is_historical'].fillna(False)
    df = df.sort_values(by='invoice_date').reset_index(drop=True)

    
    # Train Anomaly Model
    print("Training anomaly model...")
    train_anomaly_model(df)
    
    print(f"Total transactions to process: {len(df)}")
    
    db_transactions = []
    BATCH_SIZE = 500
    
    for idx, row in df.iterrows():
        t = row.to_dict()
        
        # Skip historical baseline rows - they're only for providing history context
        if t.get('_is_historical') is True:
            continue

        
        # Get history up to this point (includes synthetic prior history rows)
        history_df = df.iloc[:idx]
        
        vendor_history = history_df[history_df['vendor_id'] == t['vendor_id']]
        employee_history = history_df[history_df['employee_id'] == t['employee_id']]
        
        vendor_history_count = len(vendor_history)
        employee_history_count = len(employee_history)
        
        # Engine execution
        validation_flags = validate_transaction(t)
        duplicate_info = detect_duplicates(t, history_df)
        policy_rules = evaluate_policies(t, vendor_history_count)
        behavioral_info = analyze_behavior(t, vendor_history, employee_history)
        anomaly_info = detect_anomaly(t)
        relationship_info = analyze_relationships(t, history_df)
        
        risk_result = calculate_risk(
            validation_flags, policy_rules, duplicate_info, 
            behavioral_info, anomaly_info, relationship_info, 
            t, vendor_history_count, employee_history_count
        )
        
        anomaly_details = {
            "validation_flags": validation_flags,
            "duplicate_info": duplicate_info,
            "behavioral_info": behavioral_info,
            "anomaly_info": anomaly_info,
            "relationship_info": relationship_info
        }
        
        db_txn = Transaction(
            id=t['id'],
            invoice_id=t['invoice_id'],
            employee_id=t['employee_id'],
            employee_name=t['employee_name'],
            employee_dept=t['employee_dept'],
            vendor_id=t['vendor_id'],
            vendor_name=t['vendor_name'],
            invoice_date=datetime.datetime.fromisoformat(t['invoice_date']),
            amount=t['amount'],
            currency=t['currency'],
            category=t['category'],
            description=t['description'],
            invoice_number=t.get('invoice_number'),
            approval_status=t['approval_status'],
            receipt_status=t['receipt_status'],
            payment_status=t['payment_status'],
            policy_category=t['policy_category'],
            risk_score=risk_result['risk_score'],
            confidence=risk_result['confidence'],
            decision=risk_result['decision'],
            rules_triggered=safe_dumps(policy_rules),
            anomaly_details=safe_dumps(anomaly_details)
        )
        db_transactions.append(db_txn)
        
        if len(db_transactions) >= BATCH_SIZE:
            db.add_all(db_transactions)
            db.commit()
            db_transactions = []
            print(f"  Committed {min(idx+1, len(df))} / {len(df)} transactions...")
            
    # Flush remaining
    if db_transactions:
        db.add_all(db_transactions)
        db.commit()
        print(f"  Committed final batch. Total: {len(df)}")
    
    # Now create audit events for all transactions (separate pass for speed)
    print("Creating audit events...")
    all_txns = db.query(Transaction).all()
    audit_batch = []
    prev_hash = "0"
    block_index = 0
    
    import hashlib
    for txn in all_txns[:500]:  # Audit events for first 500 for demo (enough for any demo)
        event_data = safe_dumps({"risk_score": txn.risk_score, "decision": txn.decision, "confidence": txn.confidence})
        timestamp = datetime.datetime.utcnow()
        hash_input = f"{txn.id}TRANSACTION_PROCESSED{event_data}{timestamp.isoformat()}{prev_hash}{block_index}"
        current_hash = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
        
        ae = AuditEvent(
            transaction_id=txn.id,
            event_type="TRANSACTION_PROCESSED",
            event_data=event_data,
            timestamp=timestamp,
            hash=current_hash,
            prev_hash=prev_hash,
            block_index=block_index
        )
        audit_batch.append(ae)
        prev_hash = current_hash
        block_index += 1
        
        if len(audit_batch) >= 200:
            db.add_all(audit_batch)
            db.commit()
            audit_batch = []
    
    if audit_batch:
        db.add_all(audit_batch)
        db.commit()
    
    print(f"Database seeded successfully! {len(df)} transactions processed.")

