'use client';
import { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Lock, 
  Cpu, 
  ChevronRight, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  FileText, 
  ExternalLink,
  Search,
  Check,
  Zap,
  TrendingDown,
  Clock,
  Database,
  Building2,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  GitFork,
  LineChart,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { ReceiptScannerHero } from '@/components/landing/ReceiptScannerHero';
import { useRouter } from 'next/navigation';

import { UserRole } from '@/types/auth';
import { Logo } from '@/components/shared/Logo';

export default function LandingPage() {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [emailInput, setEmailInput] = useState('');
  const [activeFeatureTab, setActiveFeatureTab] = useState<'duplicate' | 'behavioral' | 'policy' | 'blockchain'>('duplicate');

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user?: { role?: UserRole }) => {
    const role = user?.role;
    if (role === 'THE ORIGINATOR') {
      router.push('/originator');
    } else if (role === 'AP / FINANCE REVIEWER') {
      router.push('/dashboard');
    } else if (role === 'AUDITOR') {
      router.push('/audit');
    } else {
      router.push('/dashboard');
    }
  };

  const coreFeatures = [
    {
      icon: Zap,
      badge: '88.2% ZERO-TOUCH',
      title: 'Autonomous Invoice Triage',
      description: 'Clears compliant, low-risk invoices instantly without human review bottlenecks while maintaining a 100% cryptographic ledger.',
      tag: 'Speed: <45ms',
      linkText: 'Test in Dashboard',
      linkHref: '/dashboard'
    },
    {
      icon: GitFork,
      badge: 'RADAR FUZZY MATCH',
      title: 'Duplicate & Near-Duplicate Radar',
      description: 'Scans both exact PO numbers and semantic TF-IDF text similarity to catch altered numbers, split bills, and duplicate submissions.',
      tag: 'Similarity: 98.4%',
      linkText: 'Inspect Duplicate Queue',
      linkHref: '/queue'
    },
    {
      icon: LineChart,
      badge: 'STATISTICAL Z-SCORE',
      title: 'Behavioral ML Baseline Engine',
      description: 'Maintains running 6-month statistical spend profiles per supplier and employee, flagging price creep and volume surges.',
      tag: 'Variance: +2.8σ',
      linkText: 'View Behavioral Models',
      linkHref: '/dashboard'
    },
    {
      icon: SlidersHorizontal,
      badge: 'DETERMINISTIC POLICIES',
      title: 'Compliance & Split-PO Matrix',
      description: 'Enforces dual-approver rules, missing receipt flags, weekend invoice checks, and split POs designed to evade single-manager caps.',
      tag: 'Limit: ₹5,00,000 Cap',
      linkText: 'Review Policy Exceptions',
      linkHref: '/queue?filter=HIGH_RISK'
    },
    {
      icon: Lock,
      badge: 'SHA-256 SEQUENTIAL',
      title: 'Cryptographic Decision Ledger',
      description: 'Anchors every automated AI score and human review override into an immutable sequential hash chain for SOX 404 compliance.',
      tag: 'Integrity: 100% Verified',
      linkText: 'Verify Ledger Chain',
      linkHref: '/audit'
    },
    {
      icon: Sparkles,
      badge: 'WHAT-IF REMEDIATION',
      title: 'Counterfactual Remediation Engine',
      description: 'Provides submitters and managers with mathematically grounded "what would make this safe" guidance to resolve exceptions quickly.',
      tag: 'Grounded: 100% Explainable',
      linkText: 'Open Forensic Workspace',
      linkHref: '/queue'
    }
  ];

  const featurePillars = {
    duplicate: {
      badge: 'DUPLICATE RADAR',
      title: 'Intercept near-duplicate invoices before disbursement',
      description: 'Human reviewers miss altered invoice numbers (e.g. INV-1002 vs INV-1002A) and split payments across departments. WisePay scans both exact PO references and semantic TF-IDF text similarity in under 20ms.',
      bullets: [
        'Lexical and numeric fuzzy parity checks',
        'Automatic cross-department PO reference matching',
        'Stops double billing across vendor subsidiaries'
      ],
      metric: '₹38.7 Cr',
      metricLabel: 'Duplicate disbursements prevented this year',
      tagColor: 'rose',
      mockHeader: 'Near-Duplicate Discovered',
      mockInvoice: 'INV-4891-B · Apex IT Systems',
      mockDetails: '98.4% match to INV-4891-A paid 4 days ago to the same bank routing number.',
      mockStatus: 'HOLD PAYMENT'
    },
    behavioral: {
      badge: 'BEHAVIORAL ML',
      title: 'Flag statistical anomalies with Isolation Forest models',
      description: 'Vendor invoice amounts drift over time. WisePay computes a running 6-month statistical profile per supplier and employee submitter, catching price creep and abnormal spikes before approvals.',
      bullets: [
        'Z-score deviation calculated against multi-month baselines',
        'Submissions outside approved procurement windows',
        'Flags new unverified bank accounts linked to existing vendors'
      ],
      metric: '+2.8σ',
      metricLabel: 'Anomaly threshold sensitivity',
      tagColor: 'amber',
      mockHeader: 'Statistical Outlier Flagged',
      mockInvoice: 'INV-8820 · Global Logistics Corp',
      mockDetails: 'Invoice amount of ₹14,50,000 exceeds 6-month historical max (₹4,20,000) by 3.4x.',
      mockStatus: 'NEEDS REVIEW'
    },
    policy: {
      badge: 'DETERMINISTIC POLICIES',
      title: 'Enforce dual approvals and split-PO prevention rules',
      description: 'Deterministic rules check corporate compliance policies: approval matrix limits, missing receipt attachments, weekend invoice dates, and suspicious split POs designed to evade single-manager thresholds.',
      bullets: [
        'Split-PO detection: multiple invoices just under authorization caps',
        'Mandatory dual-approver routing for invoices above ₹5,00,000',
        'Automated receipt & three-way matching verification'
      ],
      metric: '88.2%',
      metricLabel: 'Invoices auto-cleared with 0 manual auditor touches',
      tagColor: 'green',
      mockHeader: 'Threshold Violation',
      mockInvoice: 'INV-9021 · Vertex Consulting',
      mockDetails: 'Two ₹4,90,000 invoices submitted 20 minutes apart to bypass the ₹5,00,000 dual-signoff policy.',
      mockStatus: 'SPLIT PO DETECTED'
    },
    blockchain: {
      badge: 'CRYPTOGRAPHIC LEDGER',
      title: 'Anchor every decision to an immutable cryptographic chain',
      description: 'External auditors and regulatory bodies demand tamper-evident proof. For every AI classification and human override, WisePay hashes the payload with SHA-256 and commits it directly to the sequential block ledger.',
      bullets: [
        'Sequential SHA-256 block hash linking (prev_hash validation)',
        'Zero possibility of retrospective ledger manipulation or collusion',
        'Instant cryptographic verification certificate for external auditors'
      ],
      metric: '100%',
      metricLabel: 'Verifiable audit ledger integrity',
      tagColor: 'emerald',
      mockHeader: 'Block #284,910,241 Sealed',
      mockInvoice: 'Ledger Sequence Block #284,910,241',
      mockDetails: 'Payload hash: 0x8f2a991c4e8b · Verified intact across consecutive ledger blocks.',
      mockStatus: 'VERIFIED IMMUTABLE'
    }
  };

  const activeData = featurePillars[activeFeatureTab];

  return (
    <div className="min-h-screen bg-[#F3F8F4] text-[#0F172A] selection:bg-[#E8F8EE] selection:text-[#16A34A] font-sans">
      {/* 1. Header / Navbar with Finlytics sage green styling */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2ECE4] shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size={38} showText subtitle="Finlytics Risk Intelligence" />
          </Link>

          {/* Navigation Links - All 4 with smooth scrolling IDs */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#64748B]">
            <a href="#how-it-works" className="hover:text-[#16A34A] transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-[#16A34A] transition-colors">
              Features
            </a>
            <a href="#simulator" className="hover:text-[#16A34A] transition-colors">
              Forensic Simulator
            </a>
            <a href="#integrations" className="hover:text-[#16A34A] transition-colors">
              ERP Integrations
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAuth('login')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#0F172A] hover:text-[#16A34A] hover:bg-[#E8F8EE] rounded-full transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#64748B]" />
              <span>Login</span>
            </button>
            <button
              onClick={() => handleOpenAuth('signup')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-full transition-all shadow-[0_4px_14px_rgba(22,163,74,0.3)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.4)] cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Open Console</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Finlytics Sage Green Theme */}
      <section className="pt-12 pb-20 lg:pt-16 lg:pb-24 overflow-hidden bg-gradient-to-b from-[#EBF5EE] via-[#F3F8F4] to-white border-b border-[#E2ECE4]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Big typography & Finlytics Highlights */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F8EE] border border-[#D1EED8] text-[#16A34A] text-xs font-bold mb-6 w-fit shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <span>Autonomous Accounts Payable Risk Intelligence</span>
              </div>

              {/* Bold Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#0F172A] tracking-tight leading-[1.1] mb-6">
                <span className="text-[#16A34A]">From rogue invoices</span> to verified cryptographic ledger entries.
              </h1>

              {/* CFO-grade Subtitle */}
              <p className="text-base lg:text-lg text-[#64748B] font-normal leading-relaxed mb-8 max-w-xl">
                The enterprise risk intelligence platform that intercepts duplicate billing, vendor price creep, and compliance breaches with real-time ML anomaly detection.
              </p>

              {/* Key Highlights with Green Circular Badge Checkmarks */}
              <div className="space-y-3.5 mb-9">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-medium text-[#0F172A]">
                    <strong className="font-bold">Autonomous triage:</strong> 88.2% of clean invoices auto-cleared with zero human touch.
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-medium text-[#0F172A]">
                    <strong className="font-bold">Duplicate radar:</strong> Catches fuzzy text, altered PO numbers, and split billing across departments.
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-medium text-[#0F172A]">
                    <strong className="font-bold">Cryptographic ledger:</strong> Every approval, rejection, and override sealed into a tamper-evident SHA-256 hash chain.
                  </span>
                </div>
              </div>

              {/* Product Exploration Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
                <a
                  href="#simulator"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold rounded-full shadow-[0_4px_16px_rgba(22,163,74,0.3)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.4)] transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Explore Risk Simulator</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-[#F3F8F4] text-[#0F172A] border border-[#E2ECE4] hover:border-[#D1EED8] text-sm font-semibold rounded-full shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  <span>See How It Works</span>
                </a>
              </div>

              {/* Trust bullet info under hero */}
              <div className="flex flex-wrap items-center gap-5 text-xs text-[#64748B] font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Immediate Controller Access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Zero ERP Installation Disruption</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>SOC2 Type II Compliant</span>
                </div>
              </div>
            </div>

            {/* Right Column: Featured Receipt Scanner Hero Visual */}
            <div className="lg:col-span-5">
              <ReceiptScannerHero />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dark Contrast Ribbon Banner */}
      <section className="bg-[#0F172A] text-white py-12 border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#4ADE80] mb-1">
                The Shift From Sampling to 100% Audit
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white max-w-xl">
                Traditional ERPs sample 5% of invoices. WisePay audits 100% before money leaves.
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full lg:w-auto">
              <div className="border-l border-slate-700 pl-4">
                <div className="text-2xl font-black text-white font-mono">₹2,847 Cr</div>
                <div className="text-xs text-slate-400">Total Audited</div>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <div className="text-2xl font-black text-[#4ADE80] font-mono">88.2%</div>
                <div className="text-xs text-slate-400">Attention Saved</div>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <div className="text-2xl font-black text-[#60A5FA] font-mono">&lt; 45ms</div>
                <div className="text-xs text-slate-400">Scoring Latency</div>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <div className="text-2xl font-black text-[#FBBF24] font-mono">0.00%</div>
                <div className="text-xs text-slate-400">Tamper Risk</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Dedicated Core Features Section (Linked to #features) */}
      <section id="features" className="py-20 bg-white border-b border-[#E2ECE4] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A] bg-[#E8F8EE] border border-[#D1EED8] px-3.5 py-1.5 rounded-full shadow-xs">
              Complete Risk Intelligence Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mt-3">
              Comprehensive AP Fraud Defense & Triage
            </h2>
            <p className="text-[#64748B] text-sm mt-2">
              Every engine layer is deterministic, explainable, and sealed into the cryptographic ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="bg-[#FAFCFA] hover:bg-white border border-[#E2ECE4] hover:border-[#16A34A] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#16A34A] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#16A34A] bg-[#E8F8EE] px-2.5 py-0.5 rounded-full border border-[#D1EED8]">
                        {feat.tag}
                      </span>
                    </div>

                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      {feat.badge}
                    </div>

                    <h3 className="text-lg font-bold text-[#0F172A] mb-2 tracking-tight group-hover:text-[#16A34A] transition-colors">
                      {feat.title}
                    </h3>

                    <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#EAEFEA] flex items-center justify-between">
                    <Link
                      href={feat.linkHref}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] hover:text-[#15803D] transition-colors"
                    >
                      <span>{feat.linkText}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Interactive Forensic Simulator Showcase (Linked to #simulator) */}
      <section id="simulator" className="py-20 bg-[#F3F8F4]/80 border-b border-[#E2ECE4] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A] bg-white border border-[#E2ECE4] px-3.5 py-1.5 rounded-full shadow-xs">
              Interactive Risk Simulator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mt-3">
              How does WisePay protect your AP operations?
            </h2>
            <p className="text-[#64748B] text-sm mt-2">
              Select an operational layer below to see how our multi-engine system catches leakages that ERPs miss.
            </p>
          </div>

          {/* Finlytics styled category pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
            <button
              onClick={() => setActiveFeatureTab('duplicate')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFeatureTab === 'duplicate'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'bg-white border border-[#E2ECE4] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E8F8EE]'
              }`}
            >
              1. Duplicate Invoice Interception
            </button>
            <button
              onClick={() => setActiveFeatureTab('behavioral')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFeatureTab === 'behavioral'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'bg-white border border-[#E2ECE4] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E8F8EE]'
              }`}
            >
              2. Behavioral ML & Variance
            </button>
            <button
              onClick={() => setActiveFeatureTab('policy')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFeatureTab === 'policy'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'bg-white border border-[#E2ECE4] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E8F8EE]'
              }`}
            >
              3. Policy Enforcement & Split-PO
            </button>
            <button
              onClick={() => setActiveFeatureTab('blockchain')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFeatureTab === 'blockchain'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'bg-white border border-[#E2ECE4] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E8F8EE]'
              }`}
            >
              4. Cryptographic Ledger
            </button>
          </div>

          {/* Interactive Feature Panel */}
          <div className="bg-white border border-[#E2ECE4] rounded-3xl p-8 lg:p-12 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Feature Content */}
              <div className="lg:col-span-7">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#16A34A] bg-[#E8F8EE] border border-[#D1EED8] px-3 py-1 rounded-full">
                  {activeData.badge}
                </span>
                <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-3 mb-3">
                  {activeData.title}
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                  {activeData.description}
                </p>

                <div className="space-y-2.5 mb-8">
                  {activeData.bullets.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-[#0F172A] font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#E8F8EE] text-[#16A34A] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#EAEFEA]">
                  <div>
                    <div className="text-2xl font-black text-[#0F172A] font-mono">{activeData.metric}</div>
                    <div className="text-xs text-[#64748B]">{activeData.metricLabel}</div>
                  </div>
                  <div className="h-8 w-px bg-[#E2ECE4]" />
                  <div className="flex items-center gap-3">
                    <Link
                      href="/queue"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803D] shadow-xs transition-colors"
                    >
                      <span>Open Review Queue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#16A34A] transition-colors"
                    >
                      <span>Executive Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Feature Simulated Output Card */}
              <div className="lg:col-span-5">
                <div className="bg-[#FAFCFA] border border-[#E2ECE4] rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#EAEFEA] pb-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Live Telemetry Output
                    </span>
                    <span className="text-xs font-bold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-0.5 rounded-full">
                      {activeData.mockStatus}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-[#64748B]">Subject Invoice</div>
                      <div className="text-sm font-bold text-[#0F172A]">{activeData.mockInvoice}</div>
                    </div>

                    <div className="bg-white border border-[#E2ECE4] rounded-xl p-3 text-xs text-[#64748B] leading-relaxed shadow-xs">
                      <div className="font-bold text-[#0F172A] mb-1">{activeData.mockHeader}:</div>
                      {activeData.mockDetails}
                    </div>

                    <div className="p-3 bg-[#E8F8EE] border border-[#D1EED8] rounded-xl flex items-center justify-between text-xs text-[#16A34A]">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                        <span>Decision Grounded</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold">100% Explainable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. End-to-End Lifecycle Flow (Linked to #how-it-works) */}
      <section id="how-it-works" className="py-20 bg-white border-t border-[#E2ECE4] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A] bg-[#E8F8EE] border border-[#D1EED8] px-3.5 py-1.5 rounded-full">
              Seamless 4-Stage Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mt-3">
              How Invoices Flow Through WisePay
            </h2>
            <p className="text-[#64748B] text-sm mt-2">
              Plugs into your enterprise ERP via REST API or batch webhook without disrupting existing accounting cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#FAFCFA] hover:bg-white border border-[#E2ECE4] rounded-2xl p-6 shadow-xs relative card-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E2ECE4] text-[#0F172A] flex items-center justify-center font-black text-sm mb-4 shadow-xs">
                01
              </div>
              <h4 className="text-base font-bold text-[#0F172A] mb-2">ERP Ingestion</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Invoices ingested from SAP, NetSuite, Oracle, or PDF scanner. Line items, PO references, and employee IDs are normalized.
              </p>
            </div>

            <div className="bg-[#FAFCFA] hover:bg-white border border-[#E2ECE4] rounded-2xl p-6 shadow-xs relative card-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#16A34A] border border-[#D1EED8] flex items-center justify-center font-black text-sm mb-4 shadow-xs">
                02
              </div>
              <h4 className="text-base font-bold text-[#0F172A] mb-2">Parallel AI Scoring</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Simultaneous scans for supplier variance, TF-IDF duplicate indexes, relationship anomalies, and corporate approval thresholds.
              </p>
            </div>

            <div className="bg-[#FAFCFA] hover:bg-white border border-[#E2ECE4] rounded-2xl p-6 shadow-xs relative card-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center justify-center font-black text-sm mb-4 shadow-xs">
                03
              </div>
              <h4 className="text-base font-bold text-[#0F172A] mb-2">Autonomous Triage</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                88% pass autonomously to payment authorization. The remaining 12% exception candidates are queued with forensic remediation steps.
              </p>
            </div>

            <div className="bg-[#FAFCFA] hover:bg-white border border-[#E2ECE4] rounded-2xl p-6 shadow-xs relative card-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#16A34A] border border-[#D1EED8] flex items-center justify-center font-black text-sm mb-4 shadow-xs">
                04
              </div>
              <h4 className="text-base font-bold text-[#0F172A] mb-2">Block Seal</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Every rating, reason, and human override is hashed with SHA-256 and committed to the ledger, proving audit compliance to regulators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ERP Integrations Bar (Linked to #integrations) */}
      <section id="integrations" className="py-14 bg-[#F3F8F4] border-t border-[#E2ECE4] text-center scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-6">
            Engineered to integrate seamlessly with standard accounting & ERP infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-14 text-[#64748B] font-bold text-sm tracking-wide">
            <span className="hover:text-[#16A34A] transition-colors">SAP S/4HANA</span>
            <span className="hover:text-[#16A34A] transition-colors">Oracle NetSuite</span>
            <span className="hover:text-[#16A34A] transition-colors">Microsoft Dynamics 365</span>
            <span className="hover:text-[#16A34A] transition-colors">QuickBooks Enterprise</span>
            <span className="hover:text-[#16A34A] transition-colors">Tally Prime</span>
          </div>
        </div>
      </section>

      {/* 8. Bottom Conversion Banner */}
      <section className="py-20 bg-[#0F172A] text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16A34A]/20 text-[#4ADE80] text-xs font-bold mb-6 border border-[#16A34A]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready for Immediate Deployment</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-5">
            Take full control of your Accounts Payable risk today.
          </h2>

          <p className="text-slate-300 text-base max-w-xl mx-auto mb-10 leading-relaxed">
            Eliminate duplicate disbursements, enforce corporate limits autonomously, and maintain an unalterable audit ledger.
          </p>

          <div className="flex items-center justify-center">
            <a
              href="#simulator"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#16A34A] hover:bg-[#15803D] text-white text-base font-bold rounded-full shadow-[0_4px_20px_rgba(22,163,74,0.35)] transition-all cursor-pointer"
            >
              <span>Test Risk Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 9. Corporate Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={32} showText subtitle="2026 Financial Risk Intelligence" variant="light" />
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/queue" className="hover:text-white transition-colors">
              Process Manager
            </Link>
            <Link href="/audit" className="hover:text-white transition-colors">
              Audit Ledger
            </Link>
          </div>

          <div className="font-mono text-slate-500 text-[11px]">
            SHA-256 Cryptographic Ledger · SOC2 Type II Certified
          </div>
        </div>
      </footer>

      {/* Interactive Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
