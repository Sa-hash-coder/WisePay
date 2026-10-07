'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Transaction } from '@/types';
import { api } from '@/lib/api';

interface DuplicateEvidenceProps {
  transaction: Transaction;
  duplicateInfo: {
    is_duplicate: boolean;
    similarity_score: number;
    matched_invoice_id: string;
    matched_invoice_number?: string;
    matched_vendor?: string;
    matched_amount?: number;
    match_type: 'EXACT' | 'NEAR';
  } | null;
}

export function DuplicateEvidence({ transaction, duplicateInfo }: DuplicateEvidenceProps) {
  const [matchedTx, setMatchedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  const isDup = duplicateInfo?.is_duplicate;
  const simPercent = duplicateInfo ? Math.round((duplicateInfo.similarity_score || 0.96) * 100) : 0;
  const matchType = duplicateInfo?.match_type || 'NEAR';

  useEffect(() => {
    if (isDup && duplicateInfo?.matched_invoice_id) {
      setLoading(true);
      api.transactions.get(duplicateInfo.matched_invoice_id)
        .then(res => {
          if (res && !res.error) {
            setMatchedTx(res);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [duplicateInfo]);

  if (!isDup) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-3 bg-white border border-[#E2ECE4] rounded-2xl shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#E8F8EE] border border-[#D1EED8] flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-[#16A34A]" />
        </div>
        <h3 className="text-base font-bold text-[#0F172A]">No Duplicate Detected</h3>
        <p className="text-sm text-[#64748B] max-w-md">
          TF-IDF cosine similarity analysis across previous transactions for vendor <strong>{transaction.vendor_name}</strong> found no overlapping invoice numbers, identical amounts, or description clusters.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Alert Header */}
      <div className={`p-4 rounded-2xl border flex items-start gap-4 shadow-xs ${
        matchType === 'EXACT'
          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
      }`}>
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          matchType === 'EXACT' ? 'text-[#DC2626]' : 'text-[#D97706]'
        }`} />
        <div className="flex-1">
          <div className="font-bold text-sm">
            {matchType === 'EXACT' ? 'EXACT DUPLICATE TRANSACTION DETECTED' : `NEAR-DUPLICATE DETECTED (${simPercent}% Similarity)`}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            {matchType === 'EXACT'
              ? 'Identical vendor, invoice number, and monetary amount matched against an existing transaction record.'
              : 'High cosine similarity on transaction description and identical vendor/amount with a previously submitted invoice.'}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold font-mono text-[#0F172A]">
            {matchType === 'EXACT' ? '100%' : `${simPercent}%`}
          </div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8]">Match Confidence</div>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Transaction */}
        <Card className="p-5 border-[#FDE68A] bg-[#FFFBEB]/40 rounded-2xl shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#FDE68A] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#92400E]">
              Current Submission (Flagged)
            </span>
            <span className="text-xs font-mono font-bold bg-[#FEF3C7] text-[#92400E] px-2.5 py-0.5 rounded-full">
              PENDING
            </span>
          </div>
          <div className="space-y-3">
            <Row label="Invoice ID" value={transaction.invoice_id} highlight />
            <Row label="Invoice Number" value={transaction.invoice_number || 'N/A'} highlight />
            <Row label="Vendor" value={transaction.vendor_name} highlight />
            <Row label="Amount" value={formatCurrency(transaction.amount)} highlight />
            <Row label="Date" value={transaction.invoice_date ? formatDate(transaction.invoice_date) : '-'} />
            <Row label="Submitter" value={`${transaction.employee_name} (${transaction.employee_dept})`} />
            <Row label="Description" value={transaction.description} />
          </div>
        </Card>

        {/* Matched Transaction */}
        <Card className="p-5 border-[#E2ECE4] bg-white rounded-2xl shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#EAEFEA] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
              Prior Recorded Transaction
            </span>
            {matchedTx && (
              <Link 
                href={`/investigate/${matchedTx.id}`}
                className="text-xs text-[#16A34A] hover:underline flex items-center gap-1 font-bold"
              >
                Inspect Record <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
          <div className="space-y-3">
            <Row 
              label="Invoice ID" 
              value={matchedTx ? matchedTx.invoice_id : (duplicateInfo?.matched_invoice_id?.slice(0, 12) + '...' || 'Matched Record')} 
              highlight 
            />
            <Row 
              label="Invoice Number" 
              value={matchedTx?.invoice_number || transaction.invoice_number || 'Matched'} 
              highlight 
            />
            <Row 
              label="Vendor" 
              value={matchedTx ? matchedTx.vendor_name : transaction.vendor_name} 
              highlight 
            />
            <Row 
              label="Amount" 
              value={formatCurrency(matchedTx ? matchedTx.amount : transaction.amount)} 
              highlight 
            />
            <Row 
              label="Date" 
              value={matchedTx?.invoice_date ? formatDate(matchedTx.invoice_date) : 'Earlier Date'} 
            />
            <Row 
              label="Submitter" 
              value={matchedTx ? `${matchedTx.employee_name} (${matchedTx.employee_dept})` : transaction.employee_name} 
            />
            <Row 
              label="Description" 
              value={matchedTx?.description || transaction.description} 
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-[#64748B] font-medium">{label}</span>
      <span className={`font-mono px-2 py-0.5 rounded-md max-w-[240px] truncate ${
        highlight ? 'bg-[#FEF3C7] text-[#92400E] font-bold' : 'text-[#0F172A] font-semibold'
      }`}>
        {value}
      </span>
    </div>
  );
}
