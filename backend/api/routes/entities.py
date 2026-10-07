import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from api.deps import get_db
from models import Employee, Invoice, Vendor

router = APIRouter(prefix="/api/entities", tags=["entities"])


@router.get("/vendors")
def list_vendors(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    Returns enterprise vendor intelligence profiles with historical spend telemetry,
    categories, transaction counts, and risk distributions.
    """
    query = db.query(Vendor)

    if category and category != "ALL":
        query = query.filter(Vendor.category == category)

    vendors = query.all()
    results = []

    for v in vendors:
        v_dict = v.to_dict()
        if search:
            q = search.lower()
            if q not in v.name.lower() and q not in (v.category or "").lower() and q not in v.id.lower():
                continue

        # Calculate live aggregates from invoices table
        invoices = db.query(Invoice).filter(Invoice.vendor_id == v.id).all()
        flagged_count = sum(1 for inv in invoices if inv.decision in ["HIGH_RISK", "HUMAN_REVIEW"])
        high_risk_count = sum(1 for inv in invoices if inv.decision == "HIGH_RISK")
        total_invoices = len(invoices) or v.invoice_count or 1

        v_dict["live_invoice_count"] = len(invoices) or v.invoice_count
        v_dict["flagged_count"] = flagged_count
        v_dict["high_risk_count"] = high_risk_count
        v_dict["flag_rate"] = round((flagged_count / total_invoices) * 100, 1)
        
        # Risk level determination
        if high_risk_count > 0 or v_dict["flag_rate"] > 35:
            v_dict["risk_tier"] = "HIGH"
        elif flagged_count > 0 or v_dict["flag_rate"] > 15:
            v_dict["risk_tier"] = "MEDIUM"
        else:
            v_dict["risk_tier"] = "LOW"

        results.append(v_dict)

    # Sort by total spend descending
    results.sort(key=lambda x: x.get("total_spend", 0.0), reverse=True)
    return results


@router.get("/employees")
def list_employees(
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    Returns corporate employee submitter profiles with department limits,
    historical submissions, and policy compliance rates.
    """
    query = db.query(Employee)

    if department and department != "ALL":
        query = query.filter(Employee.department == department)

    employees = query.all()
    results = []

    for e in employees:
        e_dict = e.to_dict()
        if search:
            q = search.lower()
            if q not in e.name.lower() and q not in (e.department or "").lower() and q not in e.id.lower():
                continue

        # Invoices submitted by this employee
        invoices = db.query(Invoice).filter(Invoice.employee_id == e.id).all()
        total_spend = sum(float(inv.amount or 0.0) for inv in invoices)
        flagged_count = sum(1 for inv in invoices if inv.decision in ["HIGH_RISK", "HUMAN_REVIEW"])
        total_count = len(invoices) or 1

        e_dict["total_spend"] = total_spend
        e_dict["invoice_count"] = len(invoices)
        e_dict["flagged_count"] = flagged_count
        e_dict["compliance_rate"] = round(100.0 - ((flagged_count / total_count) * 100.0), 1)

        # Risk indicator
        if flagged_count >= 3 or e_dict["compliance_rate"] < 70:
            e_dict["status"] = "WATCHLIST"
        elif flagged_count >= 1:
            e_dict["status"] = "MONITORED"
        else:
            e_dict["status"] = "VERIFIED"

        results.append(e_dict)

    # Sort by total spend descending
    results.sort(key=lambda x: x.get("total_spend", 0.0), reverse=True)
    return results


@router.get("/summary")
def get_entities_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns high-level telemetry on vendors and employees for dashboard widgets.
    """
    vendor_count = db.query(Vendor).count()
    employee_count = db.query(Employee).count()
    
    total_vendor_spend = db.query(func.sum(Vendor.total_spend)).scalar() or 0.0
    
    categories = db.query(Vendor.category, func.count(Vendor.id)).group_by(Vendor.category).all()
    departments = db.query(Employee.department, func.count(Employee.id)).group_by(Employee.department).all()

    return {
        "total_vendors": vendor_count,
        "total_employees": employee_count,
        "total_vendor_spend": float(total_vendor_spend),
        "categories": [{"name": c[0], "count": c[1]} for c in categories if c[0]],
        "departments": [{"name": d[0], "count": d[1]} for d in departments if d[0]],
    }
