"""Debug script for behavioral analysis."""
import sqlite3
import json

conn = sqlite3.connect('sentinel.db')
cur = conn.cursor()

# Find V003 anomaly transactions
cur.execute("""
SELECT invoice_id, vendor_name, amount, risk_score, anomaly_details 
FROM transactions 
WHERE vendor_id = 'V003' AND amount > 50000 
LIMIT 3
""")

print("V003 (Office Supplies) anomaly transactions:")
for row in cur.fetchall():
    det = json.loads(row[4])
    beh = det.get('behavioral_info', {})
    print(f"\n{row[0]} | {row[1]} | amt={row[2]:.0f} | risk={row[3]:.1f}")
    print(f"  behavioral_anomaly_score: {beh.get('behavioral_anomaly_score', 'N/A')}")
    vendor_beh = beh.get('analysis', {}).get('vendor_behavior', {})
    print(f"  vendor_behavior: {vendor_beh}")

print("\n\nTop 10 highest risk transactions:")
cur.execute("""
SELECT invoice_id, vendor_name, amount, risk_score, decision, rules_triggered
FROM transactions
ORDER BY risk_score DESC
LIMIT 10
""")
for row in cur.fetchall():
    rules = json.loads(row[5]) if row[5] else []
    rule_ids = [r.get('rule_id','?') for r in rules]
    print(f"{row[0]} | {row[1]} | {row[2]:.0f} | risk={row[3]:.1f} | {row[4]} | {rule_ids}")

conn.close()
