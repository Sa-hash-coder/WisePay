#!/usr/bin/env python3.11
"""One-shot script to initialize and seed the SENTINEL database."""

import sys
import os

# Ensure we can import from backend dir
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, SessionLocal
import models  # Must import models to register them with Base.metadata

def main():
    print("=== SENTINEL Database Initialization ===")
    
    # Drop and recreate tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    from sqlalchemy import inspect
    insp = inspect(engine)
    tables = insp.get_table_names()
    print(f"Tables created: {tables}")
    
    # Seed with data
    db = SessionLocal()
    try:
        from models import Transaction
        existing = db.query(Transaction).count()
        if existing > 0:
            print(f"Database already has {existing} transactions. Skipping seed.")
            print("To re-seed, delete sentinel.db and run again.")
            return
        
        from data.seed import seed_database
        seed_database(db)
        
        # Verify
        count = db.query(Transaction).count()
        print(f"\n[OK] Seeding complete! {count} transactions in database.")
        
        from models import AuditEvent
        audit_count = db.query(AuditEvent).count()
        print(f"[OK] {audit_count} audit events created.")
        
        auto_pass = db.query(Transaction).filter(Transaction.decision == "AUTO_PASS").count()
        human_review = db.query(Transaction).filter(Transaction.decision == "HUMAN_REVIEW").count()
        high_risk = db.query(Transaction).filter(Transaction.decision == "HIGH_RISK").count()
        
        print(f"\nDecision breakdown:")
        print(f"  AUTO_PASS:    {auto_pass} ({auto_pass/count*100:.1f}%)")
        print(f"  HUMAN_REVIEW: {human_review} ({human_review/count*100:.1f}%)")
        print(f"  HIGH_RISK:    {high_risk} ({high_risk/count*100:.1f}%)")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\nError: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
