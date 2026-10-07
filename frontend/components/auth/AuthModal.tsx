'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Lock, 
  Mail, 
  Shield, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  UserCheck, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  EyeOff, 
  FileSpreadsheet, 
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole, ALL_ROLES, ROLE_CONFIGS } from '@/types/auth';
import { Logo } from '@/components/shared/Logo';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  mode?: 'login' | 'signup';
  onModeChange?: (mode: 'login' | 'signup') => void;
  onSuccess?: (user: { name: string; email: string; role: UserRole; organization?: string }) => void;
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  defaultMode = 'login', 
  mode: controlledMode, 
  onModeChange, 
  onSuccess 
}: AuthModalProps) {
  const { switchRole, setUserProfile, loginWithCredentials } = useAuth();
  
  // Controlled or uncontrolled mode support
  const [internalMode, setInternalMode] = useState<'login' | 'signup'>(defaultMode);
  const activeMode = controlledMode ?? internalMode;

  const handleSetMode = (newMode: 'login' | 'signup') => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
    setErrorMessage(null);
  };

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('Acme Global Corp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('AP / FINANCE REVIEWER');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Prevent background layout shift and scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const fullName = firstName.trim() && lastName.trim() 
      ? `${firstName.trim()} ${lastName.trim()}`
      : firstName.trim() || (email.split('@')[0] ? email.split('@')[0].replace('.', ' ').toUpperCase() : ROLE_CONFIGS[selectedRole].defaultUser.name);

    if (activeMode === 'login') {
      const loginRes = await loginWithCredentials(email, password);
      if (loginRes.success) {
        setSuccessMessage(`Welcome back! Authenticated with enterprise session.`);
        setTimeout(() => {
          if (onSuccess) onSuccess({ name: email.split('@')[0], email, role: selectedRole, organization: orgName });
          onClose();
          setSuccessMessage(null);
        }, 500);
      } else {
        const userProfile = {
          name: fullName,
          email: email || ROLE_CONFIGS[selectedRole].defaultUser.email,
          role: selectedRole,
          organization: orgName || 'Global Enterprise Corp',
        };
        setUserProfile(userProfile);
        setSuccessMessage(`Signed in as ${userProfile.name}`);
        setTimeout(() => {
          if (onSuccess) onSuccess(userProfile);
          onClose();
          setSuccessMessage(null);
        }, 500);
      }
    } else {
      const userProfile = {
        name: fullName,
        email: email || ROLE_CONFIGS[selectedRole].defaultUser.email,
        role: selectedRole,
        organization: orgName || 'Global Enterprise Corp',
      };
      setUserProfile(userProfile);
      setSuccessMessage(`Account created for ${userProfile.name}`);
      setTimeout(() => {
        if (onSuccess) onSuccess(userProfile);
        onClose();
        setSuccessMessage(null);
      }, 500);
    }
    setLoading(false);
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setLoading(true);
    setErrorMessage(null);
    const cfg = ROLE_CONFIGS[role];

    const loginRes = await loginWithCredentials(cfg.defaultUser.email, 'SecretPass123!');
    if (!loginRes.success) {
      switchRole(role);
    }
    setSuccessMessage(`Signed in as ${cfg.defaultUser.name} (${cfg.title})`);
    setTimeout(() => {
      if (onSuccess) onSuccess(cfg.defaultUser);
      onClose();
      setSuccessMessage(null);
      setLoading(false);
    }, 450);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden z-10 my-auto"
          >
            {/* 2-Column Split Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
              
              {/* LEFT COLUMN: Enterprise Overview */}
              <div className="md:col-span-5 bg-gradient-to-br from-[#0B2C1E] via-[#0F3826] to-[#081F15] p-8 lg:p-9 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

                <div className="relative z-10 space-y-6">
                  {/* Brand Header */}
                  <div className="flex items-center gap-2.5">
                    <Logo size={36} showText subtitle="Enterprise AP Platform" variant="light" />
                  </div>

                  {/* Headline & Description */}
                  <div className="space-y-2.5">
                    <h2 className="text-2xl lg:text-[26px] font-bold tracking-tight text-white leading-tight">
                      Autonomous AP with <span className="text-emerald-300">Explainable Intelligence</span>
                    </h2>
                    <p className="text-xs text-emerald-100/80 leading-relaxed font-normal">
                      Streamline invoice intake, handle policy exceptions with clear citations, and maintain an immutable audit trail.
                    </p>
                  </div>

                  {/* Value Highlights */}
                  <div className="space-y-3.5 pt-1">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-emerald-300 border border-white/10 mt-0.5">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs text-white/90 leading-tight">
                        <span className="font-semibold text-white block">Intake &amp; Bulk Uploads</span>
                        <span className="text-[11px] text-emerald-100/70">Single receipts or enterprise CSV batches.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-emerald-300 border border-white/10 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs text-white/90 leading-tight">
                        <span className="font-semibold text-white block">Autonomous Verification</span>
                        <span className="text-[11px] text-emerald-100/70">Up to 90% of compliant invoices auto-cleared.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-emerald-300 border border-white/10 mt-0.5">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs text-white/90 leading-tight">
                        <span className="font-semibold text-white block">Explainable Exception Queue</span>
                        <span className="text-[11px] text-emerald-100/70">Flagged rows include clear policy explanations.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-emerald-300 border border-white/10 mt-0.5">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs text-white/90 leading-tight">
                        <span className="font-semibold text-white block">Cryptographic Governance</span>
                        <span className="text-[11px] text-emerald-100/70">SHA-256 ledger recording every action.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Assurance */}
                <div className="relative z-10 pt-5 mt-5 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-emerald-200/90 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>SOC 2 Type II · SOX 404 Compliant</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/60 leading-normal">
                    Strict segregation of duties enforced across Originator, AP Reviewer, and Auditor roles.
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: Authentication Form */}
              <div className="md:col-span-7 p-8 lg:p-9 flex flex-col justify-between relative bg-white">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-5">
                  {/* Form Header with Segmented Switcher */}
                  <div className="space-y-3 pr-8">
                    <div className="flex items-center justify-between">
                      <div className="flex p-1 bg-slate-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleSetMode('login')}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeMode === 'login'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetMode('signup')}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeMode === 'signup'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Create Account
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                        {activeMode === 'signup' 
                          ? 'Create your organization account' 
                          : 'Sign in to WisePay'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {activeMode === 'signup'
                          ? 'Set up your finance workspace with role-based controls.'
                          : 'Enter your credentials to access your finance workspace.'}
                      </p>
                    </div>
                  </div>

                  {/* Success State */}
                  {successMessage ? (
                    <div className="py-14 flex flex-col items-center justify-center text-center gap-3 animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-semibold text-slate-900">{successMessage}</h4>
                      <p className="text-xs text-slate-500">Redirecting to designated workspace...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Error Alert */}
                      {errorMessage && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600 font-medium">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      {/* Quick Demo Persona Access */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Quick Demo Sign-In
                          </span>
                          <span className="text-[11px] font-medium text-emerald-600">
                            1-Click Persona Access
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          {ALL_ROLES.map((roleKey) => {
                            const cfg = ROLE_CONFIGS[roleKey];
                            return (
                              <button
                                key={roleKey}
                                type="button"
                                onClick={() => handleDemoSignIn(roleKey)}
                                disabled={loading}
                                className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-emerald-50/50 hover:border-emerald-300 text-left transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`w-2 h-2 rounded-full ${cfg.badgeClasses.indicator}`} />
                                  <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                                    {cfg.title}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {cfg.defaultUser.name}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Clean Divider */}
                      <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-3 bg-white text-slate-400 text-[11px]">
                            Or continue with work email
                          </span>
                        </div>
                      </div>

                      {/* SIGNUP FIELDS: First Name & Last Name */}
                      {activeMode === 'signup' && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                First Name <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  value={firstName}
                                  onChange={(e) => setFirstName(e.target.value)}
                                  placeholder="Marcus"
                                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                Last Name <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  value={lastName}
                                  onChange={(e) => setLastName(e.target.value)}
                                  placeholder="Vance"
                                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Organization Name
                            </label>
                            <div className="relative">
                              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="Acme Global Corporation"
                                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Role Workspace Selector */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Role Workspace <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                            className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all appearance-none cursor-pointer"
                          >
                            {ALL_ROLES.map((roleOption) => (
                              <option key={roleOption} value={roleOption}>
                                {ROLE_CONFIGS[roleOption].title} — {ROLE_CONFIGS[roleOption].department}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Work Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-slate-700">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-medium"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showPassword ? 'Hide' : 'Show'}</span>
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Terms Disclaimer */}
                      <p className="text-[11px] text-slate-500 pt-0.5 leading-relaxed">
                        By continuing, you agree to our{' '}
                        <span className="text-emerald-600 hover:underline cursor-pointer">Terms of Service</span> and{' '}
                        <span className="text-emerald-600 hover:underline cursor-pointer">Privacy Policy</span>.
                      </p>

                      {/* Primary CTA Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>{activeMode === 'signup' ? 'Create Account' : 'Sign In to Workspace'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Footer Switcher */}
                <div className="pt-4 mt-3 border-t border-slate-100 text-center text-xs text-slate-500">
                  {activeMode === 'signup' ? (
                    <div>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleSetMode('login')}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Sign in
                      </button>
                    </div>
                  ) : (
                    <div>
                      Need an enterprise account?{' '}
                      <button
                        type="button"
                        onClick={() => handleSetMode('signup')}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Create one here
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
