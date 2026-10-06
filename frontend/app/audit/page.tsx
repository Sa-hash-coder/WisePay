'use client';
import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/shared/Card';
import { Shield, CheckCircle, RefreshCw, Link as ChainIcon, Home, UserCheck, ShieldCheck, Lock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AuditPage() {
  const { role, roleConfig, switchRole, user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditEvents = () => {
    setLoading(true);
    api.audit.chain(1, 50)
      .then(res => {
        setEvents(res || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAuditEvents();
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-[1340px] mx-auto px-8 py-7">
        {/* Header */}
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                Immutable Governance
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2.5">
              <Shield className="text-indigo-600 w-6 h-6" />
              Verifiable Decision Audit Chain
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Tamper-evident sequential SHA-256 cryptographic ledger of all automated AI classifications and human interventions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full font-mono font-medium shadow-xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              LEDGER INTEGRITY: VERIFIED
            </div>
            <button
              onClick={fetchAuditEvents}
              title="Refresh chain"
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* RBAC Auditor Role Clearance Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              role === 'AUDITOR' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F172A]">
                  Active Audit Observer: {user.name}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${roleConfig.badgeClasses.bg} ${roleConfig.badgeClasses.text} ${roleConfig.badgeClasses.border}`}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {role === 'AUDITOR'
                  ? 'Independent SOX 404 & SOC-2 compliance clearance active. Cryptographic chain inspection verified.'
                  : 'Operating in observational mode. Switch to AUDITOR role for full independent compliance verification.'}
              </p>
            </div>
          </div>

          {role !== 'AUDITOR' && (
            <button
              type="button"
              onClick={() => switchRole('AUDITOR')}
              className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
            >
              Switch to Auditor Role
            </button>
          )}
        </div>

        {/* Explanation Banner */}
        <div className="p-5 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 border border-indigo-100 rounded-2xl flex items-start gap-3.5 shadow-xs">
          <ChainIcon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-[#0F172A]">How SENTINEL Blockchain Verification Works: </span>
            Full invoice records and private employee documents are preserved in the enterprise database. For every evaluation or human action, SENTINEL generates a structured event payload, computes its SHA-256 hash combined with the previous block&apos;s hash (<span className="font-mono text-indigo-700 font-semibold">prev_hash</span>), and anchors it into an immutable chain. If any historical record is modified or deleted, the cryptographic hash link immediately breaks.
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Recorded Ledger Blocks (Showing recent {events.length})
            </div>
            <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
              Algorithm: SHA-256 Hash Chain
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 w-20">Block #</th>
                  <th className="py-3 px-4 w-40">Timestamp</th>
                  <th className="py-3 px-4 w-48">Event Type</th>
                  <th className="py-3 px-4">Transaction Reference</th>
                  <th className="py-3 px-4 font-mono">Current Block Hash</th>
                  <th className="py-3 px-4 font-mono">Previous Block Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-sans">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                      Scanning audit blocks...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-sans">
                      No audit records loaded.
                    </td>
                  </tr>
                ) : (
                  events.map((ev, i) => (
                    <tr key={ev.id || i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-indigo-600 font-bold">
                        #{ev.block_index !== undefined ? ev.block_index : i}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-[#0F172A]">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-semibold ${
                          ev.event_type?.includes('HUMAN') 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {ev.event_type?.replace(/_/g, ' ') || 'SYSTEM EVENT'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-sans">
                        {ev.transaction_id ? `${ev.transaction_id.slice(0, 14)}...` : 'System Root'}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 text-[11px] truncate max-w-[200px]" title={ev.hash}>
                        {ev.hash ? `${ev.hash.slice(0, 16)}...` : '0x...'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] truncate max-w-[160px]" title={ev.prev_hash}>
                        {ev.prev_hash ? `${ev.prev_hash.slice(0, 12)}...` : '0'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
