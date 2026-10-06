from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import numpy as np

def detect_duplicates(transaction, history_df):
    if history_df is None or history_df.empty:
        return {"is_duplicate": False, "similarity_score": 0.0, "matched_invoice_id": None, "match_type": None}
    
    # Check exact match: same vendor_id + amount + invoice_number
    exact_matches = history_df[
        (history_df['vendor_id'] == transaction['vendor_id']) & 
        (history_df['amount'] == transaction['amount']) & 
        (history_df['invoice_number'] == transaction['invoice_number']) &
        (history_df['id'] != transaction['id'])
    ]
    
    if not exact_matches.empty:
        return {
            "is_duplicate": True, 
            "similarity_score": 1.0, 
            "matched_invoice_id": exact_matches.iloc[0]['id'], 
            "match_type": "EXACT"
        }
        
    # Check near match: same vendor_id + amount
    near_matches = history_df[
        (history_df['vendor_id'] == transaction['vendor_id']) & 
        (history_df['amount'] == transaction['amount']) &
        (history_df['id'] != transaction['id'])
    ]
    
    if near_matches.empty:
        return {"is_duplicate": False, "similarity_score": 0.0, "matched_invoice_id": None, "match_type": None}
        
    # Use TF-IDF on description field
    vectorizer = TfidfVectorizer()
    desc_list = [transaction['description']] + near_matches['description'].tolist()
    
    try:
        tfidf_matrix = vectorizer.fit_transform(desc_list)
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        
        max_sim_idx = np.argmax(cosine_sim)
        max_sim_score = cosine_sim[max_sim_idx]
        
        if max_sim_score > 0.8:
            return {
                "is_duplicate": True, 
                "similarity_score": float(max_sim_score), 
                "matched_invoice_id": near_matches.iloc[max_sim_idx]['id'], 
                "match_type": "NEAR"
            }
    except ValueError:
        # In case descriptions are empty or stop-words only
        pass
        
    return {"is_duplicate": False, "similarity_score": 0.0, "matched_invoice_id": None, "match_type": None}
