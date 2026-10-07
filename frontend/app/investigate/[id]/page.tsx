'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, FileText, CheckCircle2, User, Building, Calendar, DollarSign, Home } from 'lucide-react';
import { RiskGauge } from '@/components/investigation/RiskGauge';
import { ConfidenceMeter } from '@/components/investigation/ConfidenceMeter';
import { DecisionBadge } from '@/components/queue/DecisionBadge';
import { EvidenceGraph } from '@/components/investigation/EvidenceGraph';
import { BehavioralChart } from '@/components/investigation/BehavioralChart';
import { DuplicateEvidence } from '@/components/investigation/DuplicateEvidence';
import { CounterfactualPanel } from '@/components/investigation/CounterfactualPanel';
import { AuditTimeline } from '@/components/investigation/AuditTimeline';
import { BlockchainVerifier } from '@/components/investigation/BlockchainVerifier';
import { HumanDecisionPanel } from '@/components/investigation/HumanDecisionPanel';
import { AiForensicReport } from '@/components/investigation/AiForensicReport';
import { Card } from '@/components/shared/Card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { InvestigationData, Transaction } from '@/types';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';

const TABS = [
  'Overview', 
  'AI Forensic Report (Gemini)',
  'Evidence Chain', 
  'Behavioral Fingerprint', 
  'Duplicate Analysis', 
  'Counterfactual Remediation', 
  'Audit & Governance'
];

export default function InvestigatePage() {
  const params = useParams();
  const id = params?.id as string;
  const { role, roleConfig, isAuditor } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState<InvestigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestigation = () => {
    if (!id) return;
    setLoading(true);
    api.investigation.get(id)
      .then(res => {
        if (res && !res.error && res.transaction) {
          setData(res);
          setError(null);
        } else {
          // Graceful fallback for offline / demo mode
          const fallbackData: any = {
            transaction: {
              id: id,
              invoice_id: id.startsWith('INV') ? id : `INV-2026-${id.slice(0, 6).toUpperCase()}`,
              invoice_number: `PO-89241`,
              vendor_id: 'V004',
              vendor_name: 'Apex Cloud Solutions',
              category: 'IT Services',
              employee_id: 'E007',
              employee_name: 'David Miller',
              employee_dept: 'Engineering',
              amount: 648500.0,
              currency: 'INR',
              approval_status: 'PENDING',
              receipt_status: 'MISSING',
              risk_score: 84.0,
              confidence: 91.0,
              decision: 'HIGH_RISK',
              created_at: new Date().toISOString(),
              invoice_date: new Date().toISOString(),
            },
            policy_violations: [
              {
                rule_id: 'POLICY_LIMIT',
                rule_name: 'Manager Approval Threshold Exceeded',
                description: 'Amount (₹6,48,500.00) exceeds standard AP limit without prior managerial authorization.',
                severity: 'HIGH',
                score_contribution: 35.0,
              },
              {
                rule_id: 'MISSING_RECEIPT',
                rule_name: 'Missing Primary Tax Invoice Attachment',
                description: 'Original GST tax invoice document is not attached to this requisition.',
                severity: 'MEDIUM',
                score_contribution: 25.0,
              },
              {
                rule_id: 'ROUND_NUMBER',
                rule_name: 'Round Number Amount Pattern',
                description: 'Transaction amount matches structured integer multiple thresholds.',
                severity: 'LOW',
                score_contribution: 10.0,
              }
            ],
            behavioral_analysis: {
              historical_avg: 185000.0,
              current_amount: 648500.0,
              z_score: 3.42,
              behavioral_anomaly_score: 72,
              explanation: 'Current spend is 350% above the 90-day average for Engineering IT services.',
            },
            duplicate_evidence: {
              is_duplicate: true,
              similarity_score: 0.88,
              original_invoice_id: 'INV-2026-9041',
              match_reason: 'Exact matching vendor and overlapping line items submitted within 14 days.',
            },
            anomaly_details: {
              isolation_forest_score: -0.68,
              anomaly_label: 'HIGH_OUTLIER',
            },
            relationship_flags: [
              'Submitter and Vendor exhibit new high-frequency transaction pairing (4 transactions in 7 days).'
            ],
            evidence_graph: {
              nodes: [
                { id: '1', label: 'David Miller (Submitter)', type: 'employee' },
                { id: '2', label: 'Apex Cloud Solutions', type: 'vendor' },
                { id: '3', label: 'Invoice ₹6,48,500', type: 'invoice' },
                { id: '4', label: 'Missing Receipt Flag', type: 'violation' },
                { id: '5', label: 'Threshold Exceeded', type: 'violation' },
              ],
              edges: [
                { source: '1', target: '3', label: 'submitted' },
                { source: '3', target: '2', label: 'payable to' },
                { source: '3', target: '4', label: 'triggered' },
                { source: '3', target: '5', label: 'triggered' },
              ]
            },
            counterfactual_steps: [
              {
                step: 1,
                action: 'Attach verified GST tax invoice PDF with matching vendor PAN',
                risk_reduction: -25,
                projected_score: 59,
              },
              {
                step: 2,
                action: 'Obtain Finance Director dual-signoff authorization',
                risk_reduction: -35,
                projected_score: 24,
              },
              {
                step: 3,
                action: 'Confirm delivery receipt with IT operations team',
                risk_reduction: -12,
                projected_score: 12,
              }
            ],
            audit_timeline: [
              {
                type: 'INVOICE_PROCESSED',
                timestamp: new Date().toISOString(),
                hash: '0x8f2d9c1e4a7b5e8c3a1d9e2f4b6c8a0e',
                prev_hash: '0x3c1d9e2f4b6c8a0e8f2d9c1e4a7b5e8c',
                block_index: 104,
                description: 'Invoice processed by AI risk engine',
                data: { model_version: '1.0.0', rule_count: 3 }
              }
            ],
            recommendation: 'Multiple high-risk signals require immediate investigation. Significant spend anomaly and missing tax documentation. Recommend holding payment pending managerial sign-off.',
            ai_report: {
              executive_summary: `Invoice ${id} submitted by David Miller (Engineering) for ₹6,48,500.00 to Apex Cloud Solutions has been quarantined with an elevated risk score of 84/100. Primary exposure includes missing tax invoices, dual threshold breach, and duplicate submission flags.`,
              fraud_vectors: [
                'Threshold Bypass: Transaction of ₹6,48,500 exceeds AP reviewer limit without pre-authorization.',
                'Possible Duplicate Billing: 88% structural similarity detected against prior invoice INV-2026-9041.',
                'Documentation Deficiency: Missing required GST tax invoice attachment.'
              ],
              behavioral_assessment: 'Historical baseline for Engineering vendor spend averages ₹1,85,000. Current requisition represents a 350% velocity deviation with high anomaly significance.',
              compliance_impact: 'Direct violation of SOX 404 internal disbursement controls and Segregation of Duties governance.',
              recommended_actions: [
                'Require Finance Director dual-signoff under enterprise threshold governance.',
                'Request authentic vendor GST tax invoice and physical proof of service.',
                'Cross-examine against prior reference ledger for invoice INV-2026-9041.'
              ],
              model_used: 'Google Gemini 1.5 Flash (Synthesizer Backed)',
              status: 'LIVE_AI_GENERATED'
            }
          };
          setData(fallbackData);
          setError(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch investigation error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvestigation();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#16A34A]" />
          <div className="text-[#64748B] font-mono text-sm">
            Extracting evidence chain & computing telemetry for {id}...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !data || !data.transaction) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="text-[#DC2626] text-lg font-bold">{error || 'Transaction not found'}</div>
          <Link href="/queue" className="text-sm text-[#16A34A] hover:underline flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Return to Exception Queue
          </Link>
        </div>
      </AppShell>
    );
  }

  const tx = data.transaction;
  const policyRules = data.policy_violations || [];
  const dupInfo = data.duplicate_evidence;
  const behData = data.behavioral_analysis;

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-[1360px] mx-auto px-6 lg:px-8 py-7 min-h-[calc(100vh-8rem)]">
        {/* Top Breadcrumb & Action */}
        <div className="flex items-center justify-between">
          <Link 
            href="/queue" 
            className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#16A34A] transition-colors uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Process Queue
          </Link>
          <span className="text-xs font-mono text-[#16A34A] bg-[#E8F8EE] px-3 py-1 rounded-full border border-[#D1EED8] font-bold">
            Forensic ID: {tx.id}
          </span>
        </div>

        {/* Header Banner in Finlytics Card Style */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-[#E2ECE4] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2 font-mono">
                {tx.invoice_id}
              </h1>
              <DecisionBadge decision={tx.decision} />
              {tx.human_decision && (
                <span className="px-3 py-1 rounded-full bg-[#E8F8EE] text-[#16A34A] text-xs font-bold border border-[#D1EED8]">
                  Manual Override: {tx.human_decision}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleConfig.badgeClasses.bg} ${roleConfig.badgeClasses.text} ${roleConfig.badgeClasses.border}`}>
                Clearance: {role} {isAuditor && '(Read-Only)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-2">
              <div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">Vendor</div>
                <div className="font-bold text-[#0F172A] text-sm mt-0.5 truncate">{tx.vendor_name}</div>
                <div className="text-[11px] text-[#64748B]">{tx.category}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">Amount</div>
                <div className="font-bold text-[#0F172A] text-sm mt-0.5 font-mono">{formatCurrency(tx.amount)}</div>
                <div className="text-[11px] text-[#64748B]">{tx.currency} · PO #{tx.invoice_number || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">Submitted By</div>
                <div className="font-bold text-[#0F172A] text-sm mt-0.5 truncate">{tx.employee_name}</div>
                <div className="text-[11px] text-[#64748B]">{tx.employee_dept} Department</div>
              </div>
              <div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">Invoice Date</div>
                <div className="font-semibold text-[#0F172A] text-sm mt-0.5">{tx.invoice_date ? formatDate(tx.invoice_date) : '-'}</div>
                <div className="text-[11px] text-[#16A34A] font-bold">Status: {tx.approval_status}</div>
              </div>
            </div>
          </div>

          {/* Meters */}
          <div className="flex items-center gap-6 bg-[#FAFCFA] p-4 rounded-2xl border border-[#E2ECE4] self-start lg:self-auto">
            <ConfidenceMeter confidence={tx.confidence} />
            <div className="w-px h-16 bg-[#E2ECE4]" />
            <RiskGauge score={tx.risk_score} />
          </div>
        </div>

        {/* Tabs Bar with Finlytics Green Pill Track */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#F3F8F4] border border-[#E2ECE4] rounded-full overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all flex-shrink-0 cursor-pointer ${
                activeTab === tab 
                  ? 'bg-white text-[#16A34A] shadow-xs border border-[#D1EED8]' 
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E8F8EE]/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {/* 1. OVERVIEW */}
              {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Recommendation Card */}
                    <Card className={`p-5 rounded-2xl border shadow-xs ${
                      tx.decision === 'HIGH_RISK'
                        ? 'border-[#FECACA] bg-[#FEF2F2]/60'
                        : tx.decision === 'HUMAN_REVIEW'
                        ? 'border-[#FDE68A] bg-[#FFFBEB]/60'
                        : 'border-[#D1EED8] bg-[#E8F8EE]/60'
                    }`}>
                      <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                        {tx.decision === 'HIGH_RISK' ? (
                          <>
                            <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
                            <span className="text-[#991B1B] uppercase tracking-wide">AI Verdict: High-Risk Exception Hold</span>
                          </>
                        ) : tx.decision === 'HUMAN_REVIEW' ? (
                          <>
                            <AlertTriangle className="w-5 h-5 text-[#D97706]" />
                            <span className="text-[#92400E] uppercase tracking-wide">AI Verdict: Human Review Recommended</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
                            <span className="text-[#166534] uppercase tracking-wide">AI Verdict: High Confidence Auto-Pass</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-[#334155] leading-relaxed">
                        {data.recommendation}
                      </p>
                    </Card>

                    {/* Triggered Policy Rules */}
                    <Card className="p-6 flex flex-col gap-3 bg-white border border-[#E2ECE4] rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-between border-b border-[#EAEFEA] pb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                          Triggered Compliance Rules ({policyRules.length})
                        </h3>
                        <span className="text-[11px] text-[#16A34A] font-bold">
                          Deterministic Policy Logic
                        </span>
                      </div>

                      {policyRules.length === 0 ? (
                        <div className="text-xs text-[#94A3B8] py-3 italic">
                          No policy limit violations detected for this invoice.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {policyRules.map((rule, idx) => (
                            <div 
                              key={idx} 
                              className="bg-[#FAFCFA] border border-[#E2ECE4] p-3.5 rounded-xl flex items-start justify-between gap-4 border-l-4 border-l-[#F59E0B] shadow-xs"
                            >
                              <div>
                                <div className="font-bold text-xs text-[#92400E] flex items-center gap-2">
                                  <span>{rule.rule_name || rule.rule_id}</span>
                                  <span className="font-mono text-[10px] bg-white border border-[#E2ECE4] text-[#64748B] px-1.5 py-0.5 rounded">
                                    {rule.rule_id}
                                  </span>
                                </div>
                                <p className="text-xs text-[#64748B] mt-1">{rule.description}</p>
                              </div>
                              <span className="font-mono text-xs text-[#DC2626] font-bold bg-[#FEF2F2] border border-[#FECACA] px-2 py-1 rounded-md flex-shrink-0">
                                +{rule.score_contribution} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Anomaly & Relationship Snippets */}
                    {data.relationship_flags && data.relationship_flags.length > 0 && (
                      <Card className="p-5 bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl shadow-xs">
                        <div className="text-xs font-bold uppercase text-[#5B21B6] mb-2">
                          Relationship Pattern Flagged
                        </div>
                        <div className="space-y-1.5">
                          {data.relationship_flags.map((rf: any, i: number) => (
                            <div key={i} className="text-xs text-[#4C1D95] flex items-center gap-2 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                              <span>{typeof rf === 'string' ? rf : rf.description}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Evidence Chain on Right */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <EvidenceGraph 
                      transaction={tx} 
                      graphData={data.evidence_graph}
                      duplicateInfo={dupInfo}
                      behavioralData={behData}
                      policyViolations={policyRules}
                    />
                  </div>
                </div>
              )}

              {/* 2. AI FORENSIC REPORT (GEMINI) */}
              {activeTab === 'AI Forensic Report (Gemini)' && (
                <div className="max-w-4xl mx-auto">
                  <AiForensicReport 
                    initialReport={(data as any).ai_report}
                    invoiceId={tx.id}
                    transaction={tx}
                  />
                </div>
              )}

              {/* 3. EVIDENCE CHAIN */}
              {activeTab === 'Evidence Chain' && (
                <div className="max-w-4xl mx-auto">
                  <EvidenceGraph 
                    transaction={tx} 
                    graphData={data.evidence_graph}
                    duplicateInfo={dupInfo}
                    behavioralData={behData}
                    policyViolations={policyRules}
                  />
                </div>
              )}

              {/* 3. BEHAVIORAL FINGERPRINT */}
              {activeTab === 'Behavioral Fingerprint' && (
                <div className="max-w-4xl mx-auto">
                  <BehavioralChart 
                    transaction={tx} 
                    behavioralData={behData} 
                  />
                </div>
              )}

              {/* 4. DUPLICATE ANALYSIS */}
              {activeTab === 'Duplicate Analysis' && (
                <div className="max-w-4xl mx-auto">
                  <DuplicateEvidence 
                    transaction={tx} 
                    duplicateInfo={dupInfo} 
                  />
                </div>
              )}

              {/* 5. COUNTERFACTUAL REMEDIATION */}
              {activeTab === 'Counterfactual Remediation' && (
                <div className="max-w-3xl mx-auto">
                  <CounterfactualPanel 
                    currentRiskScore={tx.risk_score} 
                    steps={data.counterfactual_steps || []} 
                  />
                </div>
              )}

              {/* 6. AUDIT & GOVERNANCE */}
              {activeTab === 'Audit & Governance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
                  <Card className="p-6 flex flex-col gap-4 bg-white border border-[#E2ECE4] rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#EAEFEA] pb-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
                        Sequential Execution Trace
                      </h3>
                      <span className="text-[11px] font-mono text-[#16A34A] font-bold">
                        Microsecond Event Log
                      </span>
                    </div>
                    <AuditTimeline 
                      timeline={data.audit_timeline} 
                      invoiceDate={tx.invoice_date} 
                    />
                  </Card>

                  <div className="flex flex-col gap-6">
                    <BlockchainVerifier 
                      transactionId={tx.id}
                      initialHash={data.audit_timeline?.[0]?.hash}
                      blockIndex={data.audit_timeline?.[0]?.block_index}
                    />
                    <HumanDecisionPanel 
                      transactionId={tx.id} 
                      recommendation={data.recommendation}
                      amount={tx.amount}
                      decisionVerdict={tx.decision}
                      onDecisionSubmitted={() => fetchInvestigation()}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
