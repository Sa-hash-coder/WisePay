'use client';
import { AppShell } from '@/components/layout/AppShell';
import { ExceptionTable } from '@/components/queue/ExceptionTable';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ShieldAlert, AlertTriangle, Layers, Lock } from 'lucide-react';

export default function QueuePage() {
  const { role, isAuditor } = useAuth();

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-[1360px] mx-auto px-6 lg:px-8 py-7 h-full">
        {/* Top Header dynamically customized for the Active Role */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#64748B] mb-1">
              {role === 'AUDITOR' 
                ? 'Independent Compliance & Audit Oversight' 
                : role === 'THE ORIGINATOR'
                ? 'Data Entry Clearance (Submission Only)'
                : 'Primary Human-in-the-Loop • Exception Handling'}
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0F172A] flex items-center gap-2.5">
              {role === 'AUDITOR' ? (
                <>
                  <ShieldCheck className="w-7 h-7 text-[#D97706]" />
                  Auditor Exception Review Ledger
                </>
              ) : role === 'THE ORIGINATOR' ? (
                <>
                  <Layers className="w-7 h-7 text-[#2563EB]" />
                  Flagged Exceptions
                </>
              ) : (
                <>
                  <ShieldAlert className="w-7 h-7 text-[#0D9488]" />
                  The Exception Pile
                </>
              )}
            </h1>
            <p className="text-xs lg:text-sm text-[#64748B] mt-1 font-normal">
              {role === 'AUDITOR'
                ? 'Read-only audit inspection of flagged exception cases, AI explanations, and AP Reviewer intervention decisions.'
                : role === 'THE ORIGINATOR'
                ? 'Observation view of exceptions flagged for human review.'
                : 'Zero standard CRUD transactions. Displays exclusively rows flagged by AI for high-risk, duplicates, policy limits, or missing fields.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuditor ? (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] px-3.5 py-1.5 rounded-full text-[#B45309] font-bold text-xs flex items-center gap-1.5 shadow-xs">
                <Lock className="w-3.5 h-3.5" />
                SOX 404 Read-Only Mode
              </div>
            ) : role === 'THE ORIGINATOR' ? (
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-1.5 rounded-full text-[#1D4ED8] font-bold text-xs flex items-center gap-1.5 shadow-xs">
                <Layers className="w-3.5 h-3.5" />
                Data Entry Clearance
              </div>
            ) : (
              <>
                <div className="bg-[#FFFBEB] border border-[#FDE68A] px-3 py-1.5 rounded-full text-[#B45309] font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></span>
                  Human Triage Authority
                </div>
                <div className="bg-[#E8F8EE] border border-[#D1EED8] px-3 py-1.5 rounded-full text-[#16A34A] font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                  Human-in-the-Loop Active
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-h-0">
          <ExceptionTable />
        </div>
      </div>
    </AppShell>
  );
}
