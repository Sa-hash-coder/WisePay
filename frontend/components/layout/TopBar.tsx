'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ChevronDown, Check, ShieldCheck, ShieldAlert, Sparkles, Bell, Search, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { UserRole, ALL_ROLES, ROLE_CONFIGS } from '@/types/auth';

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, roleConfig, switchRole, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (pathname.startsWith('/originator')) return 'The Originator • Invoicing & Receipts';
    if (pathname.startsWith('/queue')) return 'AP Reviewer • The Exception Pile';
    if (pathname.startsWith('/audit')) return 'Compliance Auditor • Audit Trail';
    if (pathname.startsWith('/dashboard')) return role === 'AUDITOR' ? 'Auditor Overview' : role === 'AP / FINANCE REVIEWER' ? 'AP Reviewer • Exception Dashboard' : 'Operational Dashboard';
    if (pathname.startsWith('/entities')) return 'Vendors & Employee Profiles';
    if (pathname.startsWith('/investigate')) return 'Forensic Investigation';
    return 'Console';
  };

  const handleRoleSelect = (r: UserRole) => {
    switchRole(r);
    setDropdownOpen(false);
    // Route directly to each role's primary workspace
    if (r === 'THE ORIGINATOR') {
      router.push('/originator');
    } else if (r === 'AP / FINANCE REVIEWER') {
      router.push('/dashboard');
    } else if (r === 'AUDITOR') {
      router.push('/audit');
    } else {
      router.push('/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-[#E2ECE4] flex-shrink-0 z-30">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Link href="/" className="text-[#94A3B8] hover:text-[#16A34A] transition-colors">
            WisePay
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
          <span className="text-[#0F172A] font-semibold">{getPageTitle()}</span>
        </div>
      </div>

      {/* Right: RBAC Role Switcher & User Profile */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 bg-[#F3F8F4] hover:bg-[#E8F8EE] border border-[#E2ECE4] hover:border-[#D1EED8] rounded-full transition-all cursor-pointer group"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs ${
              role === 'THE ORIGINATOR'
                ? 'bg-[#2563EB]'
                : role === 'AUDITOR'
                ? 'bg-[#D97706]'
                : 'bg-[#0D9488]'
            }`}>
              {user.name.charAt(0)}
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#0F172A] leading-none">
                  {user.name}
                </span>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${roleConfig.badgeClasses.bg} ${roleConfig.badgeClasses.text} ${roleConfig.badgeClasses.border}`}>
                  {role === 'THE ORIGINATOR' ? 'ORIGINATOR' : role === 'AP / FINANCE REVIEWER' ? 'AP REVIEWER' : 'AUDITOR'}
                </span>
              </div>
              <div className="text-[10px] text-[#64748B] leading-tight">
                {roleConfig.department}
              </div>
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0F172A] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Role Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-88 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-[#E2ECE4] py-2 z-50 animate-fade-in-up">
              <div className="px-4 py-2.5 border-b border-[#EAEFEA]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Switch Active Role (RBAC)
                </div>
                <div className="text-xs text-[#64748B] mt-0.5">
                  Switches user persona and automatically opens their designated panel:
                </div>
              </div>

              <div className="p-2 space-y-1">
                {ALL_ROLES.map((r) => {
                  const isSelected = r === role;
                  const cfg = ROLE_CONFIGS[r];
                  return (
                    <button
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#E8F8EE] border border-[#D5EFE0]'
                          : 'hover:bg-[#F3F8F4]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        r === 'THE ORIGINATOR'
                          ? 'bg-[#2563EB] text-white'
                          : r === 'AUDITOR'
                          ? 'bg-[#D97706] text-white'
                          : 'bg-[#0D9488] text-white'
                      }`}>
                        {r === 'AUDITOR' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                            {r}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#16A34A]" />}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">
                          {r === 'THE ORIGINATOR'
                            ? 'Opens Unified Ingestion & Bulk Enterprise Batch Simulator'
                            : r === 'AP / FINANCE REVIEWER'
                            ? 'Opens The Exception Pile (Only Flagged Rows: Approve/Reject/Escalate)'
                            : 'Opens Cryptographic Audit Trail (90% Auto-Passed vs Exceptions)'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Logout Option in Dropdown */}
              <div className="p-2 border-t border-[#EAEFEA]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#DC2626]" />
                  <span>Log out of session</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Universal Logout Button - Always visible at exact same location for all roles */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#64748B] hover:text-[#DC2626] bg-[#F3F8F4] hover:bg-[#FEF2F2] border border-[#E2ECE4] hover:border-[#FECACA] rounded-full transition-all cursor-pointer shadow-xs"
          title="Sign out of WisePay"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
