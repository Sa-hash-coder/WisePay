import datetime

def evaluate_policies(transaction, vendor_history_count):
    rules_triggered = []
    
    # 1. POLICY_LIMIT: amount > 50000 and approval_status != 'APPROVED' → score_contribution 30
    if transaction['amount'] > 50000 and transaction['approval_status'] != 'APPROVED':
        rules_triggered.append({
            "rule_id": "POLICY_LIMIT",
            "rule_name": "Policy Limit Exceeded Without Approval",
            "description": "Amount > 50000 without final approval.",
            "score_contribution": 30
        })
        
    # 2. MISSING_RECEIPT: receipt_status == 'MISSING' and amount > 10000 → score_contribution 20
    if transaction['receipt_status'] == 'MISSING' and transaction['amount'] > 10000:
        rules_triggered.append({
            "rule_id": "MISSING_RECEIPT",
            "rule_name": "Missing Receipt for Large Amount",
            "description": "Receipt missing for amount > 10000.",
            "score_contribution": 20
        })
        
    # 3. WEEKEND_SUBMISSION: invoice_date is Saturday or Sunday → score_contribution 5
    invoice_date = transaction['invoice_date']
    if isinstance(invoice_date, str):
        try:
            invoice_date = datetime.datetime.fromisoformat(invoice_date)
        except:
            pass
    if isinstance(invoice_date, datetime.datetime) and invoice_date.weekday() in [5, 6]:
        rules_triggered.append({
            "rule_id": "WEEKEND_SUBMISSION",
            "rule_name": "Weekend Submission",
            "description": "Invoice submitted on a weekend.",
            "score_contribution": 5
        })
        
    # 4. ROUND_NUMBER: amount exactly divisible by 10000 → score_contribution 8
    if transaction['amount'] % 10000 == 0:
        rules_triggered.append({
            "rule_id": "ROUND_NUMBER",
            "rule_name": "Round Number Amount",
            "description": "Amount is a multiple of 10000.",
            "score_contribution": 8
        })
        
    # 5. NEW_VENDOR: vendor has < 3 previous invoices and amount > 100000 → score_contribution 25
    if vendor_history_count < 3 and transaction['amount'] > 100000:
        rules_triggered.append({
            "rule_id": "NEW_VENDOR",
            "rule_name": "Large Invoice from New Vendor",
            "description": "Vendor has < 3 previous invoices and amount > 100000.",
            "score_contribution": 25
        })
        
    # 6. MISSING_APPROVAL: approval_status == 'PENDING' and amount > 25000 → score_contribution 15
    if transaction['approval_status'] == 'PENDING' and transaction['amount'] > 25000:
        rules_triggered.append({
            "rule_id": "MISSING_APPROVAL",
            "rule_name": "Missing Approval for Medium Amount",
            "description": "Approval pending for amount > 25000.",
            "score_contribution": 15
        })
        
    return rules_triggered
