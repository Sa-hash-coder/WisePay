from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    invoice_id = Column(String, index=True)
    employee_id = Column(String, index=True)
    employee_name = Column(String)
    employee_dept = Column(String)
    vendor_id = Column(String, index=True)
    vendor_name = Column(String)
    invoice_date = Column(DateTime)
    amount = Column(Float)
    currency = Column(String, default="INR")
    category = Column(String)
    description = Column(Text)
    invoice_number = Column(String)
    approval_status = Column(String)
    receipt_status = Column(String)
    payment_status = Column(String)
    policy_category = Column(String)
    
    risk_score = Column(Float)
    confidence = Column(Float)
    decision = Column(String)  # AUTO_PASS / HUMAN_REVIEW / HIGH_RISK
    human_decision = Column(String, nullable=True)
    rules_triggered = Column(Text)  # JSON string
    anomaly_details = Column(Text)  # JSON string
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "invoice_id": self.invoice_id,
            "employee_id": self.employee_id,
            "employee_name": self.employee_name,
            "employee_dept": self.employee_dept,
            "vendor_id": self.vendor_id,
            "vendor_name": self.vendor_name,
            "invoice_date": self.invoice_date.isoformat() if self.invoice_date else None,
            "amount": self.amount,
            "currency": self.currency,
            "category": self.category,
            "description": self.description,
            "invoice_number": self.invoice_number,
            "approval_status": self.approval_status,
            "receipt_status": self.receipt_status,
            "payment_status": self.payment_status,
            "policy_category": self.policy_category,
            "risk_score": self.risk_score,
            "confidence": self.confidence,
            "decision": self.decision,
            "human_decision": self.human_decision,
            "rules_triggered": self.rules_triggered,
            "anomaly_details": self.anomaly_details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, index=True)
    event_type = Column(String)
    event_data = Column(Text)  # JSON string
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    hash = Column(String)
    prev_hash = Column(String)
    block_index = Column(Integer)

    def to_dict(self):
        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "event_type": self.event_type,
            "event_data": self.event_data,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "hash": self.hash,
            "prev_hash": self.prev_hash,
            "block_index": self.block_index,
        }

class HumanDecision(Base):
    __tablename__ = "human_decisions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, ForeignKey("transactions.id"))
    reviewer_id = Column(String)
    reviewer_role = Column(String, nullable=True)  # EXACT 3: 'AP / FINANCE REVIEWER', 'FINANCE MANAGER', 'AUDITOR'
    decision = Column(String)
    reason = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    original_decision = Column(String)
    audit_event_id = Column(Integer, ForeignKey("audit_events.id"))

    def to_dict(self):
        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "reviewer_id": self.reviewer_id,
            "reviewer_role": self.reviewer_role,
            "decision": self.decision,
            "reason": self.reason,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "original_decision": self.original_decision,
            "audit_event_id": self.audit_event_id,
        }


