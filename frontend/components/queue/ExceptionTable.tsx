'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RiskBadge } from './RiskBadge';
import { DecisionBadge } from './DecisionBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  ArrowRight, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck,
  Lock,
  FileCheck2,
  Layers,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Check,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function ExceptionTable() {
  return (
    <Suspense fallback={
      <div className="bg-white border border-[#E2ECE4] rounded-2xl p-12 text-center text-[#94A3B8] text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#16A34A] mb-2" />
        Loading Exception Pile...
      </div>
    }>
      <ExceptionPileContent />
    </Suspense>
  );
}

function ExceptionPileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get('category') || searchParams.get('filter');

  const { role, roleConfig, isAuditor, isOriginator, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [flagFilter, setFlagFilter] = useState<string>(
    queryCategory && ['ALL', 'HIGH_RISK', 'DUPLICATES', 'POLICY', 'MISSING_RECEIPT'].includes(queryCategory.toUpperCase())
      ? queryCategory.toUpperCase()
      : 'ALL'
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Action modal state
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'ESCALATE' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Sync state when URL param changes
  useEffect(() => {
    if (queryCategory) {
      const normalized = queryCategory.toUpperCase();
      if (['ALL', 'HIGH_RISK', 'DUPLICATES', 'POLICY', 'MISSING_RECEIPT'].includes(normalized)) {
        setFlagFilter(normalized);
      }
    }
  }, [queryCategory]);

  const handleFilterChange = (newFilter: string) => {
    setFlagFilter(newFilter);
    setPage(1);
    if (newFilter === 'ALL') {
      router.push('/queue');
    } else {
      router.push(`/queue?category=${newFilter}`);
    }
  };

  const fetchExceptions = () => {
    setLoading(true);
    api.transactions.exceptions({
      flag_type: flagFilter,
      search: search.trim() || undefined,
      page,
      size: 50,
    })
      .then((res: any) => {
        setData(res.items || []);
        setTotal(res.total || 0);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error('Failed to fetch Exception Pile', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExceptions();
  }, [flagFilter, page]);

  const openActionModal = (tx: any, action: 'APPROVE' | 'REJECT' | 'ESCALATE') => {
    setSelectedTx(tx);
    setActionType(action);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    if (action === 'APPROVE') {
      setActionReason(`Approved by ${user.name} (${role}): Verified legitimate invoice citation.`);
    } else if (action === 'REJECT') {
      setActionReason(`Rejected by ${user.name} (${role}): Policy violation confirmed by human reviewer.`);
    } else {
      setActionReason(`Escalated by ${user.name} (${role}): Requires senior executive compliance review.`);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedTx || !actionType) return;
    setIsSubmittingAction(true);
    setActionErrorMsg(null);

    try {
      const res = await api.investigation.submitDecision(selectedTx.invoice_id || selectedTx.id, {
        decision: actionType,
        reason: actionReason,
        reviewer_id: user.email || user.name,
        reviewer_role: role,
      });

      if (res && res.error) {
        setActionErrorMsg(res.error);
      } else {
        setActionSuccessMsg(`Decision '${actionType}' recorded and ledger-stamped.`);
        
        // Update local state row
        setData((prev) =>
          prev.map((item) =>
            (item.id === selectedTx.id || item.invoice_id === selectedTx.invoice_id)
              ? {
                  ...item,
                  human_decision: actionType,
                  approval_status: actionType === 'APPROVE' ? 'APPROVED' : actionType === 'REJECT' ? 'REJECTED' : 'ESCALATED',
                }
              : item
          )
        );

        setTimeout(() => {
          setSelectedTx(null);
          setActionType(null);
          setActionSuccessMsg(null);
        }, 1000);
      }
    } catch (err: any) {
      setActionErrorMsg(err?.message || 'Failed to submit decision.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2ECE4] rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] p-6 flex flex-col gap-5">
      {/* Top Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Exception Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={() => handleFilterChange('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              flagFilter === 'ALL' 
                ? 'bg-[#0D9488] text-white shadow-xs' 
                : 'bg-[#FAFCFA] border border-[#E2ECE4] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Exceptions ({total})
          </button>

          <button 
            type="button"
            onClick={() => handleFilterChange('HIGH_RISK')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              flagFilter === 'HIGH_RISK' 
                ? 'bg-[#DC2626] text-white shadow-xs' 
                : 'bg-[#FAFCFA] border border-[#E2ECE4] text-[#64748B] hover:text-[#DC2626]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            High-Risk Anomalies
          </button>

          <button 
            type="button"
            onClick={() => handleFilterChange('DUPLICATES')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              flagFilter === 'DUPLICATES' 
                ? 'bg-[#2563EB] text-white shadow-xs' 
                : 'bg-[#FAFCFA] border border-[#E2ECE4] text-[#64748B] hover:text-[#2563EB]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Duplicate Invoices
          </button>

          <button 
            type="button"
            onClick={() => handleFilterChange('POLICY')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              flagFilter === 'POLICY' 
                ? 'bg-[#D97706] text-white shadow-xs' 
                : 'bg-[#FAFCFA] border border-[#E2ECE4] text-[#64748B] hover:text-[#D97706]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Policy Limits & Split PO
          </button>

          <button 
            type="button"
            onClick={() => handleFilterChange('MISSING_RECEIPT')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              flagFilter === 'MISSING_RECEIPT' 
                ? 'bg-[#7C3AED] text-white shadow-xs' 
                : 'bg-[#FAFCFA] border border-[#E2ECE4] text-[#64748B] hover:text-[#7C3AED]'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Missing Receipts
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2.5">
          <form 
            onSubmit={(e) => { e.preventDefault(); fetchExceptions(); }}
            className="relative flex-1 md:w-72"
          >
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search citation, vendor, invoice..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2ECE4] rounded-full text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all"
            />
          </form>
          <button
            type="button"
            onClick={fetchExceptions}
            title="Refresh exception pile"
            className="p-2 bg-white hover:bg-[#E8F8EE] border border-[#E2ECE4] hover:border-[#D1EED8] rounded-full text-[#64748B] hover:text-[#16A34A] transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#16A34A]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Role Clearance Context Banner */}
      <div className="px-4 py-2.5 bg-[#F3F8F4] border border-[#E2ECE4] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#64748B]">
          <UserCheck className="w-4 h-4 text-[#0D9488]" />
          <span>Active Persona: <strong className="text-[#0F172A]">{user.name}</strong> ({role})</span>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-[#64748B]">{roleConfig.department}</span>
        </div>
        <div className="text-[11px] font-semibold">
          {role === 'AP / FINANCE REVIEWER' && (
            <span className="text-[#0F766E] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
              Primary Human-in-the-Loop: Direct Authority to Approve, Reject, or Escalate
            </span>
          )}
          {role === 'AUDITOR' && (
            <span className="text-[#D97706] flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              SOX 404 Segregation of Duties: Read-Only Governance & Verification
            </span>
          )}
          {role === 'THE ORIGINATOR' && (
            <span className="text-[#2563EB] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Data Entry Role: Exceptions View Only (Disbursing Decisions Blocked)
            </span>
          )}
        </div>
      </div>

      {/* The Exception Pile Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#E2ECE4]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2ECE4] bg-[#FAFCFA] text-[#64748B] text-xs uppercase tracking-wider font-bold">
              <th className="py-3.5 px-4">Invoice / Transaction</th>
              <th className="py-3.5 px-4">Entity & Category</th>
              <th className="py-3.5 px-4">Disbursement Amount</th>
              <th className="py-3.5 px-4 w-[36%]">AI Explanation / Citation</th>
              <th className="py-3.5 px-4">Anomaly Score</th>
              <th className="py-3.5 px-4 text-center">Triage Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEFEA] text-xs">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-[#94A3B8]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#0D9488]" />
                    <span className="text-xs">Loading Exception Pile flagged anomalies...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-14 text-[#94A3B8] text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="w-6 h-6 text-[#16A34A]" />
                    <span className="font-bold text-[#0F172A]">Exception Pile is Clean!</span>
                    <span className="text-[11px] text-[#64748B]">
                      All active transactions have been resolved or approved.
                    </span>
                  </div>
                </td>
              </tr>
            ) : data.map((tx) => {
              const isResolved = tx.human_decision && tx.human_decision !== 'PENDING';

              return (
                <tr 
                  key={tx.id || tx.invoice_id} 
                  className={`transition-colors group hover:bg-[#F8FAF8] ${
                    tx.decision === 'HIGH_RISK' ? 'bg-[#FEF2F2]/30' : 'bg-[#FFFBEB]/30'
                  }`}
                >
                  {/* Invoice & Date */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#0D9488] font-mono">{tx.invoice_id}</div>
                    <div className="text-[10px] text-[#94A3B8]">
                      {tx.invoice_number ? `#${tx.invoice_number} • ` : ''}
                      {tx.invoice_date ? formatDate(tx.invoice_date) : 'Today'}
                    </div>
                  </td>

                  {/* Vendor / Employee */}
                  <td className="py-3.5 px-4">
                    <div className="text-[#0F172A] font-bold">{tx.vendor_name || tx.employee_name}</div>
                    <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                      <span>{tx.category}</span>
                      {tx.employee_dept && <span>• {tx.employee_dept}</span>}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-[#0F172A] text-sm">
                      {formatCurrency(tx.amount)}
                    </div>
                    {tx.receipt_status === 'MISSING' && (
                      <span className="text-[9px] font-bold uppercase text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FECACA]">
                        Missing Receipt
                      </span>
                    )}
                  </td>

                  {/* AI Explanation / Citation (Key Hook Requirement) */}
                  <td className="py-3.5 px-4">
                    <div className="p-2.5 bg-white border border-[#E2ECE4] rounded-xl shadow-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D97706] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>AI Citation:</span>
                      </div>
                      <p className="text-[11px] text-[#0F172A] font-medium leading-relaxed">
                        {tx.ai_citation || tx.anomaly_details?.explanation || tx.reason || 'Flagged by ML isolation forest and deterministic rules.'}
                      </p>
                    </div>
                  </td>

                  {/* Anomaly Risk Score */}
                  <td className="py-3.5 px-4">
                    <RiskBadge score={tx.risk_score} />
                    <div className="mt-1">
                      <DecisionBadge decision={tx.decision} />
                    </div>
                  </td>

                  {/* Actions Column: Approve, Reject, Escalate */}
                  <td className="py-3.5 px-4 text-center">
                    {isResolved ? (
                      <div className="inline-flex flex-col items-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          tx.human_decision === 'APPROVE'
                            ? 'bg-[#E8F8EE] text-[#16A34A] border-[#D1EED8]'
                            : tx.human_decision === 'REJECT'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            : 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]'
                        }`}>
                          ✓ {tx.human_decision}D
                        </span>
                        <Link 
                          href={`/investigate/${tx.id || tx.invoice_id}`}
                          className="text-[10px] text-[#0D9488] hover:underline mt-1 font-semibold flex items-center gap-0.5"
                        >
                          Forensic Trail <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    ) : isAuditor ? (
                      <Link href={`/investigate/${tx.id || tx.invoice_id}`}>
                        <button className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] hover:bg-[#FDE68A] transition-colors cursor-pointer inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Inspect Trail
                        </button>
                      </Link>
                    ) : isOriginator ? (
                      <span className="text-[10px] text-[#64748B] italic">Data Entry Only</span>
                    ) : (
                      <div className="flex flex-col gap-1.5 items-center">
                        <div className="flex items-center gap-1">
                          {/* Approve Button */}
                          <button
                            type="button"
                            onClick={() => openActionModal(tx, 'APPROVE')}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#E8F8EE] text-[#16A34A] border border-[#D1EED8] hover:bg-[#16A34A] hover:text-white transition-all cursor-pointer shadow-xs"
                            title="Approve Exception"
                          >
                            Approve
                          </button>

                          {/* Reject Button */}
                          <button
                            type="button"
                            onClick={() => openActionModal(tx, 'REJECT')}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#DC2626] hover:text-white transition-all cursor-pointer shadow-xs"
                            title="Reject Exception"
                          >
                            Reject
                          </button>

                          {/* Escalate Button */}
                          <button
                            type="button"
                            onClick={() => openActionModal(tx, 'ESCALATE')}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] hover:bg-[#7C3AED] hover:text-white transition-all cursor-pointer shadow-xs"
                            title="Escalate Exception"
                          >
                            Escalate
                          </button>
                        </div>

                        <Link 
                          href={`/investigate/${tx.id || tx.invoice_id}`}
                          className="text-[10px] text-[#64748B] hover:text-[#0D9488] transition-colors flex items-center gap-0.5"
                        >
                          Deep Dive Graph <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-[#64748B] px-2 pt-1">
        <div>
          Showing <strong className="text-[#0F172A]">{data.length}</strong> flagged exceptions {total > 0 ? `(total ${total})` : ''}
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-3.5 py-1.5 bg-white border border-[#E2ECE4] hover:bg-[#F3F8F4] rounded-full disabled:opacity-40 disabled:cursor-not-allowed text-[#0F172A] font-semibold shadow-xs transition-all cursor-pointer"
          >
            Previous
          </button>
          <span className="px-2 py-1 text-[#64748B] font-bold">Page {page}</span>
          <button 
            disabled={data.length < 50} 
            onClick={() => setPage(p => p + 1)}
            className="px-3.5 py-1.5 bg-white border border-[#E2ECE4] hover:bg-[#F3F8F4] rounded-full disabled:opacity-40 disabled:cursor-not-allowed text-[#0F172A] font-semibold shadow-xs transition-all cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {selectedTx && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E2ECE4] shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-lg w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEFEA]">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                  actionType === 'APPROVE' ? 'bg-[#16A34A]' : actionType === 'REJECT' ? 'bg-[#DC2626]' : 'bg-[#7C3AED]'
                }`}>
                  {actionType === 'APPROVE' ? <Check className="w-4 h-4" /> : actionType === 'REJECT' ? <X className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A]">
                    Confirm Exception Decision: {actionType}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Invoice {selectedTx.invoice_id} ({selectedTx.vendor_name || selectedTx.employee_name})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedTx(null); setActionType(null); }}
                className="p-1 rounded-full text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F3F8F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Citation Recap */}
            <div className="p-3 bg-[#FAFCFA] border border-[#E2ECE4] rounded-2xl text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Flagged AI Citation:</span>
              <p className="text-[#0F172A] font-medium leading-relaxed">
                {selectedTx.ai_citation || selectedTx.anomaly_details?.explanation || 'High risk baseline hold'}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                <span>Amount: <strong>{formatCurrency(selectedTx.amount)}</strong></span>
                <span>Risk Score: <strong>{selectedTx.risk_score}/100</strong></span>
              </div>
            </div>

            {/* Reviewer Reason Input */}
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Audit Log Reason / Human Citation
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Provide justification for enterprise audit ledger..."
                className="w-full p-3 text-xs bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-all resize-none font-medium"
              />
            </div>

            {actionErrorMsg && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionErrorMsg}</span>
              </div>
            )}

            {actionSuccessMsg && (
              <div className="p-3 bg-[#E8F8EE] border border-[#D1EED8] rounded-xl text-xs text-[#16A34A] flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setSelectedTx(null); setActionType(null); }}
                className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isSubmittingAction}
                className={`px-5 py-2 text-xs font-bold rounded-full text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                  actionType === 'APPROVE'
                    ? 'bg-[#16A34A] hover:bg-[#15803D]'
                    : actionType === 'REJECT'
                    ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                    : 'bg-[#7C3AED] hover:bg-[#6D28D9]'
                }`}
              >
                {isSubmittingAction ? 'Sealing on Ledger...' : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
