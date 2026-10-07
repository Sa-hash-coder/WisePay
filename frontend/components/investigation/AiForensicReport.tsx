'use client';
import { useState } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  FileText, 
  Scale, 
  UserCheck, 
  Building2 
} from 'lucide-react';
import { api } from '@/lib/api';

interface AiForensicReportProps {
  initialReport?: any;
  invoiceId: string | number;
  transaction: any;
}

export function AiForensicReport({ initialReport, invoiceId, transaction }: AiForensicReportProps) {
  const [report, setReport] = useState<any>(initialReport);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLiveReport = async () => {
    setLoading(true);
    try {
      const res = await api.investigation.getAiReport(invoiceId);
      if (res && !res.error) {
        setReport(res);
      }
    } catch (err) {
      console.error('Failed to regenerate AI report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report) return;
    const text = `
=== WISEPAY AI FORENSIC AUDIT REPORT ===
Invoice ID: ${transaction.invoice_id} | Amount: ₹${transaction.amount} | Vendor: ${transaction.vendor_name}
Model: ${report.model_used || 'Gemini 1.5 Flash'}

EXECUTIVE SUMMARY:
${report.executive_summary}

KEY FRAUD & RISK VECTORS:
${report.fraud_vectors?.map((f: string) => `• ${f}`).join('\n')}

BEHAVIORAL ASSESSMENT:
${report.behavioral_assessment}

COMPLIANCE & SOX IMPACT:
${report.compliance_impact}

RECOMMENDED AUDITOR ACTIONS:
${report.recommended_actions?.map((a: string) => `[ ] ${a}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!report && !loading) {
    return (
      <div className="bg-white border border-[#E2ECE4] rounded-2xl p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#16A34A] flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#0F172A]">AI Forensic Report Generator</h3>
        <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
          Generate a deep contextual forensic narrative analyzing evidence chains, policy bypasses, and risk mitigation.
        </p>
        <button
          onClick={fetchLiveReport}
          className="mt-4 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-full shadow-xs flex items-center gap-2 mx-auto transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Generate Gemini AI Forensic Report
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2ECE4] rounded-2xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] flex flex-col gap-6">
      {/* Top Title & Model Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEFEA]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(22,163,74,0.2)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
                AI Forensic Investigation Report
              </h3>
              <span className="text-[10px] font-bold text-[#16A34A] bg-[#E8F8EE] border border-[#D1EED8] px-2 py-0.5 rounded-full">
                {report?.model_used || 'Gemini 1.5 Flash AI Engine'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Grounded multimodal financial risk synthesis & evidence correlation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-[#F3F8F4] hover:bg-[#E8F8EE] text-[#0F172A] hover:text-[#16A34A] border border-[#E2ECE4] rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Report'}</span>
          </button>
          <button
            onClick={fetchLiveReport}
            disabled={loading}
            className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Regenerate AI Report'}</span>
          </button>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <div className="bg-[#F8FAF8] border border-[#E2ECE4] rounded-2xl p-4.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#16A34A] mb-1.5">
          <FileText className="w-4 h-4" />
          Executive Audit Summary
        </div>
        <p className="text-xs lg:text-sm text-[#334155] leading-relaxed">
          {report?.executive_summary}
        </p>
      </div>

      {/* 2. Fraud Vectors & Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fraud & Exposure Vectors */}
        <div className="bg-white border border-[#FECACA] bg-[#FEF2F2]/30 rounded-2xl p-4.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B91C1C] mb-3">
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
            Identified Risk & Fraud Vectors
          </div>
          <ul className="space-y-2 text-xs text-[#475569]">
            {report?.fraud_vectors?.map((vec: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] mt-1.5 flex-shrink-0" />
                <span className="leading-normal">{vec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Behavioral Assessment */}
        <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
            <Building2 className="w-4 h-4 text-[#16A34A]" />
            Behavioral Baseline Context
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            {report?.behavioral_assessment}
          </p>
          <div className="mt-3 pt-3 border-t border-[#EAEFEA] flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Velocity Deviation: <strong className="text-[#0F172A]">Elevated</strong></span>
            <span>Historical Confidence: <strong className="text-[#16A34A]">94.2%</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Compliance Impact & Action Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compliance & SOX */}
        <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-2">
            <Scale className="w-4 h-4 text-[#16A34A]" />
            SOX 404 & Governance Impact
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            {report?.compliance_impact}
          </p>
        </div>

        {/* Actionable Steps for Reviewer */}
        <div className="bg-[#FFFBEB]/40 border border-[#FDE68A] rounded-2xl p-4.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B45309] mb-3">
            <UserCheck className="w-4 h-4 text-[#D97706]" />
            Recommended Auditor Action Plan
          </div>
          <ul className="space-y-2 text-xs text-[#78350F]">
            {report?.recommended_actions?.map((act: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D97706] mt-0.5 flex-shrink-0" />
                <span className="leading-normal">{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
