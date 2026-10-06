from sklearn.ensemble import IsolationForest
import pandas as pd
import datetime

# Global model instance
_iso_forest = None
_categories = []

def train_anomaly_model(all_transactions_df):
    global _iso_forest, _categories
    
    if all_transactions_df.empty:
        return
        
    df = all_transactions_df.copy()
    
    # Feature Engineering
    df['invoice_date'] = pd.to_datetime(df['invoice_date'])
    df['day_of_week'] = df['invoice_date'].dt.dayofweek
    df['day_of_month'] = df['invoice_date'].dt.day
    df['is_round_number'] = (df['amount'] % 1000 == 0).astype(int)
    
    _categories = df['category'].unique().tolist()
    df['category_encoded'] = df['category'].apply(lambda x: _categories.index(x) if x in _categories else 0)
    
    features = ['amount', 'day_of_week', 'day_of_month', 'is_round_number', 'category_encoded']
    X = df[features].fillna(0)
    
    _iso_forest = IsolationForest(contamination=0.05, random_state=42)
    _iso_forest.fit(X)

def detect_anomaly(transaction):
    global _iso_forest, _categories
    
    if _iso_forest is None:
        return {"anomaly_score": 0.0, "is_anomaly": False}
        
    # Prepare features
    inv_date = transaction['invoice_date']
    if isinstance(inv_date, str):
        inv_date = datetime.datetime.fromisoformat(inv_date)
        
    day_of_week = inv_date.weekday() if inv_date else 0
    day_of_month = inv_date.day if inv_date else 1
    is_round_number = 1 if transaction['amount'] % 1000 == 0 else 0
    category_encoded = _categories.index(transaction['category']) if transaction['category'] in _categories else 0
    
    features = pd.DataFrame([{
        'amount': transaction['amount'],
        'day_of_week': day_of_week,
        'day_of_month': day_of_month,
        'is_round_number': is_round_number,
        'category_encoded': category_encoded
    }])
    
    score = _iso_forest.decision_function(features)[0]
    is_outlier = _iso_forest.predict(features)[0] == -1
    
    # Convert score to 0-100 scale (lower decision_function = more anomalous)
    # Typical range is -0.5 to 0.5
    normalized_score = 50 - (score * 100)
    anomaly_score = max(0, min(100, normalized_score))
    
    return {
        "anomaly_score": float(anomaly_score),
        "is_anomaly": bool(is_outlier)
    }
