"""Analyze risk scores and re-run with improved thresholds."""
from database import SessionLocal
import models
from models import Transaction
import json

db = SessionLocal()

# Check anomaly transactions
anomalies = db.query(Transaction).filter(Transaction.rules_triggered != '[]').limit(20).all()
print("=== Sample Anomaly Transactions ===")
for t in anomalies[:10]:
    rules = json.loads(t.rules_triggered)
    anom = json.loads(t.anomaly_details)
    rule_ids = [r["rule_id"] for r in rules]
    beh_score = anom.get("behavioral_info", {}).get("behavioral_anomaly_score", 0)
    print(f"{t.invoice_id} | {t.vendor_name} | {t.amount:.0f} | risk={t.risk_score:.1f} | conf={t.confidence:.0f} | {t.decision}")
    print(f"  rules: {rule_ids} | behavioral: {beh_score:.1f}")

print()
print("=== Decision Distribution ===")
total = db.query(Transaction).count()
auto = db.query(Transaction).filter(Transaction.decision == "AUTO_PASS").count()
review = db.query(Transaction).filter(Transaction.decision == "HUMAN_REVIEW").count()
risk = db.query(Transaction).filter(Transaction.decision == "HIGH_RISK").count()
print(f"Total: {total}, AUTO: {auto} ({auto/total*100:.1f}%), REVIEW: {review} ({review/total*100:.1f}%), HIGH: {risk}")

print()
print("=== Risk Score Distribution ===")
import sqlite3
conn = sqlite3.connect("sentinel.db")
cur = conn.cursor()
cur.execute("SELECT ROUND(risk_score/10)*10 as bucket, COUNT(*) FROM transactions GROUP BY bucket ORDER BY bucket")
for row in cur.fetchall():
    print(f"  {row[0]}-{row[0]+9}: {row[1]}")
conn.close()
db.close()
