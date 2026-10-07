import datetime
import logging
from pathlib import Path
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger("wisepay.ml.inference")

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_FILE = ARTIFACTS_DIR / "anomaly_model.joblib"
ONNX_MODEL_FILE = ARTIFACTS_DIR / "anomaly_model.onnx"

DEFAULT_CATEGORIES = [
    "IT Services", "Office", "Cloud", "Printing", "Travel",
    "Food", "Equipment", "Legal", "Facility", "Security",
    "Logistics", "Consulting", "Marketing", "Supplies", "General"
]


class AnomalyInferenceEngine:
    """
    Inference-only ML anomaly detector.
    Powered by Microsoft ONNX Runtime for ultra-fast, cross-platform execution
    of our in-house trained Isolation Forest artifact.
    Falls back gracefully to Joblib / Scikit-Learn or heuristic baseline.
    """
    def __init__(self, model_path: Path = MODEL_FILE, onnx_path: Path = ONNX_MODEL_FILE):
        self.model_path = model_path
        self.onnx_path = onnx_path
        self.model = None
        self.onnx_session = None
        self.categories = DEFAULT_CATEGORIES
        self.is_loaded = False
        self.runtime_backend = "heuristic"
        self._load_model()

    def _load_model(self) -> None:
        # 1. Try Microsoft ONNX Runtime (fastest & native Microsoft stack)
        if self.onnx_path.exists():
            try:
                import onnxruntime as rt
                # Suppress noisy ONNX verbose logs
                opts = rt.SessionOptions()
                opts.log_severity_level = 3
                self.onnx_session = rt.InferenceSession(str(self.onnx_path), sess_options=opts)
                self.is_loaded = True
                self.runtime_backend = "Microsoft ONNX Runtime"
                logger.info("Successfully loaded anomaly model into Microsoft ONNX Runtime from %s", self.onnx_path)
            except Exception as e:
                logger.warning("Microsoft ONNX Runtime session creation notice: %s. Trying joblib...", e)

        # 2. Try Scikit-Learn Joblib artifact
        if not self.is_loaded and self.model_path.exists():
            try:
                import joblib
                bundle = joblib.load(self.model_path)
                if isinstance(bundle, dict):
                    self.model = bundle.get("model")
                    self.categories = bundle.get("categories", DEFAULT_CATEGORIES)
                else:
                    self.model = bundle
                self.is_loaded = True
                self.runtime_backend = "Scikit-Learn Joblib"
                logger.info("Successfully loaded pre-trained anomaly model from %s", self.model_path)
                return
            except Exception as e:
                logger.warning("Failed to load anomaly model artifact from %s: %s.", self.model_path, e)

        if not self.is_loaded:
            logger.info("Artifact not found. Anomaly inference will operate with statistical heuristic fallback.")

    def extract_features(self, invoice_data: Dict[str, Any]) -> pd.DataFrame:
        amount = float(invoice_data.get("amount", 0.0))

        inv_date = invoice_data.get("invoice_date")
        if isinstance(inv_date, str):
            try:
                inv_date = datetime.datetime.fromisoformat(inv_date)
            except Exception:
                inv_date = datetime.datetime.utcnow()
        elif not isinstance(inv_date, (datetime.datetime, datetime.date)):
            inv_date = datetime.datetime.utcnow()

        day_of_week = inv_date.weekday()
        day_of_month = inv_date.day
        is_round = 1 if int(amount) % 1000 == 0 and amount > 0 else 0

        cat = invoice_data.get("category", "General")
        cat_encoded = self.categories.index(cat) if cat in self.categories else 0

        return pd.DataFrame([{
            "amount": amount,
            "day_of_week": day_of_week,
            "day_of_month": day_of_month,
            "is_round_number": is_round,
            "category_encoded": cat_encoded
        }])

    def predict(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes inference to score how anomalous an invoice is (0.0 to 100.0).
        """
        if self.is_loaded:
            # 1. Try Microsoft ONNX Runtime execution
            if self.onnx_session is not None:
                try:
                    features_df = self.extract_features(invoice_data)
                    features_array = features_df.to_numpy(dtype=np.float32)
                    onnx_outputs = self.onnx_session.run(None, {"float_input": features_array})
                    # onnx_outputs[0] is array([[label]]), where -1 is outlier, 1 is inlier
                    # onnx_outputs[1] is array([[raw_decision_score]])
                    is_outlier = bool(onnx_outputs[0][0][0] == -1)
                    raw_score = float(onnx_outputs[1][0][0])
                    normalized = 50.0 - (raw_score * 100.0)
                    anomaly_score = max(0.0, min(100.0, round(normalized, 1)))
                    return {
                        "anomaly_score": anomaly_score,
                        "is_anomaly": is_outlier,
                        "engine": "Microsoft ONNX Runtime",
                    }
                except Exception as e:
                    logger.warning("ONNX execution notice: %s. Falling back to Scikit-Learn...", e)

            # 2. Scikit-Learn fallback
            if self.model is not None:
                try:
                    features = self.extract_features(invoice_data)
                    raw_score = self.model.decision_function(features)[0]
                    is_outlier = bool(self.model.predict(features)[0] == -1)

                    normalized = 50.0 - (float(raw_score) * 100.0)
                    anomaly_score = max(0.0, min(100.0, round(normalized, 1)))
                    return {
                        "anomaly_score": anomaly_score,
                        "is_anomaly": is_outlier,
                        "engine": "Scikit-Learn Joblib",
                    }
                except Exception as e:
                    logger.warning("Error running inference on model: %s. Falling back.", e)

        # Statistical Heuristic Fallback
        amount = float(invoice_data.get("amount", 0.0))
        is_round = int(amount) % 10000 == 0 and amount >= 50000
        is_large = amount > 250000.0

        score = 15.0
        if is_large:
            score += 35.0
        if is_round:
            score += 20.0

        score = min(95.0, score)
        return {
            "anomaly_score": round(score, 1),
            "is_anomaly": score >= 50.0,
        }


# Singleton engine instance loaded once at module level
_inference_engine = AnomalyInferenceEngine()


def predict_anomaly(invoice_data: Dict[str, Any]) -> Dict[str, Any]:
    """Public helper for inference-only anomaly scoring."""
    return _inference_engine.predict(invoice_data)
