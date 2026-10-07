"""
Offline Training Script for IsolationForest Anomaly Artifact
Generates backend/engine/artifacts/anomaly_model.joblib
"""
import os
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_FILE = ARTIFACTS_DIR / "anomaly_model.joblib"

CATEGORIES = [
    "IT Services", "Office", "Cloud", "Printing", "Travel",
    "Food", "Equipment", "Legal", "Facility", "Security",
    "Logistics", "Consulting", "Marketing", "Supplies", "General"
]

def generate_baseline_dataset(n_samples=5000):
    np.random.seed(42)
    amounts = np.random.exponential(scale=35000, size=n_samples) + 2000
    days_of_week = np.random.choice([0, 1, 2, 3, 4], size=n_samples) # mostly weekdays
    days_of_month = np.random.randint(1, 29, size=n_samples)
    is_round = (amounts.astype(int) % 1000 == 0).astype(int)
    cat_indices = np.random.randint(0, len(CATEGORIES), size=n_samples)

    # Inject minor outliers
    outlier_idx = np.random.choice(n_samples, size=int(n_samples * 0.05), replace=False)
    amounts[outlier_idx] = np.random.uniform(300000, 1500000, size=len(outlier_idx))
    days_of_week[outlier_idx] = np.random.choice([5, 6], size=len(outlier_idx))

    df = pd.DataFrame({
        "amount": amounts,
        "day_of_week": days_of_week,
        "day_of_month": days_of_month,
        "is_round_number": is_round,
        "category_encoded": cat_indices
    })
    return df

def train_and_export():
    print(f"Training baseline Isolation Forest on synthetic dataset...")
    df = generate_baseline_dataset()
    features = ['amount', 'day_of_week', 'day_of_month', 'is_round_number', 'category_encoded']
    X = df[features]

    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)

    artifact_bundle = {
        "model": model,
        "features": features,
        "categories": CATEGORIES,
        "version": "1.0.0",
    }
    joblib.dump(artifact_bundle, MODEL_FILE)
    print(f"Artifact exported successfully to: {MODEL_FILE}")

    # Export to Microsoft ONNX format
    try:
        from skl2onnx import convert_sklearn
        from skl2onnx.common.data_types import FloatTensorType
        initial_type = [('float_input', FloatTensorType([None, len(features)]))]
        onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset={'': 15, 'ai.onnx.ml': 3})
        onnx_file = ARTIFACTS_DIR / "anomaly_model.onnx"
        with open(onnx_file, "wb") as f:
            f.write(onnx_model.SerializeToString())
        print(f"Microsoft ONNX model exported successfully to: {onnx_file}")
    except Exception as e:
        print(f"Notice: ONNX export skipped or encountered notice: {e}")

if __name__ == "__main__":
    train_and_export()
