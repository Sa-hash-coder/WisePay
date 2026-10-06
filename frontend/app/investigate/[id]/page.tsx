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
import { Card } from '@/components/shared/Card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { InvestigationData, Transaction } from '@/types';
import { AppShell } from '@/components/layout/AppShell';

const TABS = [
  'Overview', 
  'Evidence Chain', 
  'Behavioral Fingerprint', 
  'Duplicate Analysis', 
  'Counterfactual Remediation', 
  'Audit & Governance'
];

export default function InvestigatePage() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState<InvestigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestigation = () => {
    if (!id) return;
    setLoading(true);
    api.investigation.get(id)
      .then(res => {
        if (res.error) {
          setError(res.error);
        } else {
          setData(res);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch investigation package');
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
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <div className="text-slate-500 font-mono text-sm">
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
          <div className="text-rose-600 text-lg font-semibold">{error || 'Transaction not found'}</div>
          <Link href="/queue" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
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
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto px-8 py-7 min-h-[calc(100vh-8rem)]">
        {/* Top Breadcrumb & Action */}
        <div className="flex items-center justify-between">
          <Link 
            href="/queue" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Exception Queue
          </Link>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Forensic ID: {tx.id}
          </span>
        </div>

        {/* Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2 font-mono">
                {tx.invoice_id}
              </h1>
              <DecisionBadge decision={tx.decision} />
              {tx.human_decision && (
                <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                  Manual Override: {tx.human_decision}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-2">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Vendor</div>
                <div className="font-bold text-[#0F172A] text-sm mt-0.5 truncate">{tx.vendor_name}</div>
                <div className="text-[11px] text-slate-500">{tx.category}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Amount</div>
                <div className="font-bold text-[#0F172A] text-sm mt-0.5 font-mono">{formatCurrency(tx.amount)}</div>
                <div className="text-[11px] text-slate-500">{tx.currency} · PO #{tx.invoice_number || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Submitted By</div>
                <div className="font-semibold text-slate-800 text-sm mt-0.5 truncate">{tx.employee_name}</div>
                <div className="text-[11px] text-slate-500">{tx.employee_dept} Department</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Invoice Date</div>
                <div className="font-semibold text-slate-800 text-sm mt-0.5">{tx.invoice_date ? formatDate(tx.invoice_date) : '-'}</div>
                <div className="text-[11px] text-emerald-600 font-medium">Status: {tx.approval_status}</div>
              </div>
            </div>
          </div>

          {/* Meters */}
          <div className="flex items-center gap-6 bg-slate-100/80 p-4 rounded-2xl border border-slate-200 self-start lg:self-auto">
            <ConfidenceMeter confidence={tx.confidence} />
            <div className="w-px h-16 bg-slate-300" />
            <RiskGauge score={tx.risk_score} />
          </div>
        </div>

        {/* Tabs Bar with Greyish Pill Track */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 border border-slate-300/80 rounded-2xl overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex-shrink-0 cursor-pointer ${
                activeTab === tab 
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* 1. OVERVIEW */}
              {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Recommendation Card */}
                    <Card className={`p-5 rounded-2xl border shadow-xs ${
                      tx.decision === 'HIGH_RISK'
                        ? 'border-rose-200 bg-rose-50/50'
                        : tx.decision === 'HUMAN_REVIEW'
                        ? 'border-amber-200 bg-amber-50/50'
                        : 'border-emerald-200 bg-emerald-50/50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                        {tx.decision === 'HIGH_RISK' ? (
                          <>
                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                            <span className="text-rose-900 uppercase tracking-wide">AI Verdict: High-Risk Exception Hold</span>
                          </>
                        ) : tx.decision === 'HUMAN_REVIEW' ? (
                          <>
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <span className="text-amber-900 uppercase tracking-wide">AI Verdict: Human Review Recommended</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <span className="text-emerald-900 uppercase tracking-wide">AI Verdict: High Confidence Auto-Pass</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {data.recommendation}
                      </p>
                    </Card>

                    {/* Triggered Policy Rules */}
                    <Card className="p-6 flex flex-col gap-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                          Triggered Compliance Rules ({policyRules.length})
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Deterministic Policy Logic
                        </span>
                      </div>

                      {policyRules.length === 0 ? (
                        <div className="text-xs text-slate-400 py-3 italic">
                          No policy limit violations detected for this invoice.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {policyRules.map((rule, idx) => (
                            <div 
                              key={idx} 
                              className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-start justify-between gap-4 border-l-4 border-l-amber-500 shadow-2xs"
                            >
                              <div>
                                <div className="font-bold text-xs text-amber-900 flex items-center gap-2">
                                  <span>{rule.rule_name || rule.rule_id}</span>
                                  <span className="font-mono text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                    {rule.rule_id}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{rule.description}</p>
                              </div>
                              <span className="font-mono text-xs text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-1 rounded-md flex-shrink-0">
                                +{rule.score_contribution} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Anomaly & Relationship Snippets */}
                    {data.relationship_flags && data.relationship_flags.length > 0 && (
                      <Card className="p-5 bg-purple-50/70 border border-purple-200 rounded-2xl shadow-xs">
                        <div className="text-xs font-bold uppercase text-purple-900 mb-2">
                          Relationship Pattern Flagged
                        </div>
                        <div className="space-y-1.5">
                          {data.relationship_flags.map((rf: any, i: number) => (
                            <div key={i} className="text-xs text-slate-700 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                              <span>{typeof rf === 'string' ? rf : rf.description}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Evidence Chain on Right */}
                  <div className="lg:col-span-2">
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

              {/* 2. EVIDENCE CHAIN */}
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6 flex flex-col gap-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
                        Sequential Execution Trace
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
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
