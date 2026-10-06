'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight, ExternalLink, ChevronDown, Check, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { UserRole, ALL_ROLES, ROLE_CONFIGS } from '@/types/auth';

export function TopBar() {
  const pathname = usePathname();
  const { user, role, roleConfig, switchRole } = useAuth();
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
    if (pathname.startsWith('/dashboard')) return 'Executive Risk Dashboard';
    if (pathname.startsWith('/queue')) return 'Exception Review Queue';
    if (pathname.startsWith('/audit')) return 'Cryptographic Audit Ledger';
    if (pathname.startsWith('/investigate')) return 'Forensic Investigation';
    return 'Console';
  };

  return (
    <header className="h-14 flex items-center justify-between px-8 bg-white border-b border-slate-200 flex-shrink-0 z-30">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Link href="/" className="text-slate-400 hover:text-indigo-600 transition-colors">
            SENTINEL
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[#0F172A] font-semibold">{getPageTitle()}</span>
        </div>

        <span className="text-slate-200">|</span>

        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Solana Layer Live</span>
        </div>
      </div>

      {/* Right: RBAC Role Switcher & User Profile */}
      <div className="flex items-center gap-4">
        {/* Role Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-full transition-all cursor-pointer group"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-xs ${
              role === 'FINANCE MANAGER'
                ? 'bg-indigo-600'
                : role === 'AUDITOR'
                ? 'bg-emerald-600'
                : 'bg-sky-600'
            }`}>
              {user.name.charAt(0)}
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#0F172A] leading-none">
                  {user.name}
                </span>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${roleConfig.badgeClasses.bg} ${roleConfig.badgeClasses.text} ${roleConfig.badgeClasses.border}`}>
                  {role === 'AP / FINANCE REVIEWER' ? 'AP REVIEWER' : role === 'FINANCE MANAGER' ? 'MANAGER' : 'AUDITOR'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {roleConfig.department}
              </div>
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Role Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Role (RBAC)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Select role to test permissions and segregation of duties:
                </div>
              </div>

              <div className="p-1.5 space-y-1">
                {ALL_ROLES.map((roleKey) => {
                  const cfg = ROLE_CONFIGS[roleKey];
                  const isCurrent = roleKey === role;

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => {
                        switchRole(roleKey);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-50/70 border border-indigo-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.badgeClasses.indicator}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {cfg.title}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/60 px-1.5 py-0.5 rounded">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          {cfg.defaultUser.name} · {cfg.department}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          {cfg.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Active Org: <strong className="text-slate-700">{user.organization}</strong></span>
                <span className="font-mono text-[9px] text-slate-400">3-Role Matrix</span>
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <span>Landing Page</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </header>
  );
}
