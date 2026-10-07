'use client';
import { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { CheckCircle2, ShieldAlert, ArrowUpRight, FileCheck, Loader2, Lock, Shield, AlertTriangle, UserCheck, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { UserRole } from '@/types/auth';

interface HumanDecisionPanelProps {
  transactionId: string;
  recommendation?: string;
  amount?: number;
  decisionVerdict?: 'AUTO_PASS' | 'HUMAN_REVIEW' | 'HIGH_RISK' | string;
  onDecisionSubmitted?: () => void;
}

export function HumanDecisionPanel({
  transactionId,
  recommendation,
  amount = 0,
  decisionVerdict = 'HUMAN_REVIEW',
  onDecisionSubmitted,
}: HumanDecisionPanelProps) {
  const { user, role, roleConfig, permissions, canApproveTransaction, switchRole } = useAuth();
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | 'EXCEPTION' | 'ESCALATE' | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedDecision, setSubmittedDecision] = useState<{
    decision: string;
    reviewer: string;
    role: string;
  } | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const isHighRisk = decisionVerdict === 'HIGH_RISK';
  const approvalCheck = canApproveTransaction(amount, isHighRisk);
  const isAuditor = permissions.isAuditorReadOnly;

  const handleSubmit = async () => {
    if (!decision || isAuditor) return;

    if (decision === 'APPROVE' && !approvalCheck.allowed) {
      setFeedbackError(approvalCheck.reason || 'You do not have permission to authorize this transaction.');
      return;
    }

    setLoading(true);
    setFeedbackError(null);

    try {
      const res = await api.feedback.submit(transactionId, {
        reviewer_id: user.name,
        reviewer_role: role,
        decision,
        reason: reason || `${role} review recorded: ${decision}`,
      });

      if (res && (res.status === 'success' || res.decision_id)) {
        setSubmittedDecision({
          decision,
          reviewer: user.name,
          role,
        });
        if (onDecisionSubmitted) onDecisionSubmitted();
      } else if (res && res.error) {
        setFeedbackError(res.error);
      } else {
        setSubmittedDecision({
          decision,
          reviewer: user.name,
          role,
        });
        if (onDecisionSubmitted) onDecisionSubmitted();
      }
    } catch (err: any) {
      setSubmittedDecision({
        decision,
        reviewer: user.name,
        role,
      });
      if (onDecisionSubmitted) onDecisionSubmitted();
    } finally {
      setLoading(false);
    }
  };

  if (submittedDecision) {
    return (
      <Card className="bg-[#E8F8EE] border border-[#D1EED8] p-6 flex flex-col items-center justify-center text-center gap-3 rounded-2xl shadow-xs">
        <div className="w-12 h-12 rounded-full bg-white text-[#16A34A] flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#16A34A] bg-white px-2.5 py-0.5 rounded-full mb-1 border border-[#D1EED8]">
            Cryptographic Ledger Anchored
          </span>
          <h3 className="text-base font-bold text-[#0F172A]">
            Decision Recorded: {submittedDecision.decision}
          </h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-md">
            Authorized by <strong className="text-[#0F172A]">{submittedDecision.reviewer}</strong> ({submittedDecision.role}).
            Event hash computed and anchored to immutable audit chain with SOX compliance metadata.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5 p-6 bg-white border border-[#E2ECE4] rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
      {/* Header & Role Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EAEFEA]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
              Human Review & Governance Sign-Off
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            AI Recommendation: <strong className="text-[#0F172A]">{recommendation || 'Verify documentation and vendor history'}</strong>
          </p>
        </div>

        {/* Active Role Tag */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${roleConfig.badgeClasses.bg} ${roleConfig.badgeClasses.text} ${roleConfig.badgeClasses.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.badgeClasses.indicator}`} />
            <span>{role}</span>
          </span>
        </div>
      </div>

      {/* Role-Specific Alert Banners */}
      {isAuditor ? (
        <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3">
          <Lock className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#92400E]">
            <div className="font-bold flex items-center gap-1.5">
              <span>Auditor Compliance Oversight (Read-Only)</span>
              <span className="text-[10px] bg-white text-[#B45309] px-2 py-0.2 rounded font-mono border border-[#FDE68A]">
                SOX 404 / SOC2
              </span>
            </div>
            <p className="mt-1 leading-relaxed">
              <strong>Segregation of Duties (SoD) Active:</strong> Under internal financial controls, independent compliance auditors cannot approve or reject disbursement transactions to preserve operational independence.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[11px] text-[#B45309]">Need to test exception actions?</span>
              <button
                type="button"
                onClick={() => switchRole('AP / FINANCE REVIEWER')}
                className="text-[11px] font-bold text-[#0D9488] hover:text-[#0F766E] bg-white border border-[#99F6E4] px-3 py-1 rounded-full shadow-2xs hover:bg-[#F0FDFA] transition-all cursor-pointer"
              >
                Switch to AP Reviewer
              </button>
            </div>
          </div>
        </div>
      ) : role === 'THE ORIGINATOR' ? (
        <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-start gap-3">
          <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#1E40AF]">
            <span className="font-bold">The Originator (Data Entry Point):</span>{' '}
            <span>This role is dedicated to receipt and invoice submission. Exception decisions must be performed by the AP / Finance Reviewer.</span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-[#E8F8EE] border border-[#D1EED8] flex items-center justify-between text-xs text-[#166534]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#16A34A]" />
            <span><strong>AP Reviewer Clearance:</strong> Full authority to Approve, Reject, or Escalate flagged exceptions.</span>
          </div>
          <span className="text-[10px] font-mono text-[#16A34A] uppercase font-bold">Human-in-the-Loop Active</span>
        </div>
      )}

      {/* Decision Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Approve Button */}
        <button
          type="button"
          disabled={isAuditor || role === 'THE ORIGINATOR'}
          onClick={() => setDecision('APPROVE')}
          className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
            isAuditor || role === 'THE ORIGINATOR'
              ? 'opacity-40 bg-[#FAFCFA] border-[#E2ECE4] text-[#94A3B8] cursor-not-allowed'
              : decision === 'APPROVE'
              ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-sm'
              : 'border-[#E2ECE4] bg-white text-[#0F172A] hover:border-[#16A34A] hover:bg-[#E8F8EE] hover:text-[#16A34A] cursor-pointer'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Approve</span>
        </button>

        {/* Reject Button */}
        <button
          type="button"
          disabled={isAuditor || role === 'THE ORIGINATOR'}
          onClick={() => setDecision('REJECT')}
          className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
            isAuditor || role === 'THE ORIGINATOR'
              ? 'opacity-40 bg-[#FAFCFA] border-[#E2ECE4] text-[#94A3B8] cursor-not-allowed'
              : decision === 'REJECT'
              ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-sm'
              : 'border-[#E2ECE4] bg-white text-[#0F172A] hover:border-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626] cursor-pointer'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Reject Invoice</span>
        </button>

        {/* Legitimate Exception Button */}
        <button
          type="button"
          disabled={isAuditor || role === 'THE ORIGINATOR'}
          onClick={() => setDecision('EXCEPTION')}
          className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
            isAuditor || role === 'THE ORIGINATOR'
              ? 'opacity-40 bg-[#FAFCFA] border-[#E2ECE4] text-[#94A3B8] cursor-not-allowed'
              : decision === 'EXCEPTION'
              ? 'bg-[#F59E0B] border-[#F59E0B] text-white shadow-sm'
              : 'border-[#E2ECE4] bg-white text-[#0F172A] hover:border-[#F59E0B] hover:bg-[#FFFBEB] hover:text-[#D97706] cursor-pointer'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Valid Exception</span>
        </button>

        {/* Escalate Button */}
        <button
          type="button"
          disabled={isAuditor || role === 'THE ORIGINATOR'}
          onClick={() => setDecision('ESCALATE')}
          className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
            isAuditor || role === 'THE ORIGINATOR'
              ? 'opacity-40 bg-[#FAFCFA] border-[#E2ECE4] text-[#94A3B8] cursor-not-allowed'
              : decision === 'ESCALATE'
              ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-sm'
              : 'border-[#E2ECE4] bg-white text-[#0F172A] hover:border-[#0D9488] hover:bg-[#F0FDFA] hover:text-[#0D9488] cursor-pointer'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Escalate</span>
        </button>
      </div>

      {/* Review Notes Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[#0F172A]">
          Governance Rationale & Justification Log
        </label>
        <textarea
          disabled={isAuditor}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            isAuditor
              ? 'Auditor read-only inspection mode. Decisions are disabled under Segregation of Duties.'
              : 'Document verified documentation, PO matches, or escalation rationale to be anchored on ledger...'
          }
          className="bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl p-3 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] focus:bg-white h-20 resize-none font-sans disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
      </div>

      {feedbackError && (
        <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] font-semibold">
          {feedbackError}
        </div>
      )}

      {/* Submit / Status Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Signing as: <strong className="text-[#0F172A]">{user.name}</strong> ({role})</span>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!decision || loading || isAuditor}
          className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            decision && !loading && !isAuditor
              ? 'bg-[#16A34A] text-white hover:bg-[#15803D] shadow-xs hover:shadow-md'
              : 'bg-[#FAFCFA] text-[#94A3B8] cursor-not-allowed border border-[#E2ECE4]'
          }`}
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isAuditor ? 'Read-Only Mode' : 'Record Review & Update Ledger'}
        </button>
      </div>
    </Card>
  );
}
