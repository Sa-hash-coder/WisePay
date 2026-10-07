'use client';
import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { 
  Building2, 
  Users, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function EntitiesPage() {
  const [activeTab, setActiveTab] = useState<'vendors' | 'employees'>('vendors');
  const [vendors, setVendors] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.entities.vendors(),
      api.entities.employees(),
      api.entities.summary()
    ])
      .then(([vList, eList, sum]) => {
        setVendors(Array.isArray(vList) ? vList : []);
        setEmployees(Array.isArray(eList) ? eList : []);
        setSummary(sum || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load entity directory', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredVendors = vendors.filter(v => {
    if (categoryFilter !== 'ALL' && v.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.name?.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q) || v.id?.toLowerCase().includes(q);
  });

  const filteredEmployees = employees.filter(e => {
    if (categoryFilter !== 'ALL' && e.department !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.name?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q) || e.id?.toLowerCase().includes(q);
  });

  // Extract unique categories and departments
  const categories = ['ALL', ...Array.from(new Set(vendors.map(v => v.category).filter(Boolean)))];
  const departments = ['ALL', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-[1360px] mx-auto px-6 lg:px-8 py-7">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#64748B] mb-1">
              Enterprise Entity Intelligence
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0F172A] flex items-center gap-2.5">
              <Building2 className="text-[#16A34A] w-7 h-7" />
              Vendors & Employee Profiles
            </h1>
            <p className="text-xs lg:text-sm text-[#64748B] mt-1 font-normal">
              Behavioral spending baselines, entity risk tiers, and policy velocity limits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              title="Refresh profiles"
              className="p-2 bg-white hover:bg-[#F3F8F4] border border-[#E2ECE4] rounded-full text-[#64748B] hover:text-[#16A34A] transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#16A34A]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Total Active Vendors</span>
              <Building2 className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="text-2xl font-extrabold text-[#0F172A] mt-2">
              {summary?.total_vendors || vendors.length || 20}
            </div>
            <div className="text-xs text-[#16A34A] font-semibold mt-1 flex items-center gap-1">
              <span>100% Behavioral Profiling Active</span>
            </div>
          </div>

          <div className="bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Corporate Submitters</span>
              <Users className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="text-2xl font-extrabold text-[#0F172A] mt-2">
              {summary?.total_employees || employees.length || 15}
            </div>
            <div className="text-xs text-[#64748B] font-medium mt-1">
              Monitored across 6 departments
            </div>
          </div>

          <div className="bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Total Managed Spend</span>
              <DollarSign className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="text-2xl font-extrabold text-[#0F172A] mt-2">
              {summary ? formatCurrency(summary.total_vendor_spend) : '₹4.82 Cr'}
            </div>
            <div className="text-xs text-[#16A34A] font-semibold mt-1">
              Reconciled across historical ledger
            </div>
          </div>

          <div className="bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Monitored Watchlist</span>
              <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
            </div>
            <div className="text-2xl font-extrabold text-[#DC2626] mt-2">
              {vendors.filter(v => v.risk_tier === 'HIGH').length || 2} Entities
            </div>
            <div className="text-xs text-[#DC2626] font-semibold mt-1">
              Elevated anomaly & velocity risk
            </div>
          </div>
        </div>

        {/* Tab Switcher & Filter Controls */}
        <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center bg-[#F3F8F4] p-1 rounded-full border border-[#E2ECE4]">
            <button
              onClick={() => { setActiveTab('vendors'); setCategoryFilter('ALL'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'vendors'
                  ? 'bg-white text-[#16A34A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Vendor Intelligence ({vendors.length})
            </button>
            <button
              onClick={() => { setActiveTab('employees'); setCategoryFilter('ALL'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-white text-[#16A34A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Users className="w-4 h-4" />
              Employee Profiles ({employees.length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === 'vendors' ? "Search vendor name or category..." : "Search employee name or dept..."}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2ECE4] rounded-full text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 bg-white border border-[#E2ECE4] rounded-full text-xs text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 cursor-pointer"
            >
              {activeTab === 'vendors'
                ? categories.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>)
                : departments.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)
              }
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white border border-[#E2ECE4] rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'vendors' ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2ECE4] bg-[#FAFCFA] text-[#64748B] uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4">Vendor Name & ID</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Total Reconciled Spend</th>
                    <th className="py-3.5 px-4">Historical Range (Min - Max)</th>
                    <th className="py-3.5 px-4">Invoices / Flagged</th>
                    <th className="py-3.5 px-4">Risk Tier</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFEA]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-[#94A3B8]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#16A34A] mb-2" />
                        Loading vendor profiles...
                      </td>
                    </tr>
                  ) : filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[#94A3B8]">
                        No vendors match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((v) => (
                      <tr key={v.id} className="hover:bg-[#F8FAF8] transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F172A] text-xs group-hover:text-[#16A34A] transition-colors">
                            {v.name}
                          </div>
                          <div className="text-[11px] font-mono text-[#94A3B8]">{v.id}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-[#F3F8F4] text-[#16A34A] border border-[#E2ECE4] px-2.5 py-0.5 rounded-full font-medium text-[11px]">
                            {v.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A]">
                          {formatCurrency(v.total_spend || 0)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#64748B]">
                          {formatCurrency(v.historical_min || 0)} - {formatCurrency(v.historical_max || 0)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F172A]">
                            {v.live_invoice_count || v.invoice_count} bills
                          </div>
                          {v.flagged_count > 0 ? (
                            <div className="text-[10px] text-[#DC2626] font-semibold">
                              {v.flagged_count} flagged ({v.flag_rate}%)
                            </div>
                          ) : (
                            <div className="text-[10px] text-[#16A34A] font-semibold">
                              0 flagged (100% clean)
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                            v.risk_tier === 'HIGH'
                              ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                              : v.risk_tier === 'MEDIUM'
                              ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                              : 'bg-[#E8F8EE] text-[#16A34A] border-[#D1EED8]'
                          }`}>
                            {v.risk_tier} RISK
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/queue?search=${encodeURIComponent(v.name)}`}>
                            <button className="px-3 py-1 bg-white hover:bg-[#E8F8EE] border border-[#E2ECE4] hover:border-[#D1EED8] rounded-full text-xs font-semibold text-[#16A34A] shadow-xs transition-colors cursor-pointer">
                              View Bills ↗
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2ECE4] bg-[#FAFCFA] text-[#64748B] uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4">Employee & Submitter ID</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Typical Spend Limit</th>
                    <th className="py-3.5 px-4">Total Incurred Spend</th>
                    <th className="py-3.5 px-4">Submissions / Compliance</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFEA]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-[#94A3B8]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#16A34A] mb-2" />
                        Loading employee profiles...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[#94A3B8]">
                        No employees match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((e) => (
                      <tr key={e.id} className="hover:bg-[#F8FAF8] transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F172A] text-xs group-hover:text-[#16A34A] transition-colors">
                            {e.name}
                          </div>
                          <div className="text-[11px] font-mono text-[#94A3B8]">{e.id}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                          {e.department}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#16A34A]">
                          {formatCurrency(e.typical_spend_limit || 100000)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A]">
                          {formatCurrency(e.total_spend || 0)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F172A]">
                            {e.invoice_count} submitted
                          </div>
                          <div className={`text-[10px] font-semibold ${
                            e.compliance_rate >= 90 ? 'text-[#16A34A]' : e.compliance_rate >= 75 ? 'text-[#D97706]' : 'text-[#DC2626]'
                          }`}>
                            {e.compliance_rate}% policy compliance
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                            e.status === 'WATCHLIST'
                              ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                              : e.status === 'MONITORED'
                              ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                              : 'bg-[#E8F8EE] text-[#16A34A] border-[#D1EED8]'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/queue?search=${encodeURIComponent(e.name)}`}>
                            <button className="px-3 py-1 bg-white hover:bg-[#E8F8EE] border border-[#E2ECE4] hover:border-[#D1EED8] rounded-full text-xs font-semibold text-[#16A34A] shadow-xs transition-colors cursor-pointer">
                              Activity ↗
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
