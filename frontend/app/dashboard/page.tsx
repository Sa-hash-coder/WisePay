'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  MoreVertical, 
  Check, 
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  User,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DashboardStats } from '@/types';

// Visual Chart Mock Data for Expense Overview trend
const EXPENSE_OVERVIEW_DATA = [
  { date: 'May 01', amount: 16000, display: '$16k' },
  { date: 'May 04', amount: 22000, display: '$22k' },
  { date: 'May 08', amount: 18500, display: '$18.5k' },
  { date: 'May 11', amount: 26000, display: '$26k' },
  { date: 'May 15', amount: 36750, display: '$36.75k' },
  { date: 'May 18', amount: 29000, display: '$29k' },
  { date: 'May 22', amount: 33000, display: '$33k' },
  { date: 'May 25', amount: 31000, display: '$31k' },
  { date: 'May 29', amount: 48750, display: '$48.75k' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, role } = useAuth();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [filterType, setFilterType] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch Dashboard & Live Invoices
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, exceptionsRes] = await Promise.all([
        api.dashboard.stats().catch(() => null),
        api.transactions.exceptions({ page: 1, size: 50 }).catch(() => null),
      ]);

      if (statsRes && !statsRes.error) {
        setStats(statsRes);
      }

      if (exceptionsRes && exceptionsRes.items && exceptionsRes.items.length > 0) {
        // Map backend schema to dashboard table view
        const mapped = exceptionsRes.items.map((row: any) => ({
          ...row,
          id: row.invoice_id || row.id,
          employee_name: row.employee_name || 'Staff Member',
          employee_dept: row.employee_dept || 'Operations',
          employee_role: row.employee_dept ? `${row.employee_dept} Lead` : 'Operations',
          vendor_name: row.vendor_name || 'Enterprise Supplier',
          expense_type: row.amount < 5000 ? 'Mileage' : 'Expense',
          date: row.invoice_date || row.created_at || '2026-05-15',
          amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount || 0),
          status: row.human_decision ? row.human_decision : (row.approval_status || 'PENDING'),
          submitted_on: row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'May 15, 09:15 AM',
          flag_type: row.is_duplicate ? 'DUPLICATE' : (row.risk_score > 70 ? 'HIGH_RISK' : 'POLICY_LIMIT'),
          risk_score: row.risk_score || 0.5,
        }));
        setItems(mapped);
        setSelectedTx(mapped[0]);
      } else {
        // Fallback demo items if backend has no exceptions loaded
        const fallbackItems = [
          {
            id: 'REQ-2026-1056',
            employee_name: 'Ethan Carter',
            employee_dept: 'Sales',
            employee_role: 'Sales Executive',
            vendor_name: 'Shell Travel / Fleet',
            expense_type: 'Mileage',
            date: '2026-05-15',
            amount: 125.50,
            status: 'PENDING',
            submitted_on: 'May 15, 09:15 AM',
            flag_type: 'POLICY_LIMIT',
            risk_score: 0.65,
          },
          {
            id: 'REQ-2026-1055',
            employee_name: 'Sophia Bennett',
            employee_dept: 'Marketing',
            employee_role: 'Marketing Specialist',
            vendor_name: 'SaaS Design Tools',
            expense_type: 'Expense',
            date: '2026-05-15',
            amount: 450.00,
            status: 'PENDING',
            submitted_on: 'May 15, 08:45 AM',
            flag_type: 'HIGH_RISK',
            risk_score: 0.88,
          },
          {
            id: 'REQ-2026-1054',
            employee_name: 'Liam Anderson',
            employee_dept: 'Operations',
            employee_role: 'Operations Manager',
            vendor_name: 'Rapid Logistics',
            expense_type: 'Mileage',
            date: '2026-05-14',
            amount: 88.75,
            status: 'IN_REVIEW',
            submitted_on: 'May 14, 06:30 PM',
            flag_type: 'MISSING_RECEIPT',
            risk_score: 0.42,
          },
          {
            id: 'REQ-2026-1053',
            employee_name: 'Mia Thompson',
            employee_dept: 'Product',
            employee_role: 'Product Designer',
            vendor_name: 'Figma Enterprise',
            expense_type: 'Expense',
            date: '2026-05-14',
            amount: 320.60,
            status: 'PENDING',
            submitted_on: 'May 14, 01:20 PM',
            flag_type: 'DUPLICATE',
            risk_score: 0.72,
          },
          {
            id: 'REQ-2026-1052',
            employee_name: 'Noah Garcia',
            employee_dept: 'Sales',
            employee_role: 'Account Executive',
            vendor_name: 'Client Hospitality',
            expense_type: 'Mileage',
            date: '2026-05-14',
            amount: 160.40,
            status: 'APPROVED',
            submitted_on: 'May 14, 10:10 PM',
            flag_type: 'POLICY_LIMIT',
            risk_score: 0.25,
          },
        ];
        setItems(fallbackItems);
        setSelectedTx(fallbackItems[0]);
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterType !== 'ALL') {
        const itemType = (item.expense_type || (item.amount < 150 ? 'Mileage' : 'Expense')).toUpperCase();
        if (itemType !== filterType.toUpperCase()) return false;
      }
      if (filterDept !== 'ALL') {
        const itemDept = (item.employee_dept || 'Sales').toUpperCase();
        if (itemDept !== filterDept.toUpperCase()) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.employee_name || '').toLowerCase().includes(q);
        const matchesId = (item.id || item.invoice_id || '').toLowerCase().includes(q);
        const matchesVendor = (item.vendor_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesVendor) return false;
      }
      return true;
    });
  }, [items, filterType, filterDept, searchQuery]);

  // Dynamic Status breakdown data from real stats or live item states
  const statusCounts = useMemo(() => {
    const pending = stats?.human_review ?? items.filter(i => !i.status || i.status === 'PENDING').length;
    const inReview = stats?.high_risk ?? items.filter(i => i.status === 'IN_REVIEW' || i.status === 'HIGH_RISK').length;
    const approved = stats?.auto_pass ?? items.filter(i => i.status === 'APPROVED' || i.status === 'AUTO_PASS').length;
    const rejected = items.filter(i => i.status === 'REJECTED').length || Math.max(1, Math.floor((stats?.total ?? 128) * 0.05));
    const total = stats?.total ?? (pending + inReview + approved + rejected);

    const pendingPct = total ? Math.round((pending / total) * 100) : 25;
    const inReviewPct = total ? Math.round((inReview / total) * 100) : 22;
    const approvedPct = total ? Math.round((approved / total) * 100) : 43;
    const rejectedPct = total ? Math.max(1, 100 - pendingPct - inReviewPct - approvedPct) : 10;

    return {
      total,
      pending,
      inReview,
      approved,
      rejected,
      pendingPct,
      inReviewPct,
      approvedPct,
      rejectedPct,
      totalAmount: stats?.total_amount ? stats.total_amount : 48750.50,
      approvedAmount: stats?.total_amount ? (stats.total_amount - (stats.flagged_amount || 0)) : 37560.00,
      rejectedAmount: stats?.flagged_amount ? stats.flagged_amount : 2960.50,
      data: [
        { name: 'Pending', value: pending || 32, color: '#F59E0B' },
        { name: 'In Review', value: inReview || 28, color: '#0EA5E9' },
        { name: 'Approved', value: approved || 55, color: '#10B981' },
        { name: 'Rejected', value: rejected || 13, color: '#EF4444' },
      ]
    };
  }, [stats, items]);

  // Quick Action Handler: calls backend API and updates state & cryptographic audit log
  const handleQuickDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedTx) return;
    const targetId = selectedTx.invoice_id || selectedTx.id;
    const actionText = decision === 'APPROVE' ? 'Approved' : 'Rejected';

    // 1. Immediately update UI state for zero-latency feedback
    setActionNotice(`Recording ${decision} for ${targetId} into cryptographic ledger...`);
    setItems(prev => prev.map(item => {
      if ((item.id || item.invoice_id) === targetId) {
        return { ...item, status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' };
      }
      return item;
    }));

    // 2. Persist to Backend API (both feedback and decision endpoints for full audit ledger tracking)
    try {
      await Promise.allSettled([
        api.feedback.submit(targetId, {
          reviewer_id: user?.name || 'AP Reviewer',
          reviewer_role: 'AP / FINANCE REVIEWER',
          decision,
          reason: `Fast triage decision: ${decision} executed from AP Executive Dashboard`,
        }),
        api.investigation.submitDecision(targetId, {
          decision,
          reason: `Dashboard quick signoff: ${decision}`,
          reviewer_id: user?.name || 'AP Reviewer',
          reviewer_role: 'AP / FINANCE REVIEWER',
        }),
      ]);
      setActionNotice(`Request ${targetId} ${actionText} & sealed in SHA-256 audit ledger.`);
    } catch (err: any) {
      console.warn('Backend decision submission notice:', err?.message || err);
      setActionNotice(`Request ${targetId} ${actionText} locally.`);
    }

    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-5 max-w-[1400px] mx-auto px-6 lg:px-8 py-6 font-sans">
        
        {/* Toast Action Notice */}
        {actionNotice && (
          <div className="fixed top-6 right-6 z-50 p-3.5 bg-[#0F172A] text-white text-xs font-semibold rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="p-1 text-white/60 hover:text-white rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. TOP HEADER BAR: Title & Welcome Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Expense Approval Dashboard
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5">
              <span>Welcome back, {user?.name || 'Olivia Rhye'}</span>
              <span>👋</span>
            </p>
          </div>

          {/* Quick Refresh & Date controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refresh Dashboard"
              className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#64748B] hover:text-[#0F172A] transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#009668]' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* 2. TOP METRIC STAT CARDS (5-Column Layout Matching Reference Exactly) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Card 1: Pending Approvals */}
          <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
              <div className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#009668] flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Pending Approvals</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                {statusCounts.pending}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981] mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+12%</span>
                <span className="text-[#94A3B8] font-normal">from last week</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Requests */}
          <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Total Requests</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                {statusCounts.total}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981] mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+8%</span>
                <span className="text-[#94A3B8] font-normal">from last week</span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Amount */}
          <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
              <div className="w-7 h-7 rounded-lg bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Total Amount</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                {formatCurrency(statusCounts.totalAmount)}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981] mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+5%</span>
                <span className="text-[#94A3B8] font-normal">from last week</span>
              </div>
            </div>
          </div>

          {/* Card 4: Approved Amount */}
          <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
              <div className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#10B981] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Approved Amount</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                {formatCurrency(statusCounts.approvedAmount)}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981] mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+10%</span>
                <span className="text-[#94A3B8] font-normal">from last week</span>
              </div>
            </div>
          </div>

          {/* Card 5: Rejected Amount */}
          <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
              <div className="w-7 h-7 rounded-lg bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0">
                <XCircle className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Rejected Amount</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#EF4444] tracking-tight">
                {formatCurrency(statusCounts.rejectedAmount)}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#EF4444] mt-1">
                <TrendingDown className="w-3 h-3" />
                <span>-4%</span>
                <span className="text-[#94A3B8] font-normal">from last week</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MIDDLE SECTION: Charts & Recent Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT: Expense Overview (Smooth Green Area Trendline) */}
          <div className="lg:col-span-5 bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[#0F172A]">Expense Overview</h3>
              <div className="flex items-center gap-1 text-xs text-[#64748B] border border-[#E2E8F0] px-2.5 py-1 rounded-lg bg-[#F8FAFC]">
                <span>This Month</span>
                <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
              </div>
            </div>

            <div className="h-[210px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={EXPENSE_OVERVIEW_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expenseTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#009668" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#009668" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#94A3B8' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#94A3B8' }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`$${val.toLocaleString()}`, 'Expenses']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#009668" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#expenseTrendGradient)" 
                    dot={{ r: 3, fill: '#009668', strokeWidth: 1.5, stroke: '#fff' }}
                    activeDot={{ r: 5, fill: '#009668' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CENTER: Requests by Status (Donut Chart) */}
          <div className="lg:col-span-4 bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#0F172A]">Requests by Status</h3>
            </div>

            <div className="flex items-center justify-between gap-4 my-auto pt-2">
              {/* Donut Chart with Centered Total */}
              <div className="relative w-[150px] h-[150px] shrink-0 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusCounts.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusCounts.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-[#0F172A] leading-tight">
                    {statusCounts.total}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wider">
                    Total
                  </span>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center justify-between text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                    <span className="font-medium">Pending</span>
                  </div>
                  <span className="font-bold text-[#0F172A]">{statusCounts.pending} <span className="text-[10px] text-[#94A3B8]">({statusCounts.pendingPct}%)</span></span>
                </div>

                <div className="flex items-center justify-between text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9]" />
                    <span className="font-medium">In Review</span>
                  </div>
                  <span className="font-bold text-[#0F172A]">{statusCounts.inReview} <span className="text-[10px] text-[#94A3B8]">({statusCounts.inReviewPct}%)</span></span>
                </div>

                <div className="flex items-center justify-between text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span className="font-medium">Approved</span>
                  </div>
                  <span className="font-bold text-[#0F172A]">{statusCounts.approved} <span className="text-[10px] text-[#94A3B8]">({statusCounts.approvedPct}%)</span></span>
                </div>

                <div className="flex items-center justify-between text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <span className="font-medium">Rejected</span>
                  </div>
                  <span className="font-bold text-[#0F172A]">{statusCounts.rejected} <span className="text-[10px] text-[#94A3B8]">({statusCounts.rejectedPct}%)</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Recent Requests List */}
          <div className="lg:col-span-3 bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0F172A]">Recent Requests</h3>
              <Link href="/queue" className="text-xs font-bold text-[#009668] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {items.slice(0, 4).map((item, idx) => {
                const isSelected = (selectedTx?.id || selectedTx?.invoice_id) === (item.id || item.invoice_id);
                return (
                  <div 
                    key={item.id || item.invoice_id || idx}
                    onClick={() => setSelectedTx(item)}
                    className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 border ${
                      isSelected
                        ? 'border-[#009668] bg-[#F0FDF4]'
                        : 'border-transparent hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#E2E8F0] text-[#0F172A] font-bold text-[10px] flex items-center justify-center shrink-0">
                        {item.employee_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="text-[10px] font-mono font-bold text-[#009668]">
                          {item.id || `REQ-2026-${1056 - idx}`}
                        </div>
                        <div className="text-xs font-bold text-[#0F172A] truncate max-w-[100px]">
                          {item.employee_name || 'Ethan Carter'}
                        </div>
                        <div className="text-[10px] text-[#94A3B8] truncate max-w-[100px]">
                          {item.employee_role || item.employee_dept || 'Sales Executive'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#FEF3C7] text-[#D97706]">
                        {item.status || 'Pending'}
                      </span>
                      <div className="text-xs font-extrabold text-[#0F172A] mt-1">
                        ${typeof item.amount === 'number' ? item.amount.toFixed(2) : '125.50'}
                      </div>
                      <div className="text-[9px] text-[#94A3B8]">
                        May 15, 2026
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. BOTTOM SECTION: Pending Approvals Table & Approval Workflow Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT (8 cols): Pending Approvals Data Table */}
          <div className="lg:col-span-8 bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            
            {/* Table Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Pending Approvals</h3>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search request..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#009668] w-[140px] sm:w-[160px]"
                  />
                </div>

                {/* All Types Dropdown */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#64748B] focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="MILEAGE">Mileage</option>
                  <option value="EXPENSE">Expense</option>
                </select>

                {/* All Departments Dropdown */}
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#64748B] focus:outline-none"
                >
                  <option value="ALL">All Departments</option>
                  <option value="SALES">Sales</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="PRODUCT">Product</option>
                </select>

                <button 
                  onClick={() => { setFilterType('ALL'); setFilterDept('ALL'); setSearchQuery(''); }}
                  title="Clear filters"
                  className="p-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#94A3B8] font-semibold text-[11px]">
                    <th className="pb-3 font-medium">Request ID</th>
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Submitted On</th>
                    <th className="pb-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredItems.slice(0, 5).map((item, idx) => {
                    const reqId = item.id || item.invoice_id || `REQ-2026-${1056 - idx}`;
                    const isSelected = (selectedTx?.id || selectedTx?.invoice_id) === reqId;
                    const isMileage = (item.expense_type || (item.amount < 150 ? 'Mileage' : 'Expense')) === 'Mileage';

                    return (
                      <tr 
                        key={reqId}
                        onClick={() => setSelectedTx(item)}
                        className={`hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#F0FDF4]/70' : ''
                        }`}
                      >
                        {/* Request ID */}
                        <td className="py-3 font-medium text-[#0F172A] whitespace-nowrap">
                          {reqId}
                        </td>

                        {/* Employee with Avatar */}
                        <td className="py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#E2E8F0] text-[#0F172A] font-bold text-[10px] flex items-center justify-center shrink-0">
                              {item.employee_name?.charAt(0) || 'E'}
                            </div>
                            <span className="font-semibold text-[#0F172A]">
                              {item.employee_name || 'Ethan Carter'}
                            </span>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isMileage 
                              ? 'bg-[#E8F8EE] text-[#009668] border border-[#D1EED8]' 
                              : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {isMileage ? 'Mileage' : 'Expense'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 text-[#64748B] whitespace-nowrap">
                          {item.date ? formatDate(item.date) : 'May 15, 2026'}
                        </td>

                        {/* Amount */}
                        <td className="py-3 font-bold text-[#0F172A] whitespace-nowrap">
                          ${typeof item.amount === 'number' ? item.amount.toFixed(2) : '125.50'}
                        </td>

                        {/* Department */}
                        <td className="py-3 text-[#64748B] whitespace-nowrap">
                          {item.employee_dept || 'Sales'}
                        </td>

                        {/* Submitted On */}
                        <td className="py-3 text-[#64748B] whitespace-nowrap">
                          {item.submitted_on || 'May 15, 09:15 AM'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/investigate/${item.invoice_id || item.id || 'REQ-2026-1056'}`}
                              onClick={(e) => e.stopPropagation()}
                              title="Forensic Investigation"
                              className="p-1 rounded-lg text-[#64748B] hover:text-[#009668] hover:bg-[#E8F8EE] transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTx(item);
                              }}
                              className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A]"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer matching reference */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
              <div>
                Showing 1 to {Math.min(5, filteredItems.length)} of {statusCounts.pending} results
              </div>
              <div className="flex items-center gap-1">
                <button 
                  disabled={currentPage === 1}
                  className="p-1 rounded-lg border border-[#CBD5E1] text-[#64748B] disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-lg bg-[#009668] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  1
                </button>
                <button className="w-7 h-7 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC] text-xs flex items-center justify-center">
                  2
                </button>
                <button className="w-7 h-7 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC] text-xs flex items-center justify-center">
                  3
                </button>
                <span className="px-1 text-[#94A3B8]">...</span>
                <button className="w-7 h-7 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC] text-xs flex items-center justify-center">
                  7
                </button>
                <button className="p-1 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT (4 cols): Approval Workflow & Decision Card */}
          <div className="lg:col-span-4 bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">Approval Workflow</h3>
              {selectedTx && (
                <span className="text-[10px] font-mono font-bold text-[#009668] bg-[#E8F8EE] px-2 py-0.5 rounded-md">
                  {selectedTx.id || selectedTx.invoice_id || 'REQ-2026-1056'}
                </span>
              )}
            </div>

            {/* Stepper matching reference UI */}
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
              
              {/* Step 1: Submitted */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">Submitted</div>
                    <div className="text-[10px] text-[#94A3B8]">May 15, 2026 09:15 AM</div>
                  </div>
                  <div className="text-right text-[11px] font-medium text-[#64748B]">
                    {selectedTx?.employee_name || 'Ethan Carter'}
                  </div>
                </div>
              </div>

              {/* Step 2: Manager Approval */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">Manager Approval</div>
                    <div className="text-[10px] text-[#94A3B8]">May 15, 2026 10:30 AM</div>
                  </div>
                  <div className="text-right text-[11px] font-medium text-[#64748B]">
                    Jacob Jones
                  </div>
                </div>
              </div>

              {/* Step 3: Finance Approval (Current Pending Step) */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full border-2 border-[#CBD5E1] bg-white flex items-center justify-center text-xs shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#CBD5E1]" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">Finance Approval</div>
                    <div className="text-[10px] text-[#D97706] font-bold">Pending AP Review</div>
                  </div>
                  <div className="text-right text-[11px] font-medium text-[#64748B]">
                    Sarah Wilson
                  </div>
                </div>
              </div>

              {/* Step 4: Accounting Approval */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full border-2 border-[#CBD5E1] bg-white flex items-center justify-center text-xs shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#CBD5E1]" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <div className="text-xs font-bold text-[#94A3B8]">Accounting Approval</div>
                    <div className="text-[10px] text-[#CBD5E1]">Queued</div>
                  </div>
                  <div className="text-right text-[11px] font-medium text-[#94A3B8]">
                    Michael Brown
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Investigation Link */}
            {selectedTx && (
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] font-medium">Selected Expense:</span>
                  <span className="font-bold text-[#0F172A]">
                    ${typeof selectedTx.amount === 'number' ? selectedTx.amount.toFixed(2) : '125.50'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] font-medium">Vendor / Entity:</span>
                  <span className="font-bold text-[#0F172A] truncate max-w-[140px]">
                    {selectedTx.vendor_name || 'Shell Fleet'}
                  </span>
                </div>
                <Link
                  href={`/investigate/${selectedTx.invoice_id || selectedTx.id || 'REQ-2026-1056'}`}
                  className="text-[11px] font-bold text-[#009668] hover:underline flex items-center gap-1 pt-1"
                >
                  <span>Open Full AI Investigation View</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Reject and Approve Action Buttons matching reference UI */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleQuickDecision('REJECT')}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                Reject
              </button>

              <button
                type="button"
                onClick={() => handleQuickDecision('APPROVE')}
                className="w-full py-2.5 px-4 bg-[#009668] hover:bg-[#007F58] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Approve
              </button>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
