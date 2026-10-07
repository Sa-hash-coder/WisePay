from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class DecisionCreate(BaseModel):
    """
    Human Review and Governance Sign-Off Request Schema.
    Compatible with both the frontend api.feedback.submit call and the
    standard POST /api/investigation/{id}/decision endpoint.
    """
    decision: str = Field(..., description="Decision verdict: 'APPROVE', 'REJECT', 'EXCEPTION', 'ESCALATE'")
    reason: Optional[str] = Field(default="", description="Governance justification and audit rationale")
    reviewer_id: Optional[str] = Field(default=None, description="Optional reviewer name or identifier")
    reviewer_role: Optional[str] = Field(default=None, description="Optional organizational role claim")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional governance context")


class DecisionResponse(BaseModel):
    """
    Response Schema for Recorded Human Decision.
    """
    status: str
    decision_id: int
    decision_uuid: str
    transaction_id: str
    reviewer_id: Optional[str] = None
    reviewer_role: str
    decision: str
    reason: Optional[str] = None
    audit_event_id: Optional[int] = None
    audit_hash: Optional[str] = None
