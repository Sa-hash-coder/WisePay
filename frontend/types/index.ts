export interface Transaction {
  id: string;
  invoice_id: string;
  employee_id: string;
  employee_name: string;
  employee_dept: string;
  vendor_id: string;
  vendor_name: string;
  invoice_date: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  invoice_number?: string;
  approval_status: string;
  receipt_status: string;
  payment_status: string;
  risk_score: number;
  confidence: number;
  decision: 'AUTO_PASS' | 'HUMAN_REVIEW' | 'HIGH_RISK';
  rules_triggered: string;
  anomaly_details: string;
  human_decision?: string | null;
  created_at?: string;
  processed_at?: string;
}

export interface DashboardStats {
  total: number;
  auto_pass: number;
  human_review: number;
  high_risk: number;
  human_attention_saved_pct: number;
  total_amount: number;
  flagged_amount: number;
}

export interface InvestigationData {
  transaction: Transaction;
  behavioral_analysis: {
    vendor_behavior?: {
      historical_min?: number;
      historical_max?: number;
      historical_mean?: number;
      historical_std?: number;
      current_amount?: number;
      z_score?: number;
      ratio_to_max?: number;
      sample_count?: number;
      status?: string;
    };
    employee_behavior?: {
      typical_mean?: number;
      typical_std?: number;
      typical_categories?: string[];
      is_unusual_category?: boolean;
      is_amount_unusual?: boolean;
      z_score?: number;
      status?: string;
    };
    behavioral_anomaly_score?: number;
  };
  duplicate_evidence: {
    is_duplicate: boolean;
    similarity_score: number;
    matched_invoice_id: string;
    matched_invoice_number?: string;
    matched_vendor?: string;
    matched_amount?: number;
    match_type: 'EXACT' | 'NEAR';
  } | null;
  policy_violations: Array<{
    rule_id: string;
    rule_name: string;
    description: string;
    score_contribution: number;
  }>;
  anomaly_details?: {
    anomaly_score?: number;
    is_anomaly?: boolean;
  };
  relationship_flags: Array<{
    type: string;
    description: string;
  }> | string[];
  evidence_graph: {
    nodes: Array<{
      id: string;
      label: string;
      type: 'transaction' | 'vendor' | 'employee' | 'duplicate' | 'rule' | 'decision' | 'risk';
      value?: number;
      risk?: number;
      contribution?: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      label: string;
    }>;
  };
  counterfactual_steps: Array<{
    action: string;
    risk_reduction: number;
    new_risk_score: number;
    new_decision: string;
    impact_area?: string;
  }>;
  audit_timeline: Array<{
    type: string;
    timestamp: string;
    hash?: string;
    prev_hash?: string;
    block_index?: number;
    description?: string;
    data?: any;
  }>;
  recommendation: string;
}

export interface AuditVerification {
  verified: boolean;
  events: Array<{
    id: number;
    type: string;
    timestamp: string;
    hash: string;
    prev_hash?: string;
    block_index?: number;
  }>;
  mismatch_at: number | null;
}

export * from './auth';

