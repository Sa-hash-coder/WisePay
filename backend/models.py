import datetime
import decimal
import json
import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Uuid,
    JSON,
)
from sqlalchemy.orm import relationship, synonym

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from database import Base
except ImportError:
    from backend.database import Base


# ============================================================================
# 1. ROLES & USERS (RBAC & Authentication)
# ============================================================================

class Role(Base):
    """
    Enterprise Organizational Role Model.
    Governs permissions, approval authority caps, and Segregation of Duties (SoD).
    """
    __tablename__ = "roles"

    id = Column(String(32), primary_key=True)  # 'THE ORIGINATOR', 'AP / FINANCE REVIEWER', 'AUDITOR'
    title = Column(String(64), nullable=False)
    department = Column(String(64), nullable=False)
    approval_limit = Column(Numeric(precision=15, scale=2), nullable=False, default=Decimal("0.00"))
    can_approve_disbursement = Column(Boolean, nullable=False, default=False)
    can_override_high_risk = Column(Boolean, nullable=False, default=False)
    is_auditor_read_only = Column(Boolean, nullable=False, default=False)

    users = relationship("User", back_populates="role")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "department": self.department,
            "approval_limit": float(self.approval_limit) if self.approval_limit is not None else 0.0,
            "can_approve_disbursement": self.can_approve_disbursement,
            "can_override_high_risk": self.can_override_high_risk,
            "is_auditor_read_only": self.is_auditor_read_only,
        }


class User(Base):
    """
    Enterprise User Account Model.
    Supports JWT Bearer authentication with hashed passwords.
    """
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(128), nullable=False)
    role_id = Column(String(32), ForeignKey("roles.id"), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    organization = Column(String(128), nullable=False, default="Global Enterprise Corp")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    role = relationship("Role", back_populates="users")
    human_decisions = relationship("HumanDecision", back_populates="user")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "email": self.email,
            "name": self.full_name,
            "role": self.role_id,
            "organization": self.organization,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ============================================================================
# 2. VENDORS & EMPLOYEES (Behavioral Baseline Entities)
# ============================================================================

class Vendor(Base):
    """
    Supplier / Vendor Profile.
    Maintains running statistical spend baselines for anomaly detection.
    """
    __tablename__ = "vendors"

    id = Column(String(32), primary_key=True, index=True)  # e.g., 'V001'
    name = Column(String(128), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)
    historical_min = Column(Numeric(precision=15, scale=2), nullable=False, default=Decimal("0.00"))
    historical_max = Column(Numeric(precision=15, scale=2), nullable=False, default=Decimal("0.00"))
    total_spend = Column(Numeric(precision=15, scale=2), nullable=False, default=Decimal("0.00"))
    invoice_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    invoices = relationship("Invoice", back_populates="vendor")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "historical_min": float(self.historical_min) if self.historical_min is not None else 0.0,
            "historical_max": float(self.historical_max) if self.historical_max is not None else 0.0,
            "total_spend": float(self.total_spend) if self.total_spend is not None else 0.0,
            "invoice_count": self.invoice_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Employee(Base):
    """
    Corporate Submitter / Employee Profile.
    """
    __tablename__ = "employees"

    id = Column(String(32), primary_key=True, index=True)  # e.g., 'E001'
    name = Column(String(128), nullable=False)
    department = Column(String(64), nullable=False, index=True)
    typical_spend_limit = Column(Numeric(precision=15, scale=2), nullable=False, default=Decimal("100000.00"))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    invoices = relationship("Invoice", back_populates="employee")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "department": self.department,
            "typical_spend_limit": float(self.typical_spend_limit) if self.typical_spend_limit is not None else 0.0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ============================================================================
# 3. COMPLIANCE RULES
# ============================================================================

class Rule(Base):
    """
    Configurable Rule Definition for Deterministic Policy Checks.
    """
    __tablename__ = "rules"

    id = Column(String(64), primary_key=True)  # e.g., 'POLICY_LIMIT', 'MISSING_RECEIPT'
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(32), nullable=False)  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    score_contribution = Column(Numeric(precision=5, scale=2), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    exceptions = relationship("ExceptionRecord", back_populates="rule")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.id,
            "rule_name": self.name,
            "description": self.description,
            "severity": self.severity,
            "score_contribution": float(self.score_contribution) if self.score_contribution is not None else 0.0,
            "is_active": self.is_active,
        }


# ============================================================================
# 4. INVOICES & LINE ITEMS
# ============================================================================

class Invoice(Base):
    """
    Core Invoice / Transaction Entity.
    Normalized schema with full backward-compatibility with legacy Next.js UI queries.
    """
    __tablename__ = "invoices"

    # Backend-agnostic UUID primary key (compatible with both PostgreSQL and SQLite)
    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    invoice_id = Column(String(64), unique=True, index=True, nullable=False)
    invoice_number = Column(String(64), index=True, nullable=True)

    # Relationships
    employee_id = Column(String(32), ForeignKey("employees.id"), index=True, nullable=True)
    employee_name = Column(String(128), nullable=True)
    employee_dept = Column(String(64), nullable=True)

    vendor_id = Column(String(32), ForeignKey("vendors.id"), index=True, nullable=True)
    vendor_name = Column(String(128), nullable=True)

    # Financial Metadata (exact financial precision with NUMERIC(15, 2))
    invoice_date = Column(DateTime, nullable=True)
    amount = Column(Numeric(precision=15, scale=2), nullable=False)
    currency = Column(String(8), nullable=False, default="INR")
    category = Column(String(64), nullable=True, index=True)
    description = Column(Text, nullable=True)

    # Status Fields
    approval_status = Column(String(32), nullable=False, default="PENDING")
    receipt_status = Column(String(32), nullable=False, default="MISSING")
    payment_status = Column(String(32), nullable=False, default="PENDING")
    policy_category = Column(String(64), nullable=True, default="Standard")

    # Current Scoring & Triage Snapshot
    risk_score = Column(Numeric(precision=5, scale=2), nullable=True, index=True)
    confidence = Column(Numeric(precision=5, scale=2), nullable=True)
    decision = Column(String(32), nullable=True, index=True)  # 'AUTO_PASS', 'HUMAN_REVIEW', 'HIGH_RISK'
    human_decision = Column(String(32), nullable=True, index=True)  # 'APPROVE', 'REJECT', 'EXCEPTION', 'ESCALATE'

    # Cached Serialized Diagnostics for Direct UI Performance
    rules_triggered = Column(JSON, nullable=True)
    anomaly_details = Column(JSON, nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    # Synonyms for Dual Schema Access
    current_risk_score = synonym("risk_score")
    current_confidence = synonym("confidence")
    current_decision = synonym("decision")
    current_human_decision = synonym("human_decision")

    # Relational Navigation
    vendor = relationship("Vendor", back_populates="invoices")
    employee = relationship("Employee", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="invoice", cascade="all, delete-orphan", order_by="desc(RiskAssessment.created_at)")
    exceptions = relationship("ExceptionRecord", back_populates="invoice", cascade="all, delete-orphan")
    human_decisions = relationship("HumanDecision", back_populates="invoice", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        """
        Produces the exact JSON representation expected by the Next.js frontend.
        Preserves string-formatted JSON for rules_triggered and anomaly_details.
        """
        if isinstance(self.rules_triggered, (dict, list)):
            rules_str = json.dumps(self.rules_triggered)
        else:
            rules_str = str(self.rules_triggered or "[]")

        if isinstance(self.anomaly_details, (dict, list)):
            anomaly_str = json.dumps(self.anomaly_details)
        else:
            anomaly_str = str(self.anomaly_details or "{}")

        return {
            "id": str(self.id),
            "invoice_id": self.invoice_id,
            "employee_id": self.employee_id,
            "employee_name": self.employee_name or (self.employee.name if self.employee else None),
            "employee_dept": self.employee_dept or (self.employee.department if self.employee else None),
            "vendor_id": self.vendor_id,
            "vendor_name": self.vendor_name or (self.vendor.name if self.vendor else None),
            "invoice_date": self.invoice_date.isoformat() if self.invoice_date else None,
            "amount": float(self.amount) if self.amount is not None else 0.0,
            "currency": self.currency,
            "category": self.category,
            "description": self.description,
            "invoice_number": self.invoice_number,
            "approval_status": self.approval_status,
            "receipt_status": self.receipt_status,
            "payment_status": self.payment_status,
            "policy_category": self.policy_category,
            "risk_score": float(self.risk_score) if self.risk_score is not None else 0.0,
            "confidence": float(self.confidence) if self.confidence is not None else 0.0,
            "decision": self.decision,
            "human_decision": self.human_decision,
            "rules_triggered": rules_str,
            "anomaly_details": anomaly_str,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }


# Backward-compatible alias for existing codebase imports
Transaction = Invoice


class InvoiceItem(Base):
    """
    Granular Line Item Details for Invoices.
    Supports itemized GST/VAT audits and unit price drift analysis.
    """
    __tablename__ = "invoice_items"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    invoice_id = Column(Uuid, ForeignKey("invoices.id"), index=True, nullable=False)
    item_description = Column(Text, nullable=False)
    quantity = Column(Numeric(precision=10, scale=2), nullable=False, default=Decimal("1.00"))
    unit_price = Column(Numeric(precision=15, scale=2), nullable=False)
    total_price = Column(Numeric(precision=15, scale=2), nullable=False)

    invoice = relationship("Invoice", back_populates="items")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "invoice_id": str(self.invoice_id),
            "item_description": self.item_description,
            "quantity": float(self.quantity) if self.quantity is not None else 1.0,
            "unit_price": float(self.unit_price) if self.unit_price is not None else 0.0,
            "total_price": float(self.total_price) if self.total_price is not None else 0.0,
        }


# ============================================================================
# 5. RISK ASSESSMENTS & EVIDENCE (Immutable Forensic Run Records)
# ============================================================================

class RiskAssessment(Base):
    """
    Immutable Evaluation Run Record.
    Every re-evaluation creates a new versioned run, preserving historical forensic integrity.
    """
    __tablename__ = "risk_assessments"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    invoice_id = Column(Uuid, ForeignKey("invoices.id"), index=True, nullable=False)
    version = Column(Integer, nullable=False, default=1)

    # Core Composite Verdict
    risk_score = Column(Numeric(precision=5, scale=2), nullable=False)
    confidence = Column(Numeric(precision=5, scale=2), nullable=False)
    decision = Column(String(32), nullable=False)

    # Detailed Sub-component Scores
    validation_risk = Column(Numeric(precision=5, scale=2), nullable=False, default=Decimal("0.00"))
    duplicate_risk = Column(Numeric(precision=5, scale=2), nullable=False, default=Decimal("0.00"))
    behavioral_risk = Column(Numeric(precision=5, scale=2), nullable=False, default=Decimal("0.00"))
    policy_risk = Column(Numeric(precision=5, scale=2), nullable=False, default=Decimal("0.00"))
    relationship_risk = Column(Numeric(precision=5, scale=2), nullable=False, default=Decimal("0.00"))
    anomaly_model_risk = Column(Numeric(precision=5, scale=2), nullable=False, default=Decimal("0.00"))

    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    invoice = relationship("Invoice", back_populates="risk_assessments")
    evidence = relationship("Evidence", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    exceptions = relationship("ExceptionRecord", back_populates="assessment", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "invoice_id": str(self.invoice_id),
            "version": self.version,
            "risk_score": float(self.risk_score) if self.risk_score is not None else 0.0,
            "confidence": float(self.confidence) if self.confidence is not None else 0.0,
            "decision": self.decision,
            "sub_scores": {
                "validation": float(self.validation_risk),
                "duplicate": float(self.duplicate_risk),
                "behavioral": float(self.behavioral_risk),
                "policy": float(self.policy_risk),
                "relationship": float(self.relationship_risk),
                "anomaly_model": float(self.anomaly_model_risk),
            },
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ExceptionRecord(Base):
    """
    Specific Exception or Policy Violation Flagged Against an Invoice.
    """
    __tablename__ = "exceptions"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    invoice_id = Column(Uuid, ForeignKey("invoices.id"), index=True, nullable=False)
    assessment_id = Column(Uuid, ForeignKey("risk_assessments.id"), index=True, nullable=True)
    rule_id = Column(String(64), ForeignKey("rules.id"), index=True, nullable=True)

    exception_type = Column(String(32), nullable=False)  # 'POLICY', 'DUPLICATE', 'BEHAVIORAL', 'VALIDATION'
    message = Column(Text, nullable=False)
    severity_score = Column(Numeric(precision=5, scale=2), nullable=False)
    evidence_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    invoice = relationship("Invoice", back_populates="exceptions")
    assessment = relationship("RiskAssessment", back_populates="exceptions")
    rule = relationship("Rule", back_populates="exceptions")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "invoice_id": str(self.invoice_id),
            "assessment_id": str(self.assessment_id) if self.assessment_id else None,
            "rule_id": self.rule_id,
            "rule_name": self.rule.name if self.rule else self.rule_id,
            "exception_type": self.exception_type,
            "message": self.message,
            "score_contribution": float(self.severity_score) if self.severity_score is not None else 0.0,
            "evidence_data": self.evidence_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Aliased for schema safety without shadowing Python's builtin Exception
Exception = ExceptionRecord


class Evidence(Base):
    """
    Rich Forensic Evidence Package (Graphs, Counterfactual Steps, Z-Scores).
    """
    __tablename__ = "evidence"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    assessment_id = Column(Uuid, ForeignKey("risk_assessments.id"), unique=True, nullable=False)

    behavioral_analysis = Column(JSON, nullable=True)
    duplicate_evidence = Column(JSON, nullable=True)
    relationship_flags = Column(JSON, nullable=True)
    evidence_graph = Column(JSON, nullable=True)
    counterfactual_steps = Column(JSON, nullable=True)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    assessment = relationship("RiskAssessment", back_populates="evidence")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "assessment_id": str(self.assessment_id),
            "behavioral_analysis": self.behavioral_analysis or {},
            "duplicate_evidence": self.duplicate_evidence or {},
            "relationship_flags": self.relationship_flags or [],
            "evidence_graph": self.evidence_graph or {"nodes": [], "edges": []},
            "counterfactual_steps": self.counterfactual_steps or [],
            "recommendation": self.recommendation or "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ============================================================================
# 6. HUMAN DECISIONS & IMMUTABLE SHA-256 AUDIT LOGS
# ============================================================================

class HumanDecision(Base):
    """
    Human Review and Governance Sign-Off Record.
    """
    __tablename__ = "human_decisions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_uuid = Column(Uuid, default=uuid.uuid4, index=True)
    
    # Linked transaction
    invoice_id = Column(Uuid, ForeignKey("invoices.id"), index=True, nullable=True)
    transaction_id = Column(String(64), index=True, nullable=True)  # Legacy string ID support

    # Reviewer identity
    user_id = Column(Uuid, ForeignKey("users.id"), index=True, nullable=True)
    reviewer_id = Column(String(128), nullable=True)
    reviewer_name = Column(String(128), nullable=True)
    reviewer_role = Column(String(64), nullable=True)  # 'AP / FINANCE REVIEWER', 'FINANCE MANAGER', 'AUDITOR'

    # Decision details
    decision = Column(String(32), nullable=False)  # 'APPROVE', 'REJECT', 'EXCEPTION', 'ESCALATE'
    reason = Column(Text, nullable=True)
    original_decision = Column(String(32), nullable=True)
    audit_event_id = Column(Integer, ForeignKey("audit_events.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    invoice = relationship("Invoice", back_populates="human_decisions")
    user = relationship("User", back_populates="human_decisions")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "decision_uuid": str(self.decision_uuid),
            "transaction_id": str(self.invoice_id) if self.invoice_id else self.transaction_id,
            "reviewer_id": self.reviewer_id,
            "reviewer_role": self.reviewer_role,
            "decision": self.decision,
            "reason": self.reason,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "original_decision": self.original_decision,
            "audit_event_id": self.audit_event_id,
        }


class AuditEvent(Base):
    """
    Tamper-Evident Sequential SHA-256 Hash Chain Ledger.
    Every event payload is hashed in sequence with prev_hash, creating an immutable chain.
    """
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(String(64), index=True, nullable=False)
    event_type = Column(String(64), index=True, nullable=False)
    event_data = Column(JSON, nullable=False)  # JSON payload
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    hash = Column(String(64), nullable=False, unique=True, index=True)
    prev_hash = Column(String(64), nullable=False)
    block_index = Column(Integer, nullable=False, unique=True, index=True)

    def to_dict(self) -> Dict[str, Any]:
        if isinstance(self.event_data, (dict, list)):
            event_data_repr = json.dumps(self.event_data)
        else:
            event_data_repr = str(self.event_data or "{}")

        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "event_type": self.event_type,
            "event_data": event_data_repr,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "hash": self.hash,
            "prev_hash": self.prev_hash,
            "block_index": self.block_index,
        }
