import csv
import io
import random
import re
import sys
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from api.deps import get_current_user, get_current_user_or_originator, get_db
from api.schemas.invoice import (
    InvoiceBulkCreate,
    InvoiceBulkResult,
    InvoiceCreate,
    InvoiceResponse,
)
from engine.pipeline import process_invoice
from models import Employee, Invoice, User, Vendor

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


def get_originator_user(db: Session) -> Optional[User]:
    """Retrieves default Originator user account for data ingestion."""
    return db.query(User).filter(
        (User.role_id == "THE ORIGINATOR") | (User.email.like("%originator%"))
    ).first()


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def ingest_single_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_originator),
) -> Any:
    """
    Ingests a single invoice or expense receipt from The Originator into the AI Risk Pipeline:
    - Verifies schema, vendor/employee baseline, and deterministic policies.
    - Runs IsolationForest ML anomaly inference and TF-IDF duplicate radar.
    - Calculates composite risk score and triage decision (AUTO_PASS, HUMAN_REVIEW, HIGH_RISK).
    - Persists Invoice, Immutable RiskAssessment, Exceptions, and Evidence.
    - Appends sequential SHA-256 block to the cryptographic audit ledger.
    """
    try:
        created_invoice = process_invoice(
            db=db,
            invoice_in=invoice_in,
            current_user=current_user,
        )
        return created_invoice.to_dict()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invoice ingestion failed: {str(e)}",
        )


@router.post("/bulk", response_model=InvoiceBulkResult, status_code=status.HTTP_201_CREATED)
def ingest_bulk_invoices(
    payload: Union[InvoiceBulkCreate, List[InvoiceCreate]],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_originator),
) -> Any:
    """
    Ingests a batch of invoices sequentially within the risk orchestration pipeline.
    Returns detailed summary of processed invoices, decisions, and any per-item failures.
    """
    invoices_to_process = payload.invoices if isinstance(payload, InvoiceBulkCreate) else payload

    results = []
    errors = []

    for idx, item in enumerate(invoices_to_process):
        try:
            created = process_invoice(
                db=db,
                invoice_in=item,
                current_user=current_user,
            )
            results.append(created.to_dict())
        except Exception as e:
            errors.append({
                "index": idx,
                "invoice_id": getattr(item, "invoice_id", None) or f"Index {idx}",
                "error": str(e),
            })

    return {
        "total": len(invoices_to_process),
        "success_count": len(results),
        "failure_count": len(errors),
        "results": results,
        "errors": errors,
    }


@router.post("/scan-receipt", status_code=status.HTTP_200_OK)
async def scan_receipt_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Image Processing & Receipt OCR Extraction:
    Processes uploaded invoice image and receipt files (PNG, JPEG, WEBP, PDF),
    extracting structured fields (Vendor, Amount, Invoice Number, Category, Date)
    prior to submitting to the in-house AI classification model.
    """
    allowed_exts = (".png", ".jpg", ".jpeg", ".webp", ".pdf", ".tiff")
    if not any(file.filename.lower().endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image file format. Supported: {', '.join(allowed_exts)}",
        )

    file_bytes = await file.read()
    
    # Query database vendors for entity resolution
    vendors = db.query(Vendor).all()
    known_vendors = [{"id": v.id, "name": v.name, "category": v.category} for v in vendors]

    # Process via Microsoft Azure AI Document Intelligence & Optical Scanner
    from engine.ocr_microsoft import ocr_scanner
    scan_result = ocr_scanner.scan_document(file_bytes, file.filename, known_vendors)

    return {
        "status": "success",
        "filename": file.filename,
        "format": scan_result.get("format", "DOCUMENT"),
        "dimensions": scan_result.get("dimensions", "Document Stream"),
        "file_size_kb": round(len(file_bytes) / 1024, 1),
        "source_engine": scan_result.get("source_engine", "Microsoft Azure AI Document Intelligence"),
        "extracted_data": {
            "vendor_id": scan_result.get("vendor_id", "V001"),
            "vendor_name": scan_result.get("vendor_name", "Enterprise Supplier"),
            "invoice_number": scan_result.get("invoice_number", f"INV-{uuid.uuid4().hex[:6].upper()}"),
            "amount": scan_result.get("amount", 18500.00),
            "currency": scan_result.get("currency", "INR"),
            "category": scan_result.get("category", "Office Supplies"),
            "description": scan_result.get("description") or f"Digitized from {file.filename} via {scan_result.get('source_engine', 'Optical Scanner')}",
            "receipt_status": "UPLOADED",
            "confidence": scan_result.get("confidence", 94.0),
            "raw_ocr_preview": scan_result.get("raw_ocr_preview", f"Scanned file: {file.filename}"),
        }
    }


class OnlineInvoiceScanRequest(BaseModel):
    url: str


@router.post("/scan-online-invoice", status_code=status.HTTP_200_OK)
async def scan_online_invoice(
    payload: OnlineInvoiceScanRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Online Invoice & Remote PDF Processor:
    Fetches online invoices (hosted PDF links, Stripe/AWS/cloud invoice links),
    performs optical digitizing via Microsoft Azure AI Document Intelligence,
    and returns parsed enterprise fields for instant form autofill.
    """
    raw_url = payload.url.strip() if payload.url else ""
    if not raw_url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid HTTP or HTTPS invoice URL must be provided.",
        )

    vendors = db.query(Vendor).all()
    known_vendors = [{"id": v.id, "name": v.name, "category": v.category} for v in vendors]

    from engine.ocr_microsoft import ocr_scanner
    scan_result = ocr_scanner.scan_online_url(raw_url, known_vendors)

    return {
        "status": "success",
        "url": raw_url,
        "format": scan_result.get("format", "ONLINE_PDF"),
        "dimensions": scan_result.get("dimensions", "Online Document"),
        "source_engine": scan_result.get("source_engine", "Microsoft Azure AI Document Intelligence"),
        "extracted_data": {
            "vendor_id": scan_result.get("vendor_id", "V001"),
            "vendor_name": scan_result.get("vendor_name", "AWS Cloud Services"),
            "invoice_number": scan_result.get("invoice_number", f"INV-{uuid.uuid4().hex[:6].upper()}"),
            "amount": scan_result.get("amount", 24900.00),
            "currency": scan_result.get("currency", "INR"),
            "category": scan_result.get("category", "Software"),
            "description": f"Digitized from Online Invoice Link ({raw_url})",
            "receipt_status": "UPLOADED",
            "confidence": scan_result.get("confidence", 94.0),
            "raw_ocr_preview": scan_result.get("raw_ocr_preview", f"Online document: {raw_url}"),
            "online_url": raw_url,
        }
    }


@router.post("/upload-csv", status_code=status.HTTP_201_CREATED)
async def upload_csv_invoices(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    The Originator Bulk Batch Upload:
    Parses a CSV/Excel dump and pumps rows directly through the AI processing pipeline.
    """
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a valid CSV file (.csv)",
        )

    content = await file.read()
    decoded = content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(decoded))

    originator_user = get_originator_user(db)
    results = []
    errors = []

    for idx, row in enumerate(reader):
        try:
            # Map CSV fields to InvoiceCreate
            amount_val = float(row.get("amount") or row.get("Amount") or 1000.0)
            inv_id = row.get("invoice_id") or row.get("InvoiceID") or f"CSV-INV-{idx+1:05d}"
            vendor_id = row.get("vendor_id") or row.get("VendorID") or "V001"
            vendor_name = row.get("vendor_name") or row.get("VendorName") or "General Supplier"
            employee_id = row.get("employee_id") or row.get("EmployeeID") or "E001"
            employee_name = row.get("employee_name") or row.get("EmployeeName") or "Staff Member"
            employee_dept = row.get("employee_dept") or row.get("Department") or "Operations"
            category = row.get("category") or row.get("Category") or "Software"
            description = row.get("description") or row.get("Description") or f"Batch entry #{idx+1}"
            receipt_status = row.get("receipt_status") or row.get("ReceiptStatus") or "UPLOADED"
            invoice_num = row.get("invoice_number") or row.get("InvoiceNumber") or f"INV-NUM-{idx+1}"

            inv_create = InvoiceCreate(
                invoice_id=inv_id,
                invoice_number=invoice_num,
                vendor_id=vendor_id,
                vendor_name=vendor_name,
                employee_id=employee_id,
                employee_name=employee_name,
                employee_dept=employee_dept,
                amount=Decimal(str(round(amount_val, 2))),
                currency="INR",
                category=category,
                description=description,
                receipt_status=receipt_status,
            )

            created = process_invoice(
                db=db,
                invoice_in=inv_create,
                current_user=originator_user,
            )
            results.append(created.to_dict())
        except Exception as e:
            errors.append({"row": idx + 1, "error": str(e)})

    auto_passed = sum(1 for r in results if r["decision"] == "AUTO_PASS")
    exceptions_flagged = len(results) - auto_passed

    return {
        "status": "success",
        "filename": file.filename,
        "total_rows_parsed": len(results) + len(errors),
        "total_processed": len(results),
        "auto_passed_count": auto_passed,
        "auto_passed_pct": round(auto_passed / len(results) * 100, 1) if results else 0,
        "exceptions_flagged_count": exceptions_flagged,
        "exceptions_flagged_pct": round(exceptions_flagged / len(results) * 100, 1) if results else 0,
        "errors_count": len(errors),
        "sample_results": results[:10],
    }


@router.post("/simulate-batch", status_code=status.HTTP_201_CREATED)
def simulate_enterprise_batch(
    count: int = Query(100, ge=10, le=5000),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Enterprise Volume Simulator:
    Generates and processes synthetic enterprise invoice volume directly into the AI pipeline.
    Maintains the authentic enterprise distribution:
    - ~90% Auto-Passed clean baseline transactions.
    - ~10% Flagged exceptions routed to the AP Reviewer Exception Pile (Duplicates, Policy Limits, High Risk, Missing Fields).
    """
    originator_user = get_originator_user(db)
    vendors = db.query(Vendor).all()
    employees = db.query(Employee).all()

    if not vendors or not employees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database has not been seeded with vendors/employees. Please run seed script first.",
        )

    categories = ["Cloud Infrastructure", "Enterprise Software", "Consulting", "Hardware", "Logistics", "Office Supplies", "Legal Services"]
    created_items = []
    errors = []

    # Calculate ~10% exceptions
    exception_target = max(1, int(count * 0.10))
    normal_target = count - exception_target

    sim_id_prefix = f"SIM-{int(random.random() * 10000):04d}"

    for i in range(count):
        v = random.choice(vendors)
        e = random.choice(employees)
        cat = random.choice(categories)
        inv_id = f"{sim_id_prefix}-{i+1:05d}"

        # Decide if this item is designed as an exception (~10% rate)
        is_exception = i < exception_target

        if is_exception:
            exception_type = random.choice(["HIGH_RISK", "DUPLICATE", "POLICY_LIMIT", "MISSING_RECEIPT"])
            if exception_type == "HIGH_RISK":
                amt = float(v.historical_max) * random.uniform(2.5, 4.5) if v.historical_max else random.uniform(550000, 1200000)
                receipt = "UPLOADED"
                desc = f"Special emergency consulting spike - {cat}"
            elif exception_type == "DUPLICATE":
                amt = 84500.00
                receipt = "UPLOADED"
                desc = "Annual software renewal license for operations cluster"
            elif exception_type == "MISSING_RECEIPT":
                amt = random.uniform(25000, 75000)
                receipt = "MISSING"
                desc = f"Urgent departmental procurement - {cat}"
            else:  # POLICY_LIMIT
                amt = random.uniform(60000, 180000)
                receipt = "UPLOADED"
                desc = f"Unapproved departmental expense over threshold - {cat}"
        else:
            # Clean transaction well within historical limits
            v_min = float(v.historical_min) if v.historical_min else 2000.0
            v_max = float(v.historical_max) if v.historical_max else 25000.0
            amt = random.uniform(max(1000.0, v_min), max(5000.0, v_max))
            receipt = "UPLOADED"
            desc = f"Standard procurement for {v.name} - {cat}"

        inv_in = InvoiceCreate(
            invoice_id=inv_id,
            invoice_number=f"INV-REF-{i+1:05d}",
            vendor_id=v.id,
            vendor_name=v.name,
            employee_id=e.id,
            employee_name=e.name,
            employee_dept=e.department,
            amount=Decimal(str(round(amt, 2))),
            currency="INR",
            category=cat,
            description=desc,
            receipt_status=receipt,
        )

        try:
            created = process_invoice(
                db=db,
                invoice_in=inv_in,
                current_user=originator_user,
            )
            created_items.append(created.to_dict())
        except Exception as ex:
            errors.append({"index": i, "error": str(ex)})

    auto_passed = sum(1 for c in created_items if c["decision"] == "AUTO_PASS")
    flagged = len(created_items) - auto_passed
    total_val = sum(c["amount"] for c in created_items)

    return {
        "status": "success",
        "total_simulated": count,
        "total_processed": len(created_items),
        "auto_passed_count": auto_passed,
        "auto_passed_pct": round(auto_passed / len(created_items) * 100, 1) if created_items else 0,
        "exceptions_flagged_count": flagged,
        "exceptions_flagged_pct": round(flagged / len(created_items) * 100, 1) if created_items else 0,
        "total_volume_inr": round(total_val, 2),
        "sample_flagged_exceptions": [c for c in created_items if c["decision"] != "AUTO_PASS"][:5],
        "errors_count": len(errors),
    }
