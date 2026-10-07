'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  ShieldAlert, 
  LineChart, 
  BarChart3, 
  FileCheck2, 
  Building2, 
  Users, 
  SlidersHorizontal, 
  Sparkles, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Scale, 
  LogOut,
  AlertTriangle,
  GitFork
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/shared/Logo';

function SidebarNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { role, isAuditor, logout } = useAuth();
  const currentFilter = (searchParams.get('category') || searchParams.get('filter'))?.toUpperCase();
  const currentView = searchParams.get('view');
  const currentTab = searchParams.get('tab') || searchParams.get('view');

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  interface NavItem {
    href: string;
    label: string;
    icon: any;
    exactCheck?: () => boolean;
  }
  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  // Role-Specific Dynamic Navigation Configuration
  let navGroups: NavGroup[] = [];

  if (role === 'THE ORIGINATOR') {
    // Data Entry Point Workspace
    navGroups = [
      {
        title: 'DATA ENTRY & SUBMISSIONS',
        items: [
          { href: '/originator', label: 'Expense & Invoice Intake', icon: FileCheck2, exactCheck: () => pathname === '/originator' && (!searchParams.get('tab') || searchParams.get('tab') === 'single') },
          { href: '/originator?tab=batch', label: 'Bulk Batch Upload (CSV/Excel)', icon: Layers, exactCheck: () => pathname === '/originator' && searchParams.get('tab') === 'batch' },
        ]
      }
    ];
  } else if (role === 'AP / FINANCE REVIEWER') {
    // Primary Human-in-the-Loop Exception Handling Workspace
    navGroups = [
      {
        title: 'MAIN',
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exactCheck: () => pathname === '/dashboard' },
          { href: '/queue', label: 'All Requests (Exception Pile)', icon: Layers, exactCheck: () => pathname === '/queue' && (!currentFilter || currentFilter === 'ALL') },
          { href: '/queue?category=HIGH_RISK', label: 'High-Risk Anomalies', icon: LineChart, exactCheck: () => pathname === '/queue' && currentFilter === 'HIGH_RISK' },
          { href: '/queue?category=DUPLICATES', label: 'Duplicate Invoices', icon: SlidersHorizontal, exactCheck: () => pathname === '/queue' && (currentFilter === 'DUPLICATES' || currentFilter === 'DUPLICATE') },
          { href: '/queue?category=POLICY', label: 'Policy Limits & Split PO', icon: AlertTriangle, exactCheck: () => pathname === '/queue' && (currentFilter === 'POLICY' || currentFilter === 'POLICY_LIMIT' || currentFilter === 'POLICY_LIMITS') },
          { href: '/queue?category=MISSING_RECEIPT', label: 'Missing Receipts', icon: FileCheck2, exactCheck: () => pathname === '/queue' && (currentFilter === 'MISSING_RECEIPT' || currentFilter === 'MISSING_RECEIPTS') },
        ]
      },
      {
        title: 'MANAGEMENT & DIRECTORY',
        items: [
          { href: '/entities', label: 'Vendor & Employee Profiles', icon: Users, exactCheck: () => pathname.startsWith('/entities') },
        ]
      }
    ];
  } else if (role === 'AUDITOR') {
    // Compliance Auditor (Read-Only SOX 404 & Cryptographic Audit Console)
    navGroups = [
      {
        title: 'COMPLIANCE & AUDIT CONSOLE',
        items: [
          { href: '/audit', label: 'Audit Trails & Verification', icon: ShieldCheck, exactCheck: () => pathname === '/audit' && (!currentTab || currentTab === 'overview') },
          { href: '/audit?tab=exceptions', label: 'High-Risk Exception Pile', icon: ShieldAlert, exactCheck: () => pathname === '/audit' && currentTab === 'exceptions' },
          { href: '/audit?tab=diagram', label: 'Visual Audit Graph (Diagram)', icon: GitFork, exactCheck: () => pathname === '/audit' && currentTab === 'diagram' },
          { href: '/audit?tab=ledger', label: 'Ledger Blocks & Event Log', icon: Layers, exactCheck: () => pathname === '/audit' && currentTab === 'ledger' },
          { href: '/audit?tab=compliance', label: 'SOX 404 & Policy Controls', icon: FileCheck2, exactCheck: () => pathname === '/audit' && currentTab === 'compliance' },
          { href: '/queue', label: 'Auditor Exception Review Ledger', icon: AlertTriangle, exactCheck: () => pathname === '/queue' },
        ]
      },
      {
        title: 'ENTITY GOVERNANCE',
        items: [
          { href: '/entities', label: 'Vendor & Employee Profiles', icon: Users, exactCheck: () => pathname.startsWith('/entities') },
        ]
      }
    ];
  }

  return (
    <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4 flex flex-col justify-between">
      <div className="space-y-4">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              {group.title}
            </div>
            {group.items.map(({ href, label, icon: Icon, exactCheck }) => {
              const isActive = exactCheck ? exactCheck() : pathname === href;
              
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-[#009668] text-white font-semibold shadow-[0_2px_8px_rgba(0,150,104,0.25)]'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F3F8F4]'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-[#94A3B8]'
                  }`} />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Quick Actions / Sign Out */}
      <div className="pt-2 px-1 pb-1">
        <div className="border-t border-[#EAEFEA] pt-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer text-left"
            title="Log out of session"
          >
            <LogOut className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export function Sidebar() {
  const { role, roleConfig, user } = useAuth();

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col bg-white border-r border-[#E2ECE4] h-screen select-none">
      {/* Consistent WisePay Brand Logo across all roles */}
      <div className="px-5 py-5 border-b border-[#EAEFEA] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size={32} showText subtitle="Finlytics Engine" />
        </Link>
      </div>

      {/* Navigation Links wrapped in Suspense for useSearchParams */}
      <Suspense fallback={
        <div className="flex-1 px-3 py-3 text-xs text-[#94A3B8]">Loading navigation...</div>
      }>
        <SidebarNav />
      </Suspense>

      {/* Finlytics Clearance Status Card */}
      <div className="p-3 border-t border-[#EAEFEA] bg-[#FAFCFA]">
        <div className="p-3 bg-white border border-[#E2ECE4] rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase tracking-wider font-bold text-[#94A3B8]">
              Active Clearance
            </span>
            <span className={`w-2 h-2 rounded-full ${roleConfig.badgeClasses.indicator}`} />
          </div>
          <div className="text-xs font-bold text-[#0F172A] truncate">
            {user.name}
          </div>
          <div className="text-[10px] text-[#16A34A] font-medium truncate mt-0.5">
            {role === 'THE ORIGINATOR' ? 'The Originator (Data Entry)' : role === 'AP / FINANCE REVIEWER' ? 'AP Reviewer (Exception Handling)' : 'Compliance Auditor (Read-Only)'}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-2.5 px-1 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span>{role === 'AUDITOR' ? 'SOX 404 Controls' : 'System Online'}</span>
          </div>
          <span className="font-mono text-[9px] text-[#94A3B8]">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
