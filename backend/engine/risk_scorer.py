def calculate_risk(validation_flags, policy_rules, duplicate_info, behavioral_info, anomaly_info, relationship_info, transaction, vendor_history_count, employee_history_count):
    """
    Composite Risk & Confidence Engine.
    
    Principles:
    1. Severe anomalies (exact duplicates, 6x historical deviations, critical policy limits)
       must not be diluted by unaffected dimensions.
    2. Multi-signal compounding: multiple concurrent anomalies escalate risk.
    3. Confidence-Aware AI: When evidence is sparse or ambiguous, confidence drops,
       routing uncertain cases to HUMAN_REVIEW rather than automated auto-pass or high-risk lock.
    """
    
    # 1. Validation Risk (0 - 100)
    validation_risk = 0.0
    for flag in validation_flags:
        if flag.get('severity') == 'HIGH' or 'missing_invoice_number' in str(flag):
            validation_risk += 60.0
        else:
            validation_risk += 30.0
    validation_risk = min(100.0, validation_risk)
    
    # 2. Duplicate Risk (0 - 100)
    duplicate_risk = 0.0
    if duplicate_info.get('is_duplicate'):
        if duplicate_info.get('match_type') == 'EXACT':
            duplicate_risk = 96.0
        else:
            sim = float(duplicate_info.get('similarity_score', 0.85))
            # e.g., 0.85 -> 78, 0.95 -> 92
            duplicate_risk = min(95.0, 60.0 + (sim * 35.0))
            
    # 3. Behavioral Risk (0 - 100)
    behavioral_risk = 0.0
    raw_behavioral_score = float(behavioral_info.get('behavioral_anomaly_score', 0.0))
    vendor_beh = behavioral_info.get('analysis', {}).get('vendor_behavior', {})
    
    ratio_to_max = float(vendor_beh.get('ratio_to_max', 1.0)) if isinstance(vendor_beh, dict) else 1.0
    z_score = float(vendor_beh.get('z_score', 0.0)) if isinstance(vendor_beh, dict) else 0.0
    
    if ratio_to_max >= 5.0 or z_score >= 10.0:
        behavioral_risk = min(98.0, 88.0 + min(10.0, (ratio_to_max - 5.0) * 1.5))
    elif ratio_to_max >= 2.5 or z_score >= 4.0:
        behavioral_risk = min(88.0, 70.0 + (ratio_to_max - 2.5) * 7.0)
    elif ratio_to_max >= 1.3 or z_score >= 2.0:
        behavioral_risk = 45.0 + (ratio_to_max - 1.3) * 20.0
    else:
        behavioral_risk = min(30.0, raw_behavioral_score * 0.3)
        
    # Boost if employee behavior is also unusual
    emp_beh = behavioral_info.get('analysis', {}).get('employee_behavior', {})
    if isinstance(emp_beh, dict):
        if emp_beh.get('is_amount_unusual'):
            behavioral_risk = min(98.0, behavioral_risk + 25.0)
        if emp_beh.get('is_unusual_category'):
            behavioral_risk = min(98.0, behavioral_risk + 15.0)
            
    # 4. Policy Risk (0 - 100)
    policy_risk = 0.0
    if policy_rules:
        raw_policy = sum(rule.get('score_contribution', 10) for rule in policy_rules)
        # Check for critical rules
        rule_ids = [r.get('rule_id') for r in policy_rules]
        if 'POLICY_LIMIT' in rule_ids and 'MISSING_RECEIPT' in rule_ids:
            policy_risk = max(75.0, min(95.0, raw_policy * 1.3))
        elif 'POLICY_LIMIT' in rule_ids:
            policy_risk = max(65.0, min(90.0, raw_policy * 1.2))
        else:
            policy_risk = min(80.0, raw_policy * 1.1)
            
    # 5. Relationship Risk (0 - 100)
    relationship_risk = 0.0
    rel_flags = relationship_info.get('relationship_flags', [])
    for f in rel_flags:
        f_type = f.get('type')
        if f_type == 'TEMPORAL_CLUSTERING':
            relationship_risk += 50.0
        elif f_type == 'EMPLOYEE_VENDOR_CONCENTRATION':
            relationship_risk += 40.0
        elif f_type == 'VENDOR_CONCENTRATION':
            relationship_risk += 25.0
        else:
            relationship_risk += 20.0
    relationship_risk = min(95.0, relationship_risk)
    
    # 6. Statistical Anomaly Model Risk (0 - 100)
    anomaly_model_risk = float(anomaly_info.get('anomaly_score', 0.0))
    # If is_anomaly is false, keep it low
    if not anomaly_info.get('is_anomaly', False) and anomaly_model_risk > 35:
        anomaly_model_risk = 25.0
        
    # --- Composite Score Calculation ---
    max_single_risk = max(
        duplicate_risk, 
        behavioral_risk, 
        policy_risk, 
        relationship_risk, 
        validation_risk
    )
    
    weighted_composite = (
        0.30 * duplicate_risk +
        0.28 * behavioral_risk +
        0.22 * policy_risk +
        0.10 * relationship_risk +
        0.06 * anomaly_model_risk +
        0.04 * validation_risk
    )
    
    # Non-linear combination:
    # If any single dimension is high risk (>= 75), the transaction must reflect high risk
    if max_single_risk >= 75.0:
        # Cross-signal bonus if another signal is also active
        active_signals = sum(1 for s in [duplicate_risk, behavioral_risk, policy_risk, relationship_risk] if s >= 40.0)
        bonus = (active_signals - 1) * 4.0 if active_signals > 1 else 0.0
        risk_score = min(99.0, max_single_risk * 0.70 + weighted_composite * 0.30 + bonus)
    elif max_single_risk >= 45.0:
        risk_score = min(74.0, max_single_risk * 0.60 + weighted_composite * 0.40)
    else:
        risk_score = min(38.0, weighted_composite)
        
    risk_score = round(max(1.0, min(99.0, risk_score)), 1)
    
    # --- Confidence Calculation ---
    # High confidence (80-99%) means plenty of evidence/history to trust the verdict.
    # Low confidence (< 75%) means sparse history or ambiguous signals -> requires human review.
    confidence = 94.0
    
    # Deduct if vendor history is sparse (can't be confident in behavioral baseline)
    if vendor_history_count < 3:
        confidence -= 32.0  # Very low confidence on new vendors
    elif vendor_history_count < 8:
        confidence -= 16.0
    elif vendor_history_count >= 25:
        confidence += 5.0
        
    # Deduct if employee history is sparse
    if employee_history_count < 2:
        confidence -= 15.0
    elif employee_history_count < 5:
        confidence -= 8.0
        
    # Deduct if near duplicate similarity is in the ambiguous band (0.80 - 0.88)
    if duplicate_info.get('is_duplicate') and duplicate_info.get('match_type') == 'NEAR':
        sim = float(duplicate_info.get('similarity_score', 0.85))
        if 0.80 <= sim < 0.90:
            confidence -= 18.0
            
    # Deduct if only 1 isolated weak rule triggered
    triggered_count = len(policy_rules) + (1 if duplicate_info.get('is_duplicate') else 0) + len(rel_flags)
    if triggered_count == 1 and risk_score > 35.0:
        rule_name = policy_rules[0].get('rule_id') if policy_rules else ''
        if rule_name in ['WEEKEND_SUBMISSION', 'ROUND_NUMBER', 'NEW_VENDOR']:
            confidence -= 22.0  # Weak isolated evidence -> low confidence
            
    confidence = round(max(30.0, min(99.0, confidence)), 1)
    
    # --- Final Decision Logic ---
    # 🟢 AUTO_PASS: Low risk (< 40) AND sufficient confidence (>= 60%)
    # 🔴 HIGH_RISK: High risk (>= 75) AND high confidence (>= 75%)
    # 🟡 HUMAN_REVIEW:
    #    1. Moderate risk (40 - 74)
    #    2. High risk with weak confidence (< 75%) - "Don't automate when evidence is weak"
    #    3. Low risk but weak confidence (< 60%) - System doesn't guess
    if risk_score < 40.0 and confidence >= 60.0:
        decision = "AUTO_PASS"
    elif risk_score >= 75.0 and confidence >= 75.0:
        decision = "HIGH_RISK"
    else:
        decision = "HUMAN_REVIEW"
        
    return {
        "risk_score": risk_score,
        "confidence": confidence,
        "decision": decision,
        "component_scores": {
            "validation": round(validation_risk, 1),
            "duplicate": round(duplicate_risk, 1),
            "behavioral": round(behavioral_risk, 1),
            "policy": round(policy_risk, 1),
            "relationship": round(relationship_risk, 1),
            "anomaly_model": round(anomaly_model_risk, 1)
        }
    }
