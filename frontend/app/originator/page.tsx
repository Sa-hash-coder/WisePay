'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { UnifiedSubmission } from '@/components/originator/UnifiedSubmission';
import { BulkBatchUpload } from '@/components/originator/BulkBatchUpload';
import { useAuth } from '@/context/AuthContext';
import { FileEdit, Layers, ShieldCheck, Sparkles } from 'lucide-react';

function OriginatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role } = useAuth();
  
  const currentTab = searchParams.get('tab') === 'batch' ? 'batch' : 'single';

  const setTab = (tab: 'single' | 'batch') => {
    router.push(tab === 'batch' ? '/originator?tab=batch' : '/originator');
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1360px] mx-auto px-6 lg:px-8 py-7 h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#64748B] mb-1">
            Data Entry • Expense &amp; Invoice Submission
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </span>
            The Originator Portal
          </h1>
          <p className="text-xs lg:text-sm text-[#64748B] mt-1 font-normal">
            Submit employee expense claims and vendor invoices, or upload bulk transactions.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-white border border-[#E2ECE4] rounded-2xl shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'single'
                ? 'bg-[#E8F8EE] text-[#16A34A] border border-[#D1EED8]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Single Unified Submission</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('batch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'batch'
                ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Bulk Batch Upload (CSV/Excel)</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1">
        {currentTab === 'single' ? (
          <UnifiedSubmission />
        ) : (
          <BulkBatchUpload />
        )}
      </div>
    </div>
  );
}

export default function OriginatorPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="p-8 text-center text-xs text-[#64748B]">Loading Originator Console...</div>
      }>
        <OriginatorContent />
      </Suspense>
    </AppShell>
  );
}
