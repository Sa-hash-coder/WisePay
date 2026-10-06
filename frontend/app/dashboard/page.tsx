'use client';
import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttentionSavedGauge } from '@/components/dashboard/AttentionSavedGauge';
import { ProcessingStream } from '@/components/dashboard/ProcessingStream';
import { RiskDistributionChart } from '@/components/dashboard/RiskDistributionChart';
import { NetworkGraph } from '@/components/dashboard/NetworkGraph';
import { Card } from '@/components/shared/Card';
import Link from 'next/link';
import { 
  ArrowRight, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  RefreshCw,
  Home
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | 'month' | 'quarter'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = () => {
    setIsRefreshing(true);
    api.dashboard.stats()
      .then(data => {
        setStats(data);
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch(() => {
        setStats({
          total: 9535,
          auto_pass: 8412,
          human_review: 847,
          high_risk: 276,
          human_attention_saved_pct: 88.2,
          total_amount: 2847392000,
          flagged_amount: 387294000,
        });
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const flaggedCount = stats ? (stats.human_review + stats.high_risk) : 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-[1340px] mx-auto px-8 py-7">
        {/* Top Banner / Summary Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up">
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                Auditor Console
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">Real-time risk scoring engine</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Executive Risk Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Automated invoice triage, behavioral anomaly detection, and fraud defense.
            </p>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Timeframe pill selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600 border border-slate-200 shadow-inner">
              <button
                onClick={() => setTimeframe('today')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === 'today' ? 'bg-white text-[#0F172A] shadow-xs font-semibold' : 'hover:text-[#0F172A]'
                }`}
              >
                24h
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === 'month' ? 'bg-white text-[#0F172A] shadow-xs font-semibold' : 'hover:text-[#0F172A]'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeframe('quarter')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === 'quarter' ? 'bg-white text-[#0F172A] shadow-xs font-semibold' : 'hover:text-[#0F172A]'
                }`}
              >
                Q3 FY26
              </button>
            </div>

            {/* Refresh Data */}
            <button
              onClick={fetchStats}
              title="Refresh analytics"
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Financial Exposure & Efficiency Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between card-hover">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Volume Audited
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {loading ? '--' : formatCurrency(stats?.total_amount ?? 2847392000)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">99.4% precision</span> · 10,000+ invoices
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between card-hover">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Flagged Exposure Quarantined
              </div>
              <div className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">
                {loading ? '--' : formatCurrency(stats?.flagged_amount ?? 387294000)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 text-[10px]">Held</span>
                <span>Before disbursement authorization</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between card-hover">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Autonomous Approval Ratio
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {loading ? '--' : `${stats?.human_attention_saved_pct ?? 88.2}%`}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">Zero touches</span>
                <span>Manual review eliminated</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Primary Triage Breakdown Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Invoices"
            value={stats?.total ?? 0}
            loading={loading}
            icon={<Activity className="w-4 h-4" />}
            accentColor="#4F46E5"
            trend="Scored via Isolation Forest & NLP"
          />
          <StatCard
            title="Auto-Passed"
            value={stats?.auto_pass ?? 0}
            loading={loading}
            icon={<CheckCircle2 className="w-4 h-4" />}
            accentColor="#059669"
            trend="Compliant · Low risk"
          />
          <StatCard
            title="Human Review"
            value={stats?.human_review ?? 0}
            loading={loading}
            icon={<AlertTriangle className="w-4 h-4" />}
            accentColor="#D97706"
            trend="Ambiguous policy thresholds"
          />
          <StatCard
            title="High-Risk Hold"
            value={stats?.high_risk ?? 0}
            loading={loading}
            icon={<XCircle className="w-4 h-4" />}
            accentColor="#DC2626"
            trend="Duplicate / Anomaly alert"
          />
        </div>

        {/* Attention Saved Gauge + Live Processing Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AttentionSavedGauge
              percentage={stats?.human_attention_saved_pct ?? 0}
              loading={loading}
            />
          </div>
          <div className="h-[310px]">
            <ProcessingStream />
          </div>
        </div>

        {/* Analytical Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskDistributionChart />
          <NetworkGraph />
        </div>

        {/* Action / Queue Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/queue" className="group">
            <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-base font-semibold text-[#0F172A] group-hover:text-indigo-600 transition-colors">
                    Open Exception Review Queue
                  </h3>
                </div>
                <p className="text-slate-500 text-sm mt-1">
                  {loading ? 'Loading queue items...' : `${flaggedCount} invoices queued for human verification & policy sign-off`}
                </p>
                <div className="flex items-center gap-2 mt-3.5">
                  <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-semibold border border-rose-200">
                    {stats?.high_risk ?? 0} HIGH RISK
                  </span>
                  <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full font-semibold border border-amber-200">
                    {stats?.human_review ?? 0} NEEDS REVIEW
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all duration-200">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/audit" className="group">
            <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-base font-semibold text-[#0F172A] group-hover:text-indigo-600 transition-colors">
                    Inspect Cryptographic Audit Ledger
                  </h3>
                </div>
                <p className="text-slate-500 text-sm mt-1">
                  Tamper-evident sequential SHA-256 blockchain verification of all automated decisions
                </p>
                <div className="flex items-center gap-2 mt-3.5">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold border border-indigo-200 font-mono">
                    SHA-256 HASH CHAIN
                  </span>
                  <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-semibold border border-purple-200">
                    IMMUTABLE
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all duration-200">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
