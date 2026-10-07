"""
WisePay Standalone Demo Seed CLI Utility
========================================
Robust, deterministic, and idempotent CLI tool for populating relational demo data.
Supports --count N and --reset.

Usage:
    python backend/scripts/seed_demo_data.py --count 100
    python backend/scripts/seed_demo_data.py --reset --count 100
"""

import argparse
import datetime
import decimal
import hashlib
import json
import random
import sys
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import Base, SessionLocal, engine
from models import (
    AuditEvent,
    Employee,
    Evidence,
    ExceptionRecord,
    HumanDecision,
    Invoice,
    InvoiceItem,
    RiskAssessment,
    Role,
    Rule,
    User,
    Vendor,
)


from core.security import get_password_hash


def get_deterministic_uuid(namespace_key: str) -> uuid.UUID:
    """Generates reproducible UUIDs across executions for identical keys."""
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"wisepay.{namespace_key}")


def hash_demo_password(password: str) -> str:
    """Generates password hash compatible with backend authentication."""
    return get_password_hash(password)


def reset_database(db) -> None:
    """Deletes existing application records in safe foreign-key dependency order."""
    print("Resetting existing application data in dependency order...")
    db.query(HumanDecision).delete()
    db.query(AuditEvent).delete()
    db.query(Evidence).delete()
    db.query(ExceptionRecord).delete()
    db.query(RiskAssessment).delete()
    db.query(InvoiceItem).delete()
    db.query(Invoice).delete()
    db.query(Rule).delete()
    db.query(Employee).delete()
    db.query(Vendor).delete()
    db.query(User).delete()
    db.query(Role).delete()
    db.commit()
    print("Application tables successfully cleared.")


def create_chained_audit_event(transaction_id: str, event_type: str, event_data: dict, db) -> AuditEvent:
    """Appends an immutable SHA-256 block to the sequential audit ledger."""
    last_event = db.query(AuditEvent).order_by(AuditEvent.block_index.desc()).first()
    prev_hash = last_event.hash if last_event else "0"
    block_index = (last_event.block_index + 1) if last_event else 0

    event_data_str = json.dumps(event_data, sort_keys=True)
    timestamp = datetime.datetime.now(datetime.timezone.utc)

    hash_input = f"{transaction_id}{event_type}{event_data_str}{timestamp.isoformat()}{prev_hash}{block_index}"
    current_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

    ae = AuditEvent(
        transaction_id=str(transaction_id),
        event_type=event_type,
        event_data=event_data,
        timestamp=timestamp,
        hash=current_hash,
        prev_hash=prev_hash,
        block_index=block_index,
    )
    db.add(ae)
    db.commit()
    db.refresh(ae)
    return ae


def seed_roles(db) -> Dict[str, Role]:
    print("Seeding roles...")
    roles_data = [
        {
            "id": "THE ORIGINATOR",
            "title": "The Originator",
            "department": "AP Ingestion & Invoicing",
            "approval_limit": Decimal("0.00"),
            "can_approve_disbursement": False,
            "can_override_high_risk": False,
            "is_auditor_read_only": False,
        },
        {
            "id": "AP / FINANCE REVIEWER",
            "title": "AP / Finance Reviewer",
            "department": "Exception Handling & Operations",
            "approval_limit": Decimal("-1.00"),
            "can_approve_disbursement": True,
            "can_override_high_risk": True,
            "is_auditor_read_only": False,
        },
        {
            "id": "AUDITOR",
            "title": "Compliance Auditor",
            "department": "Independent Compliance & SOX Audit",
            "approval_limit": Decimal("0.00"),
            "can_approve_disbursement": False,
            "can_override_high_risk": False,
            "is_auditor_read_only": True,
        },
    ]

    roles_map = {}
    for r in roles_data:
        existing = db.query(Role).filter_by(id=r["id"]).first()
        if not existing:
            existing = Role(**r)
            db.add(existing)
            db.commit()
            db.refresh(existing)
        roles_map[r["id"]] = existing
    return roles_map


def seed_users(db, roles_map: Dict[str, Role]) -> Dict[str, User]:
    print("Seeding users...")
    demo_users = [
        {
            "email": "alex.chen@wisepay.internal",
            "full_name": "Alex Chen",
            "role_id": "THE ORIGINATOR",
            "organization": "Global Enterprise Corp",
            "password": "Password123!",
        },
        {
            "email": "priya.sharma@wisepay.internal",
            "full_name": "Priya Sharma",
            "role_id": "AP / FINANCE REVIEWER",
            "organization": "Global Enterprise Corp",
            "password": "Password123!",
        },
        {
            "email": "elena.rostova@sox.audit.internal",
            "full_name": "Elena Rostova",
            "role_id": "AUDITOR",
            "organization": "Global Enterprise Corp",
            "password": "Password123!",
        },
    ]

    users_map = {}
    for u in demo_users:
        existing = db.query(User).filter_by(email=u["email"]).first()
        if not existing:
            user_uuid = get_deterministic_uuid(f"user.{u['email']}")
            existing = User(
                id=user_uuid,
                email=u["email"],
                full_name=u["full_name"],
                role_id=u["role_id"],
                hashed_password=hash_demo_password(u["password"]),
                organization=u["organization"],
                is_active=True,
            )
            db.add(existing)
            db.commit()
            db.refresh(existing)
        users_map[u["role_id"]] = existing
    return users_map


def seed_rules(db) -> Dict[str, Rule]:
    print("Seeding rules...")
    rules_data = [
        {
            "id": "POLICY_LIMIT",
            "name": "Policy Limit Exceeded Without Approval",
            "description": "Invoice amount exceeds policy limit without pre-authorization.",
            "severity": "HIGH",
            "score_contribution": Decimal("30.00"),
        },
        {
            "id": "MISSING_RECEIPT",
            "name": "Missing Receipt for Large Amount",
            "description": "Tax invoice or itemized receipt attachment missing for spend over ₹10,000.",
            "severity": "MEDIUM",
            "score_contribution": Decimal("20.00"),
        },
        {
            "id": "WEEKEND_SUBMISSION",
            "name": "Weekend Submission",
            "description": "Invoice submitted outside corporate business days.",
            "severity": "LOW",
            "score_contribution": Decimal("5.00"),
        },
        {
            "id": "ROUND_NUMBER",
            "name": "Round Number Amount",
            "description": "Amount is an exact round multiple of ₹10,000 indicating estimate or unmetered billing.",
            "severity": "LOW",
            "score_contribution": Decimal("8.00"),
        },
        {
            "id": "NEW_VENDOR",
            "name": "Large Invoice from New Vendor",
            "description": "Vendor has fewer than 3 historical transactions with amount > ₹100,000.",
            "severity": "HIGH",
            "score_contribution": Decimal("25.00"),
        },
        {
            "id": "MISSING_APPROVAL",
            "name": "Missing Approval for Medium Amount",
            "description": "Departmental sign-off is pending for amount exceeding ₹25,000.",
            "severity": "MEDIUM",
            "score_contribution": Decimal("15.00"),
        },
    ]

    rules_map = {}
    for r in rules_data:
        existing = db.query(Rule).filter_by(id=r["id"]).first()
        if not existing:
            existing = Rule(**r)
            db.add(existing)
            db.commit()
            db.refresh(existing)
        rules_map[r["id"]] = existing
    return rules_map


def seed_vendors(db) -> List[Vendor]:
    print("Seeding vendors...")
    vendors_spec = [
        {"id": "V001", "name": "Infosys Technologies", "category": "IT Services", "min": 50000, "max": 500000},
        {"id": "V002", "name": "Tata Consultancy Services", "category": "IT Services", "min": 80000, "max": 800000},
        {"id": "V003", "name": "Office Supplies Co", "category": "Office", "min": 2000, "max": 25000},
        {"id": "V004", "name": "Azure Cloud Solutions", "category": "Cloud", "min": 100000, "max": 2000000},
        {"id": "V005", "name": "QuickPrint Pvt Ltd", "category": "Printing", "min": 1500, "max": 15000},
        {"id": "V006", "name": "Sharma Travels", "category": "Travel", "min": 5000, "max": 80000},
        {"id": "V007", "name": "Metro Catering", "category": "Food", "min": 3000, "max": 30000},
        {"id": "V008", "name": "TechEquip Solutions", "category": "Equipment", "min": 25000, "max": 300000},
        {"id": "V009", "name": "LegalEase Associates", "category": "Legal", "min": 50000, "max": 500000},
        {"id": "V010", "name": "GreenClean Facilities", "category": "Facility", "min": 8000, "max": 45000},
        {"id": "V011", "name": "DataVault Security", "category": "Security", "min": 30000, "max": 200000},
        {"id": "V012", "name": "Pioneer Logistics", "category": "Logistics", "min": 10000, "max": 100000},
        {"id": "V013", "name": "FinanceFirst Consulting", "category": "Consulting", "min": 75000, "max": 750000},
        {"id": "V014", "name": "MediaWorks Studio", "category": "Marketing", "min": 20000, "max": 150000},
        {"id": "V015", "name": "Rajesh Trading Co", "category": "Supplies", "min": 4000, "max": 40000},
        {"id": "V016", "name": "New Vendor Startup", "category": "Consulting", "min": 10000, "max": 20000},
    ]

    vendors = []
    for vs in vendors_spec:
        v = db.query(Vendor).filter_by(id=vs["id"]).first()
        if not v:
            v = Vendor(
                id=vs["id"],
                name=vs["name"],
                category=vs["category"],
                historical_min=Decimal(str(vs["min"])),
                historical_max=Decimal(str(vs["max"])),
                total_spend=Decimal("0.00"),
                invoice_count=0,
            )
            db.add(v)
            db.commit()
            db.refresh(v)
        vendors.append(v)
    return vendors


def seed_employees(db) -> List[Employee]:
    print("Seeding employees...")
    depts = ["Finance", "Engineering", "Marketing", "Operations", "HR", "Legal", "Sales"]
    employees = []
    for i in range(1, 51):
        emp_id = f"E{i:03d}"
        e = db.query(Employee).filter_by(id=emp_id).first()
        if not e:
            e = Employee(
                id=emp_id,
                name=f"Employee {i}",
                department=depts[i % len(depts)],
                typical_spend_limit=Decimal("150000.00"),
            )
            db.add(e)
            db.commit()
            db.refresh(e)
        employees.append(e)
    return employees


def seed_invoices(db, count: int, vendors: List[Vendor], employees: List[Employee], rules_map: Dict[str, Rule], users_map: Dict[str, User]) -> None:
    print(f"Generating {count} realistic, scenario-distributed invoices...")
    base_date = datetime.datetime.utcnow() - datetime.timedelta(days=90)

    for i in range(1, count + 1):
        invoice_id_str = f"INV-DEMO-{i:06d}"
        existing_inv = db.query(Invoice).filter_by(invoice_id=invoice_id_str).first()
        if existing_inv:
            continue  # Idempotent: already seeded

        inv_uuid = get_deterministic_uuid(f"invoice.{invoice_id_str}")
        scenario_idx = i % 10

        vendor = vendors[(i - 1) % (len(vendors) - 1)]  # V001 to V015
        employee = employees[(i - 1) % len(employees)]

        invoice_date = base_date + datetime.timedelta(days=(i * 87) % 90, hours=(i * 3) % 24)
        
        # Scenario distribution
        triggered_rules_list = []
        is_duplicate = False
        duplicate_info = {}
        counterfactuals = []
        relationship_flags = []

        if scenario_idx == 2:
            # Over Limit Scenario
            amount_val = Decimal(random.randint(180000, 480000))
            approval_status = "PENDING"
            receipt_status = "UPLOADED"
            risk_score = Decimal("78.50")
            confidence = Decimal("88.00")
            decision = "HIGH_RISK"
            rule_item = rules_map["POLICY_LIMIT"]
            triggered_rules_list.append(rule_item.to_dict())
            counterfactuals.append({
                "action": "Obtain VP / Department Head approval for limit override",
                "risk_reduction": 26.0,
                "new_risk_score": 52.5,
                "new_decision": "HUMAN_REVIEW",
                "impact_area": "Policy Compliance"
            })
        elif scenario_idx == 4:
            # Duplicate / Near-Duplicate Scenario
            amount_val = Decimal("48500.00")
            approval_status = "APPROVED"
            receipt_status = "UPLOADED"
            risk_score = Decimal("88.00")
            confidence = Decimal("92.00")
            decision = "HIGH_RISK"
            is_duplicate = True
            matched_id = f"INV-DEMO-{(i - 1):06d}" if i > 1 else "INV-DEMO-000001"
            duplicate_info = {
                "is_duplicate": True,
                "similarity_score": 0.96,
                "matched_invoice_id": matched_id,
                "matched_vendor": vendor.name,
                "matched_amount": 48500.0,
                "match_type": "EXACT" if i % 2 == 0 else "NEAR"
            }
            counterfactuals.append({
                "action": "Confirm distinct PO & separate delivery proof (resolve duplicate flag)",
                "risk_reduction": 45.0,
                "new_risk_score": 43.0,
                "new_decision": "HUMAN_REVIEW",
                "impact_area": "Duplicate & Identity"
            })
        elif scenario_idx == 6:
            # Missing Data Scenario
            amount_val = Decimal(random.randint(25000, 75000))
            approval_status = "APPROVED"
            receipt_status = "MISSING"
            risk_score = Decimal("54.00")
            confidence = Decimal("74.00")
            decision = "HUMAN_REVIEW"
            rule_item = rules_map["MISSING_RECEIPT"]
            triggered_rules_list.append(rule_item.to_dict())
            counterfactuals.append({
                "action": "Upload itemized GST tax invoice / payment receipt",
                "risk_reduction": 18.0,
                "new_risk_score": 36.0,
                "new_decision": "AUTO_PASS",
                "impact_area": "Documentation"
            })
        elif scenario_idx == 8:
            # Round number / Weekend anomaly
            amount_val = Decimal(random.choice([50000, 100000, 200000]))
            approval_status = "APPROVED"
            receipt_status = "UPLOADED"
            risk_score = Decimal("44.00")
            confidence = Decimal("76.00")
            decision = "HUMAN_REVIEW"
            rule_item = rules_map["ROUND_NUMBER"]
            triggered_rules_list.append(rule_item.to_dict())
            counterfactuals.append({
                "action": "Attach detailed Statement of Work (SOW) justifying rounded billing",
                "risk_reduction": 20.0,
                "new_risk_score": 24.0,
                "new_decision": "AUTO_PASS",
                "impact_area": "Behavioral Context"
            })
        else:
            # Clean Scenario (~60% - 70%)
            hist_min = int(vendor.historical_min)
            hist_max = int(vendor.historical_max)
            amount_val = Decimal(random.randint(max(1000, hist_min), max(2000, hist_max)))
            approval_status = "APPROVED"
            receipt_status = "UPLOADED"
            risk_score = Decimal(str(round(random.uniform(5.0, 22.0), 2)))
            confidence = Decimal(str(round(random.uniform(88.0, 97.0), 2)))
            decision = "AUTO_PASS"

        # Construct Evidence Graph
        nodes = [
            {"id": str(inv_uuid), "label": f"Invoice\n{invoice_id_str}", "type": "transaction", "risk": float(risk_score)},
            {"id": f"vendor_{vendor.id}", "label": vendor.name, "type": "vendor"},
            {"id": f"emp_{employee.id}", "label": employee.name, "type": "employee"},
            {"id": "risk_score", "label": f"Risk Score\n{float(risk_score):.0f}", "type": "risk", "value": float(risk_score)},
            {"id": f"decision_{decision}", "label": decision.replace("_", " "), "type": "decision"},
        ]
        edges = [
            {"source": f"emp_{employee.id}", "target": str(inv_uuid), "label": "submitted"},
            {"source": str(inv_uuid), "target": f"vendor_{vendor.id}", "label": "paid to"},
            {"source": str(inv_uuid), "target": "risk_score", "label": "scored"},
            {"source": "risk_score", "target": f"decision_{decision}", "label": "resulted in"},
        ]

        if triggered_rules_list:
            for r_entry in triggered_rules_list:
                r_node_id = f"rule_{r_entry['rule_id']}"
                nodes.append({"id": r_node_id, "label": r_entry["rule_name"], "type": "rule", "contribution": r_entry["score_contribution"]})
                edges.append({"source": str(inv_uuid), "target": r_node_id, "label": "triggered"})

        if is_duplicate:
            dup_node_id = f"dup_{duplicate_info.get('matched_invoice_id')}"
            nodes.append({"id": dup_node_id, "label": f"Matched Invoice\n({int(duplicate_info.get('similarity_score', 0)*100)}% match)", "type": "duplicate"})
            edges.append({"source": str(inv_uuid), "target": dup_node_id, "label": "duplicate match"})

        behavioral_info = {
            "vendor_behavior": {
                "historical_min": float(vendor.historical_min),
                "historical_max": float(vendor.historical_max),
                "historical_mean": float((vendor.historical_min + vendor.historical_max) / 2),
                "current_amount": float(amount_val),
                "z_score": 0.85 if decision == "AUTO_PASS" else 3.42,
                "ratio_to_max": round(float(amount_val / max(vendor.historical_max, Decimal("1.0"))), 2),
                "sample_count": 28,
            },
            "employee_behavior": {
                "typical_mean": 45000.0,
                "typical_std": 12000.0,
                "is_amount_unusual": decision != "AUTO_PASS",
            },
            "behavioral_anomaly_score": 12.0 if decision == "AUTO_PASS" else 65.0,
        }

        anomaly_details = {
            "validation_flags": [],
            "duplicate_info": duplicate_info,
            "behavioral_info": behavioral_info,
            "anomaly_info": {"anomaly_score": float(risk_score) * 0.8, "is_anomaly": decision != "AUTO_PASS"},
            "relationship_info": {"relationship_flags": relationship_flags},
        }

        recommendation_text = (
            "Invoice within normal parameters. Approved automatically with high confidence."
            if decision == "AUTO_PASS"
            else "Elevated risk profile detected. Requires secondary finance review."
        )

        # 1. Insert Invoice
        inv = Invoice(
            id=inv_uuid,
            invoice_id=invoice_id_str,
            invoice_number=f"{vendor.id}-{i:04d}",
            employee_id=employee.id,
            employee_name=employee.name,
            employee_dept=employee.department,
            vendor_id=vendor.id,
            vendor_name=vendor.name,
            invoice_date=invoice_date,
            amount=amount_val,
            currency="INR",
            category=vendor.category,
            description=f"Standard payment for {vendor.category} services",
            approval_status=approval_status,
            receipt_status=receipt_status,
            payment_status="PENDING",
            policy_category="Standard",
            risk_score=risk_score,
            confidence=confidence,
            decision=decision,
            human_decision=None,
            rules_triggered=triggered_rules_list,
            anomaly_details=anomaly_details,
            created_at=invoice_date,
            processed_at=invoice_date,
        )
        db.add(inv)

        # 2. Insert Invoice Item
        inv_item = InvoiceItem(
            id=get_deterministic_uuid(f"item.{invoice_id_str}"),
            invoice_id=inv_uuid,
            item_description=f"Line 1: {vendor.category} professional deliverables",
            quantity=Decimal("1.00"),
            unit_price=amount_val,
            total_price=amount_val,
        )
        db.add(inv_item)

        # 3. Insert Immutable Risk Assessment
        assessment_uuid = get_deterministic_uuid(f"assessment.{invoice_id_str}.1")
        assessment = RiskAssessment(
            id=assessment_uuid,
            invoice_id=inv_uuid,
            version=1,
            risk_score=risk_score,
            confidence=confidence,
            decision=decision,
            validation_risk=Decimal("0.00"),
            duplicate_risk=Decimal("85.00") if is_duplicate else Decimal("0.00"),
            behavioral_risk=Decimal("50.00") if decision != "AUTO_PASS" else Decimal("10.00"),
            policy_risk=Decimal("40.00") if triggered_rules_list else Decimal("0.00"),
            relationship_risk=Decimal("0.00"),
            anomaly_model_risk=Decimal("15.00"),
            is_active=True,
            created_at=invoice_date,
        )
        db.add(assessment)

        # 4. Insert Exceptions if any
        for r_item in triggered_rules_list:
            exc = ExceptionRecord(
                id=get_deterministic_uuid(f"exc.{invoice_id_str}.{r_item['rule_id']}"),
                invoice_id=inv_uuid,
                assessment_id=assessment_uuid,
                rule_id=r_item["rule_id"],
                exception_type="POLICY",
                message=r_item["description"],
                severity_score=Decimal(str(r_item["score_contribution"])),
                evidence_data=r_item,
                created_at=invoice_date,
            )
            db.add(exc)

        # 5. Insert Evidence
        ev = Evidence(
            id=get_deterministic_uuid(f"evidence.{invoice_id_str}"),
            assessment_id=assessment_uuid,
            behavioral_analysis=behavioral_info,
            duplicate_evidence=duplicate_info,
            relationship_flags=relationship_flags,
            evidence_graph={"nodes": nodes, "edges": edges},
            counterfactual_steps=counterfactuals,
            recommendation=recommendation_text,
            created_at=invoice_date,
        )
        db.add(ev)

        # Commit transaction entities
        db.commit()

        # 6. Generate Immutable SHA-256 Chained Audit Event
        audit_payload = {
            "invoice_id": invoice_id_str,
            "amount": float(amount_val),
            "vendor_id": vendor.id,
            "risk_score": float(risk_score),
            "decision": decision,
            "confidence": float(confidence),
        }
        create_chained_audit_event(
            transaction_id=str(inv_uuid),
            event_type="INVOICE_PROCESSED",
            event_data=audit_payload,
            db=db,
        )

        # 7. Optionally Seed a Human Review Decision for Demo (sample ~5% of exceptions)
        if decision in ["HUMAN_REVIEW", "HIGH_RISK"] and i % 5 == 0:
            ap_user = users_map.get("AP / FINANCE REVIEWER")
            review_decision = "APPROVE" if decision == "HUMAN_REVIEW" else "ESCALATE"
            review_reason = "Verified valid emergency procurement documentation and delivery receipt."

            # Append Audit Event for Human Decision
            decision_audit_payload = {
                "decision": review_decision,
                "reason": review_reason,
                "reviewer_id": ap_user.full_name if ap_user else "Priya Sharma",
                "reviewer_role": "AP / FINANCE REVIEWER",
                "sod_compliance_verified": True,
            }
            ae_decision = create_chained_audit_event(
                transaction_id=str(inv_uuid),
                event_type="HUMAN_REVIEW_SUBMITTED",
                event_data=decision_audit_payload,
                db=db,
            )

            hd = HumanDecision(
                decision_uuid=get_deterministic_uuid(f"decision.{invoice_id_str}"),
                invoice_id=inv_uuid,
                transaction_id=str(inv_uuid),
                user_id=ap_user.id if ap_user else None,
                reviewer_id=ap_user.email if ap_user else "priya.sharma@wisepay.internal",
                reviewer_name=ap_user.full_name if ap_user else "Priya Sharma",
                reviewer_role="AP / FINANCE REVIEWER",
                decision=review_decision,
                reason=review_reason,
                original_decision=decision,
                audit_event_id=ae_decision.id,
                timestamp=datetime.datetime.now(datetime.timezone.utc),
            )
            db.add(hd)
            inv.human_decision = review_decision
            db.commit()

        # Update vendor running spend
        vendor.total_spend += amount_val
        vendor.invoice_count += 1
        db.commit()


def main():
    parser = argparse.ArgumentParser(description="WisePay Deterministic Demo Data Seeder")
    parser.add_argument("--count", type=int, default=100, help="Number of demo invoices to generate (1 - 1000)")
    parser.add_argument("--reset", action="store_true", help="Delete existing application data before seeding")
    args = parser.parse_args()

    count = max(1, min(args.count, 1000))

    print("=" * 60)
    print(f"WisePay Relational Seeder | Target Invoices: {count} | Reset: {args.reset}")
    print("=" * 60)

    # Set deterministic random seed
    random.seed(42)

    # Ensure schema exists
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if args.reset:
            reset_database(db)

        roles_map = seed_roles(db)
        users_map = seed_users(db, roles_map)
        rules_map = seed_rules(db)
        vendors = seed_vendors(db)
        employees = seed_employees(db)

        seed_invoices(db, count, vendors, employees, rules_map, users_map)

        total_invoices = db.query(Invoice).count()
        total_audits = db.query(AuditEvent).count()
        print("=" * 60)
        print(f"Seeding Complete! Total Invoices in DB: {total_invoices} | Audit Blocks: {total_audits}")
        print("=" * 60)
    except Exception as e:
        db.rollback()
        print(f"FATAL: Seeding failed with error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
