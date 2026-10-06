'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { RiskBadge } from './RiskBadge';
import { DecisionBadge } from './DecisionBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowRight, Search, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert, Filter, UserCheck } from 'lucide-react';
import { Transaction } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function ExceptionTable() {
  const { role, roleConfig } = useAuth();
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'HIGH_RISK' | 'HUMAN_REVIEW' | 'AUTO_PASS' | 'UNDER_LIMIT' | 'OVER_LIMIT'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchTransactions = () => {
    setLoading(true);
    const params: Record<string, string | number> = {
      page,
      size: 50,
      sort: 'risk_score',
    };
    if (filter === 'HIGH_RISK') {
      params.decision = 'HIGH_RISK';
    } else if (filter === 'HUMAN_REVIEW') {
      params.decision = 'HUMAN_REVIEW';
    } else if (filter === 'AUTO_PASS') {
      params.decision = 'AUTO_PASS';
    } else {
      params.decision = 'HIGH_RISK,HUMAN_REVIEW';
    }

    api.transactions.list(params)
      .then(res => {
        setData(res.items || []);
        setTotal(res.total || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch transactions', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter, page]);

  // Client-side filtering for amount thresholds and search
  const displayData = data.filter(t => {
    if (filter === 'UNDER_LIMIT' && t.amount > 500000) return false;
    if (filter === 'OVER_LIMIT' && t.amount <= 500000) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.invoice_id?.toLowerCase().includes(q) ||
      t.vendor_name?.toLowerCase().includes(q) ||
      t.employee_name?.toLowerCase().includes(q) ||
      t.invoice_number?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col gap-5">
      {/* Top Filter and Search Bar in Greyish Panel */}
      <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => { setFilter('ALL'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'ALL' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Exceptions
          </button>
          <button 
            onClick={() => { setFilter('HIGH_RISK'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'HIGH_RISK' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            High Risk
          </button>
          <button 
            onClick={() => { setFilter('HUMAN_REVIEW'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'HUMAN_REVIEW' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Human Review
          </button>

          {/* Role-Specific Quick Filters */}
          {role === 'AP / FINANCE REVIEWER' && (
            <>
              <button 
                onClick={() => { setFilter('UNDER_LIMIT'); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === 'UNDER_LIMIT' 
                    ? 'bg-sky-600 text-white shadow-xs' 
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                }`}
                title="Invoices within the ₹5,00,000 threshold for AP Reviewers"
              >
                ≤ ₹5L (Reviewable)
              </button>
              <button 
                onClick={() => { setFilter('OVER_LIMIT'); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === 'OVER_LIMIT' 
                    ? 'bg-purple-600 text-white shadow-xs' 
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
                title="Invoices exceeding ₹5,00,000 requiring manager sign-off"
              >
                &gt; ₹5L (Needs Mgr)
              </button>
            </>
          )}

          <button 
            onClick={() => { setFilter('AUTO_PASS'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'AUTO_PASS' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Auto-Pass Sample
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor, invoice, submitter..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
            />
          </div>
          <button
            onClick={fetchTransactions}
            title="Refresh queue"
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Role Context Bar */}
      <div className="px-4 py-2.5 bg-slate-100/70 border border-slate-200/90 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          <span>Active Clearance: <strong className="text-slate-900">{role}</strong></span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{roleConfig.department}</span>
        </div>
        <div className="text-[11px] text-slate-600 font-medium">
          {role === 'AP / FINANCE REVIEWER' && 'Threshold: Invoices up to ₹5,00,000'}
          {role === 'FINANCE MANAGER' && 'Full Authority: High-risk overrides enabled'}
          {role === 'AUDITOR' && 'Read-Only: Segregation of duties oversight'}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-bold">Invoice & Date</th>
              <th className="py-3 px-4 font-bold">Vendor</th>
              <th className="py-3 px-4 font-bold">Employee / Dept</th>
              <th className="py-3 px-4 font-bold">Amount</th>
              <th className="py-3 px-4 font-bold">Risk Score</th>
              <th className="py-3 px-4 font-bold">Confidence</th>
              <th className="py-3 px-4 font-bold">Decision</th>
              <th className="py-3 px-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                    <span className="text-xs">Analyzing exceptions and calculating telemetry...</span>
                  </div>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                  No transactions match the selected filter or search criteria.
                </td>
              </tr>
            ) : displayData.map((tx) => (
              <tr 
                key={tx.id} 
                className={`transition-colors group hover:bg-slate-50/80 ${
                  tx.decision === 'HIGH_RISK' ? 'bg-rose-50/20' : tx.decision === 'HUMAN_REVIEW' ? 'bg-amber-50/15' : ''
                }`}
              >
                <td className="py-3.5 px-4">
                  <div className="font-bold text-indigo-600 font-mono text-xs">{tx.invoice_id}</div>
                  <div className="text-[11px] text-slate-400">{tx.invoice_date ? formatDate(tx.invoice_date) : '-'}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="text-[#0F172A] font-semibold text-xs">{tx.vendor_name}</div>
                  <div className="text-[11px] text-slate-500">{tx.category}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="text-slate-800 text-xs font-medium">{tx.employee_name}</div>
                  <div className="text-[11px] text-slate-400">{tx.employee_dept}</div>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A] text-xs">
                  {formatCurrency(tx.amount)}
                </td>
                <td className="py-3.5 px-4">
                  <RiskBadge score={tx.risk_score} />
                </td>
                <td className="py-3.5 px-4">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                    tx.confidence >= 80 
                      ? 'text-indigo-700 bg-indigo-50 border-indigo-200' 
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {tx.confidence}%
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <DecisionBadge decision={tx.decision} />
                  {tx.human_decision && (
                    <span className="block mt-1 text-[10px] text-purple-700 font-mono font-bold">
                      {tx.human_decision}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link href={`/investigate/${tx.id}`}>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all text-xs font-semibold text-slate-700 border border-slate-200 hover:border-indigo-600 shadow-2xs cursor-pointer">
                      Investigate
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-2 pt-1">
        <div>
          Showing <strong className="text-slate-700">{displayData.length}</strong> records {total > 0 ? `(total ${total} in category)` : ''}
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium shadow-2xs transition-all cursor-pointer"
          >
            Previous
          </button>
          <span className="px-2 py-1 text-slate-600 font-semibold">Page {page}</span>
          <button 
            disabled={data.length < 50} 
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium shadow-2xs transition-all cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
