'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertTriangle, Activity, Shield, ArrowLeft, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { href: '/queue', label: 'Exception Queue', icon: AlertTriangle },
  { href: '/audit', label: 'Audit Ledger', icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, roleConfig, user } = useAuth();

  return (
    <aside className="w-[230px] flex-shrink-0 flex flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs group-hover:bg-indigo-700 transition-colors">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#0F172A] tracking-wide">SENTINEL</div>
            <div className="text-[10px] text-slate-400 tracking-wider">RISK INTELLIGENCE</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Workspaces
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}

        <div className="pt-4 px-3">
          <div className="border-t border-slate-100 pt-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Landing Page</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Role Clearance Status Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
              Clearance Level
            </span>
            <span className={`w-2 h-2 rounded-full ${roleConfig.badgeClasses.indicator}`} />
          </div>
          <div className="text-xs font-bold text-[#0F172A] truncate">
            {role === 'AP / FINANCE REVIEWER' ? 'AP Reviewer' : role === 'FINANCE MANAGER' ? 'Finance Manager' : 'Auditor'}
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">
            {roleConfig.department.split('&')[0]}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-3 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Ledger & AI Online</span>
        </div>
        <div className="text-[10px] text-slate-400 px-1 font-mono">Block #284,910,240</div>
      </div>
    </aside>
  );
}
