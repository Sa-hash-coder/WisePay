import datetime

def validate_transaction(transaction: dict):
    validation_flags = []
    
    if not transaction.get('invoice_number'):
        validation_flags.append({"field": "invoice_number", "error": "Missing invoice_number"})
    if not transaction.get('amount'):
        validation_flags.append({"field": "amount", "error": "Missing amount"})
    elif transaction.get('amount') <= 0:
        validation_flags.append({"field": "amount", "error": "Amount must be greater than 0"})
    
    if not transaction.get('vendor_id'):
        validation_flags.append({"field": "vendor_id", "error": "Missing vendor_id"})
    if not transaction.get('employee_id'):
        validation_flags.append({"field": "employee_id", "error": "Missing employee_id"})
        
    invoice_date = transaction.get('invoice_date')
    if invoice_date:
        if isinstance(invoice_date, str):
            try:
                invoice_date = datetime.datetime.fromisoformat(invoice_date)
            except ValueError:
                pass
        if isinstance(invoice_date, datetime.datetime) and invoice_date > datetime.datetime.utcnow():
            validation_flags.append({"field": "invoice_date", "error": "Future invoice date"})
            
    if transaction.get('currency') not in ['INR']:
        validation_flags.append({"field": "currency", "error": "Invalid currency"})
        
    return validation_flags
