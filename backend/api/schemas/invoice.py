import datetime
import decimal
import json
import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, field_validator


class InvoiceItemCreate(BaseModel):
    item_description: str
    quantity: Decimal = Field(default=Decimal("1.00"), ge=Decimal("0.01"))
    unit_price: Decimal = Field(ge=Decimal("0.00"))
    total_price: Optional[Decimal] = None


class InvoiceCreate(BaseModel):
    invoice_id: Optional[str] = None
    invoice_number: Optional[str] = None
    vendor_id: str
    vendor_name: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    employee_dept: Optional[str] = None
    invoice_date: Optional[datetime.datetime] = None
    amount: Decimal = Field(gt=Decimal("0.00"))
    currency: str = "INR"
    category: Optional[str] = "General"
    description: Optional[str] = None
    approval_status: str = "PENDING"
    receipt_status: str = "UPLOADED"
    payment_status: str = "PENDING"
    policy_category: str = "Standard"
    items: Optional[List[InvoiceItemCreate]] = None


class InvoiceResponse(BaseModel):
    """
    Next.js Frontend Compatible Response Schema.
    Coerces database Decimal / Numeric values into JSON numbers (floats)
    and serializes UUIDs and stringified JSON diagnostic blobs.
    """
    id: str
    invoice_id: str
    invoice_number: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    employee_dept: Optional[str] = None
    vendor_id: Optional[str] = None
    vendor_name: Optional[str] = None
    invoice_date: Optional[str] = None
    amount: float
    currency: str = "INR"
    category: Optional[str] = None
    description: Optional[str] = None
    approval_status: str
    receipt_status: str
    payment_status: str
    policy_category: Optional[str] = "Standard"
    risk_score: float
    confidence: float
    decision: str
    human_decision: Optional[str] = None
    rules_triggered: str
    anomaly_details: str
    created_at: Optional[str] = None
    processed_at: Optional[str] = None

    class Config:
        from_attributes = True

    @field_validator("id", mode="before")
    def coerce_id(cls, v: Any) -> str:
        return str(v) if v is not None else ""

    @field_validator("amount", "risk_score", "confidence", mode="before")
    def coerce_floats(cls, v: Any) -> float:
        if v is None:
            return 0.0
        return float(v)

    @field_validator("invoice_date", "created_at", "processed_at", mode="before")
    def coerce_dates(cls, v: Any) -> Optional[str]:
        if isinstance(v, (datetime.datetime, datetime.date)):
            return v.isoformat()
        return str(v) if v is not None else None

    @field_validator("rules_triggered", mode="before")
    def coerce_rules_triggered(cls, v: Any) -> str:
        if isinstance(v, (dict, list)):
            return json.dumps(v)
        return str(v or "[]")

    @field_validator("anomaly_details", mode="before")
    def coerce_anomaly_details(cls, v: Any) -> str:
        if isinstance(v, (dict, list)):
            return json.dumps(v)
        return str(v or "{}")


class InvoiceBulkCreate(BaseModel):
    invoices: List[InvoiceCreate]


class InvoiceBulkResult(BaseModel):
    total: int
    success_count: int
    failure_count: int
    results: List[InvoiceResponse]
    errors: List[Dict[str, Any]]
