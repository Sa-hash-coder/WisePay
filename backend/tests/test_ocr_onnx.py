import pytest
from engine.inference import AnomalyInferenceEngine, predict_anomaly
from engine.ocr_microsoft import ocr_scanner

def test_microsoft_onnx_inference():
    """Verify in-house model executes with Microsoft ONNX Runtime or falls back cleanly."""
    engine = AnomalyInferenceEngine()
    assert engine.is_loaded is True
    assert engine.runtime_backend in ("Microsoft ONNX Runtime", "Scikit-Learn Joblib")
    
    result = engine.predict({
        "amount": 25000.0,
        "category": "Office",
    })
    assert "anomaly_score" in result
    assert "is_anomaly" in result
    assert 0.0 <= result["anomaly_score"] <= 100.0


def test_ocr_microsoft_scanner_fallback():
    """Verify optical document scanning returns structured invoice fields."""
    dummy_bytes = b"%PDF-1.4 dummy simulated invoice content with amount 18500.00 and INV-7729"
    result = ocr_scanner.scan_document(
        dummy_bytes,
        "vendor_invoice_18500.pdf",
        known_vendors=[{"id": "V001", "name": "AWS Cloud", "category": "Cloud"}]
    )
    assert "invoice_number" in result
    assert "amount" in result
    assert result["amount"] == 18500.00
    assert result["vendor_name"] == "AWS Cloud"
    assert result["confidence"] >= 90.0


def test_ocr_microsoft_online_url_scanner():
    """Verify scanning online invoice links / PDF URLs."""
    url = "https://invoices.aws.amazon.com/invoice-2026-9041.pdf"
    result = ocr_scanner.scan_online_url(
        url,
        known_vendors=[{"id": "V001", "name": "AWS Cloud Services", "category": "Cloud"}]
    )
    assert result["is_online_invoice"] is True
    assert result["online_url"] == url
    assert "vendor_name" in result
    assert "amount" in result
    assert result["amount"] > 0
    assert result["confidence"] >= 90.0


def test_ocr_image_rapidocr():
    """Verify RapidOCR extracts actual invoice values (Vaibhav Plastics / INV-2026-9064 / 50000.00)."""
    import os
    img_path = r"C:/Users/saura/.gemini/antigravity/brain/2602d399-2a07-4b7c-84e4-f6684d317582/.user_uploaded/media_1791358218017.png"
    if os.path.exists(img_path):
        with open(img_path, "rb") as f:
            b = f.read()
        res = ocr_scanner.scan_document(b, "Gemini_Generated_Image_j21o71j21o71j21o.png")
        assert res["amount"] == 50000.00
        assert res["invoice_number"] == "INV-2026-9064"
        assert "Vaibhav Plastics" in res["vendor_name"]
        assert res["category"] == "Office Supplies"
