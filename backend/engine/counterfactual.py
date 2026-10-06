def generate_counterfactuals(transaction, policy_rules, duplicate_info, behavioral_info, risk_score, decision):
    """
    Counterfactual Risk Reduction Engine.
    Computes actionable steps that a finance team or submitter could take
    to reduce the risk score and potentially convert a flagged transaction to AUTO_PASS.
    """
    counterfactuals = []
    current_score = float(risk_score)
    
    # If transaction is already auto-pass, no critical counterfactuals needed
    if current_score < 40.0:
        return []
        
    running_score = current_score
    
    # 1. Duplicate verification
    if duplicate_info.get('is_duplicate'):
        # Verifying whether it's a distinct order vs accidental double billing
        reduction = 45.0 if duplicate_info.get('match_type') == 'EXACT' else 35.0
        new_score = max(5.0, round(running_score - reduction, 1))
        new_dec = "AUTO_PASS" if new_score < 40.0 else ("HIGH_RISK" if new_score >= 75.0 else "HUMAN_REVIEW")
        counterfactuals.append({
            "action": "Confirm distinct PO & separate delivery proof (resolve duplicate flag)",
            "risk_reduction": reduction,
            "new_risk_score": new_score,
            "new_decision": new_dec,
            "impact_area": "Duplicate & Identity"
        })
        running_score = new_score
        
    # 2. Policy Violations
    rule_ids = [r.get('rule_id') for r in policy_rules]
    
    if 'POLICY_LIMIT' in rule_ids or 'MISSING_APPROVAL' in rule_ids:
        reduction = 26.0
        new_score = max(5.0, round(running_score - reduction, 1))
        new_dec = "AUTO_PASS" if new_score < 40.0 else ("HIGH_RISK" if new_score >= 75.0 else "HUMAN_REVIEW")
        counterfactuals.append({
            "action": "Obtain VP / Department Head approval for limit override",
            "risk_reduction": reduction,
            "new_risk_score": new_score,
            "new_decision": new_dec,
            "impact_area": "Policy Compliance"
        })
        running_score = new_score
        
    if 'MISSING_RECEIPT' in rule_ids:
        reduction = 18.0
        new_score = max(5.0, round(running_score - reduction, 1))
        new_dec = "AUTO_PASS" if new_score < 40.0 else ("HIGH_RISK" if new_score >= 75.0 else "HUMAN_REVIEW")
        counterfactuals.append({
            "action": "Upload itemized GST tax invoice / payment receipt",
            "risk_reduction": reduction,
            "new_risk_score": new_score,
            "new_decision": new_dec,
            "impact_area": "Documentation"
        })
        running_score = new_score
        
    # 3. Behavioral Anomaly
    vendor_beh = behavioral_info.get('analysis', {}).get('vendor_behavior', {})
    ratio_to_max = float(vendor_beh.get('ratio_to_max', 1.0)) if isinstance(vendor_beh, dict) else 1.0
    
    if ratio_to_max >= 2.0 or behavioral_info.get('behavioral_anomaly_score', 0) > 40:
        reduction = 24.0
        new_score = max(5.0, round(running_score - reduction, 1))
        new_dec = "AUTO_PASS" if new_score < 40.0 else ("HIGH_RISK" if new_score >= 75.0 else "HUMAN_REVIEW")
        counterfactuals.append({
            "action": "Attach Statement of Work (SOW) justifying elevated spend above historical range",
            "risk_reduction": reduction,
            "new_risk_score": new_score,
            "new_decision": new_dec,
            "impact_area": "Behavioral Context"
        })
        running_score = new_score
        
    if 'NEW_VENDOR' in rule_ids:
        reduction = 16.0
        new_score = max(5.0, round(running_score - reduction, 1))
        new_dec = "AUTO_PASS" if new_score < 40.0 else ("HIGH_RISK" if new_score >= 75.0 else "HUMAN_REVIEW")
        counterfactuals.append({
            "action": "Complete vendor onboarding verification & bank account verification",
            "risk_reduction": reduction,
            "new_risk_score": new_score,
            "new_decision": new_dec,
            "impact_area": "Vendor Due Diligence"
        })
        running_score = new_score

    # Fallback if no specific rule matched but score is high
    if not counterfactuals and current_score >= 40.0:
        new_score = max(5.0, round(current_score - 25.0, 1))
        counterfactuals.append({
            "action": "Perform secondary finance controller review & manual sign-off",
            "risk_reduction": 25.0,
            "new_risk_score": new_score,
            "new_decision": "AUTO_PASS" if new_score < 40.0 else "HUMAN_REVIEW",
            "impact_area": "Manual Verification"
        })
        
    return counterfactuals
