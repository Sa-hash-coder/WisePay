'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, Shield, User, ArrowRight, CheckCircle2, Building2, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole, ALL_ROLES, ROLE_CONFIGS } from '@/types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  onSuccess?: (user: { name: string; email: string; role: UserRole; organization?: string }) => void;
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login', onSuccess }: AuthModalProps) {
  const { switchRole, setUserProfile } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [orgName, setOrgName] = useState('Acme Global Corp');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('AP / FINANCE REVIEWER');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync mode if defaultMode changes on open
  if (!isOpen) {
    if (successMessage) setSuccessMessage(null);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const userProfile = {
        name: name || (email.split('@')[0] ? email.split('@')[0].replace('.', ' ').toUpperCase() : ROLE_CONFIGS[selectedRole].defaultUser.name),
        email: email || ROLE_CONFIGS[selectedRole].defaultUser.email,
        role: selectedRole,
        organization: orgName || 'Global Enterprise Corp',
      };

      setUserProfile(userProfile);
      setSuccessMessage(mode === 'login' ? `Welcome back, ${userProfile.name}` : `Organization registered for ${userProfile.name}`);

      setTimeout(() => {
        if (onSuccess) onSuccess(userProfile);
        onClose();
        setSuccessMessage(null);
      }, 700);
    }, 500);
  };

  const handleDemoSignIn = (role: UserRole) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      switchRole(role);
      const cfg = ROLE_CONFIGS[role];
      setSuccessMessage(`Logged in as ${cfg.defaultUser.name} (${cfg.title})`);
      setTimeout(() => {
        if (onSuccess) onSuccess(cfg.defaultUser);
        onClose();
        setSuccessMessage(null);
      }, 500);
    }, 350);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
          >
            {/* Header pattern bar */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

            <div className="p-6">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Logo / Badge */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A] tracking-tight">SENTINEL RBAC Access</h3>
                  <p className="text-xs text-slate-500">Enterprise Accounts Payable Risk & Governance</p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex p-1 bg-slate-100 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Login your organization
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Register your organization
                </button>
              </div>

              {successMessage ? (
                <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#0F172A]">{successMessage}</h4>
                  <p className="text-xs text-slate-500">Routing to authorized workspace...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Quick Demo Access - Exactly the 3 Roles */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        1-Click Role Login (Demo Clearance)
                      </span>
                      <span className="text-[10px] text-indigo-600 font-medium">3 Authorized Roles</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {ALL_ROLES.map((roleKey) => {
                        const cfg = ROLE_CONFIGS[roleKey];
                        return (
                          <button
                            key={roleKey}
                            type="button"
                            onClick={() => handleDemoSignIn(roleKey)}
                            disabled={loading}
                            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all text-left group"
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-2 h-2 rounded-full ${cfg.badgeClasses.indicator}`} />
                              <span className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                                {cfg.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium truncate">
                              {cfg.defaultUser.name}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate mt-0.5">
                              {cfg.department.split('&')[0]}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-slate-400 uppercase tracking-wider text-[10px]">
                        Or Sign In With Enterprise Credentials
                      </span>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Organization / Company Name
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="e.g. Acme Financial Group"
                            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Marcus Vance"
                            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Role Assignment Dropdown / Selector - Exactly 3 Roles */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Assigned Organizational Role
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                        {ALL_ROLES.map((roleOption) => (
                          <option key={roleOption} value={roleOption}>
                            {roleOption} — {ROLE_CONFIGS[roleOption].department}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {ROLE_CONFIGS[selectedRole].description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Enterprise Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{mode === 'login' ? 'Login your organization' : 'Register your organization'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                SOX 404 & SOC2 Segregation of Duties Enforced
              </span>
              <span className="font-mono text-[10px] text-slate-400">RBAC-v1.0</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
