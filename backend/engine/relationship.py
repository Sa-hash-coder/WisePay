import pandas as pd

def analyze_relationships(transaction, all_history_df):
    flags = []
    nodes = []
    edges = []
    
    if all_history_df is None or all_history_df.empty:
        return {"relationship_flags": flags, "network_data": {"nodes": nodes, "edges": edges}}
        
    emp_id = transaction['employee_id']
    ven_id = transaction['vendor_id']
    
    # Add basic nodes
    nodes.append({"id": transaction['id'], "label": "Transaction", "type": "transaction"})
    nodes.append({"id": emp_id, "label": transaction['employee_name'], "type": "employee"})
    nodes.append({"id": ven_id, "label": transaction['vendor_name'], "type": "vendor"})
    
    edges.append({"source": emp_id, "target": transaction['id'], "label": "submitted"})
    edges.append({"source": transaction['id'], "target": ven_id, "label": "paid_to"})
    
    # 1. Employee -> Vendor concentration
    emp_vendor_invoices = all_history_df[
        (all_history_df['employee_id'] == emp_id) & 
        (all_history_df['vendor_id'] == ven_id)
    ]
    
    if len(emp_vendor_invoices) > 10:
        flags.append({
            "type": "EMPLOYEE_VENDOR_CONCENTRATION",
            "description": f"Employee has {len(emp_vendor_invoices)} invoices with this vendor."
        })
        
    # 2. Vendor concentration (spend %)
    total_spend = all_history_df['amount'].sum()
    if total_spend > 0:
        vendor_spend = all_history_df[all_history_df['vendor_id'] == ven_id]['amount'].sum()
        pct = vendor_spend / total_spend
        if pct > 0.15:
            flags.append({
                "type": "VENDOR_CONCENTRATION",
                "description": f"Vendor accounts for {pct*100:.1f}% of total historical spend."
            })
            
    # 3. Temporal clustering (many invoices same vendor, same employee, <30 days)
    recent_invoices = emp_vendor_invoices.copy()
    if not recent_invoices.empty:
        recent_invoices['invoice_date'] = pd.to_datetime(recent_invoices['invoice_date'])
        
        inv_date = pd.to_datetime(transaction['invoice_date'])
        recent = recent_invoices[
            (recent_invoices['invoice_date'] >= inv_date - pd.Timedelta(days=30)) &
            (recent_invoices['invoice_date'] <= inv_date + pd.Timedelta(days=30))
        ]
        
        if len(recent) > 5:
            flags.append({
                "type": "TEMPORAL_CLUSTERING",
                "description": f"{len(recent)} invoices submitted by employee to vendor within 30 days."
            })
            
    return {
        "relationship_flags": flags,
        "network_data": {"nodes": nodes, "edges": edges}
    }
