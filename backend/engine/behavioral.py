import numpy as np
import pandas as pd

def analyze_behavior(transaction, vendor_history, employee_history):
    """
    Build behavioral fingerprints for vendor and employee.
    Returns behavioral_anomaly_score (0-100) and detailed analysis.
    """
    behavioral_anomaly_score = 0.0
    analysis = {
        "vendor_behavior": {},
        "employee_behavior": {}
    }
    
    # --- Vendor behavioral fingerprint ---
    if vendor_history is not None and not vendor_history.empty and len(vendor_history) >= 2:
        hist_amounts = vendor_history['amount'].values
        hist_mean = float(np.mean(hist_amounts))
        hist_std = float(np.std(hist_amounts))
        hist_min = float(np.min(hist_amounts))
        hist_max = float(np.max(hist_amounts))
        current_amount = float(transaction['amount'])
        
        # Avoid division by zero
        if hist_std < 1.0:
            hist_std = hist_mean * 0.1 if hist_mean > 0 else 1.0
        
        # Z-score deviation
        z_score = (current_amount - hist_mean) / hist_std
        
        # Also compute ratio vs historical max (very intuitive)
        ratio_to_max = current_amount / hist_max if hist_max > 0 else 1.0
        
        analysis["vendor_behavior"] = {
            "historical_mean": hist_mean,
            "historical_std": hist_std,
            "historical_min": hist_min,
            "historical_max": hist_max,
            "current_amount": current_amount,
            "z_score": round(float(z_score), 2),
            "ratio_to_max": round(float(ratio_to_max), 2),
            "sample_count": int(len(vendor_history))
        }
        
        # Score based on both z-score and ratio to max
        # Z-score: beyond 2 = anomalous, beyond 5 = highly anomalous
        if z_score > 5:
            vendor_score = min(100.0, 60.0 + (z_score - 5) * 5)
        elif z_score > 3:
            vendor_score = 40.0 + (z_score - 3) * 10
        elif z_score > 2:
            vendor_score = 20.0 + (z_score - 2) * 20
        else:
            vendor_score = max(0.0, z_score * 5)  # slight score for borderline
        
        # Boost if amount is > 3x historical max (very obvious anomaly)
        if ratio_to_max > 3:
            vendor_score = max(vendor_score, 70.0 + min(30.0, (ratio_to_max - 3) * 5))
        elif ratio_to_max > 1.5:
            vendor_score = max(vendor_score, 30.0 + (ratio_to_max - 1.5) * 20)
        
        behavioral_anomaly_score += vendor_score
        
    elif vendor_history is not None and not vendor_history.empty and len(vendor_history) == 1:
        # Only 1 prior record — limited basis, note it
        analysis["vendor_behavior"] = {
            "status": "LIMITED_HISTORY",
            "sample_count": 1,
            "prior_amount": float(vendor_history.iloc[0]['amount'])
        }
        behavioral_anomaly_score += 10.0  # small flag for limited history
    else:
        analysis["vendor_behavior"] = {"status": "NO_HISTORY"}
        behavioral_anomaly_score += 15.0  # new vendor = slight flag
        
    # --- Employee behavioral fingerprint ---
    if employee_history is not None and not employee_history.empty:
        emp_amounts = employee_history['amount'].values
        typical_mean = float(np.mean(emp_amounts))
        typical_std = float(np.std(emp_amounts)) if len(emp_amounts) > 1 else typical_mean * 0.3
        typical_categories = list(employee_history['category'].unique())
        
        current_amount = float(transaction['amount'])
        current_category = transaction['category']
        
        is_unusual_category = bool(current_category not in typical_categories)
        
        # Amount unusual if > 3x typical mean or > 4 std deviations above
        z_emp = (current_amount - typical_mean) / max(typical_std, 1.0)
        is_amount_unusual = bool(current_amount > 3 * typical_mean or z_emp > 4)
        
        analysis["employee_behavior"] = {
            "typical_mean": round(typical_mean, 2),
            "typical_std": round(float(typical_std), 2),
            "typical_categories": [str(c) for c in typical_categories],
            "is_unusual_category": is_unusual_category,
            "is_amount_unusual": is_amount_unusual,
            "z_score": round(float(z_emp), 2),
            "sample_count": int(len(employee_history))
        }
        
        # Employee score: category anomaly (20) + amount anomaly (30)
        emp_score = 0.0
        if is_unusual_category:
            emp_score += 20.0
        if is_amount_unusual:
            emp_score += min(40.0, (z_emp - 4) * 5 + 30.0) if z_emp > 4 else 30.0
            
        behavioral_anomaly_score = max(behavioral_anomaly_score, behavioral_anomaly_score + emp_score * 0.4)
    else:
        analysis["employee_behavior"] = {"status": "NO_HISTORY"}
     
    return {
        "behavioral_anomaly_score": round(min(100.0, behavioral_anomaly_score), 2),
        "analysis": analysis
    }
