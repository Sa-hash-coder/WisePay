'use client';
import { AppShell } from '@/components/layout/AppShell';
import { ExceptionTable } from '@/components/queue/ExceptionTable';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function QueuePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-[1340px] mx-auto px-8 py-7 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Home className="w-3 h-3" />
                <span>Home</span>
              </Link>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                Human-in-the-loop Verification
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Exception Queue</h1>
            <p className="text-slate-500 text-sm mt-1">Invoices flagged for manual audit, policy exceptions, or high behavioral risk.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-800 font-semibold text-xs flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Review Needed
            </div>
            <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-rose-800 font-semibold text-xs flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Quarantined
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0">
          <ExceptionTable />
        </div>
      </div>
    </AppShell>
  );
}
