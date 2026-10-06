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
  ArrowUpRight
} from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { ReceiptScannerHero } from '@/components/landing/ReceiptScannerHero';
import { useRouter } from 'next/navigation';

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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    router.push('/dashboard');
  };

  const featurePillars = {
    duplicate: {
      badge: 'DUPLICATE RADAR',
      title: 'Intercept near-duplicate invoices before disbursement',
      description: 'Human reviewers miss altered invoice numbers (e.g. INV-1002 vs INV-1002A) and split payments across departments. SENTINEL scans both exact PO references and semantic TF-IDF text similarity in under 20ms.',
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
      description: 'Vendor invoice amounts drift over time. SENTINEL computes a running 6-month statistical profile per supplier and employee submitter, catching price creep and abnormal spikes before approvals.',
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
      tagColor: 'indigo',
      mockHeader: 'Threshold Violation',
      mockInvoice: 'INV-9021 · Vertex Consulting',
      mockDetails: 'Two ₹4,90,000 invoices submitted 20 minutes apart to bypass the ₹5,00,000 dual-signoff policy.',
      mockStatus: 'SPLIT PO DETECTED'
    },
    blockchain: {
      badge: 'SOLANA AUDIT LEDGER',
      title: 'Anchor every decision to an immutable cryptographic chain',
      description: 'External auditors and regulatory bodies demand tamper-evident proof. For every AI classification and human override, SENTINEL hashes the payload with SHA-256 and commits it directly to Solana.',
      bullets: [
        'Sequential SHA-256 block hash linking (prev_hash validation)',
        'Zero possibility of retrospective ledger manipulation or collusion',
        'Instant cryptographic verification certificate for external auditors'
      ],
      metric: '100%',
      metricLabel: 'Verifiable audit ledger integrity',
      tagColor: 'purple',
      mockHeader: 'Solana Block Anchored',
      mockInvoice: 'Block #284,910,241 · Sealed',
      mockDetails: 'Payload hash: 0x8f2a991c4e8b · Verified intact across 50 consecutive ledger blocks.',
      mockStatus: 'VERIFIED IMMUTABLE'
    }
  };

  const activeData = featurePillars[activeFeatureTab];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* 1. Header / Navbar (Dext & Ramp inspired) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs group-hover:bg-indigo-700 transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-black text-[#0F172A] tracking-tight leading-none">
                SENTINEL
              </div>
              <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">
                FINANCIAL RISK INTELLIGENCE
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-[#0F172A] transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-[#0F172A] transition-colors">
              Features
            </a>
            <a href="#simulator" className="hover:text-[#0F172A] transition-colors">
              Forensic Simulator
            </a>
            <a href="#integrations" className="hover:text-[#0F172A] transition-colors">
              ERP Integrations
            </a>
          </nav>

          {/* Action CTAs (Register your organization & Login your organization) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAuth('login')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-all"
            >
              <LogIn className="w-4 h-4 text-slate-400" />
              <span>Login your organization</span>
            </button>
            <button
              onClick={() => handleOpenAuth('signup')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all shadow-xs hover:shadow"
            >
              <Building2 className="w-4 h-4" />
              <span>Register your organization</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Dext-style Split Hero Section */}
      <section className="pt-12 pb-20 lg:pt-16 lg:pb-24 overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Big punchy typography & Dext bullet points */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-6 w-fit">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>Accounts Payable Exception Intelligence</span>
              </div>

              {/* Dext-Style Bold Headline with Electric Indigo Accent */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-[#0F172A] tracking-tight leading-[1.08] mb-6">
                <span className="text-indigo-600">From crumpled receipts</span> to immutable Solana blocks.
              </h1>

              {/* Concise CFO-grade Subtitle */}
              <p className="text-lg text-slate-600 font-normal leading-relaxed mb-8 max-w-xl">
                The autonomous risk intelligence platform that turns paper invoices, duplicate billing, and rogue expenses into 100% verified, blockchain-anchored ledger entries.
              </p>

              {/* Dext-Style Key Highlights with Circular Badge Checkmarks */}
              <div className="space-y-3.5 mb-9">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    <strong className="text-[#0F172A] font-bold">Autonomous triage:</strong> 88.2% of clean invoices auto-cleared with zero human touch.
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    <strong className="text-[#0F172A] font-bold">Duplicate radar:</strong> Catches fuzzy text, altered PO numbers, and split billing across departments.
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    <strong className="text-[#0F172A] font-bold">Solana ledger:</strong> Every approval, rejection, and override sealed into a tamper-evident hash chain.
                  </span>
                </div>
              </div>

              {/* Primary Organization Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Register your organization</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-base font-bold rounded-full shadow-xs hover:shadow transition-all"
                >
                  <LogIn className="w-4 h-4 text-slate-500" />
                  <span>Login your organization</span>
                </button>
              </div>

              {/* Trust bullet info under hero */}
              <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Immediate Controller Access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Zero ERP Installation Disruption</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>SOC2 Type II Ready</span>
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

      {/* 3. Dext-Style Bold Contrast Dark Ribbon Banner */}
      <section className="bg-[#0F172A] text-white py-12 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">
                The Shift From Sampling to 100% Audit
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white max-w-xl">
                Traditional ERPs sample 5% of invoices. SENTINEL audits 100% before money leaves.
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full lg:w-auto">
              <div className="border-l border-slate-700 pl-4">
                <div className="text-2xl font-black text-white font-mono">₹2,847 Cr</div>
                <div className="text-xs text-slate-400">Total Audited</div>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <div className="text-2xl font-black text-emerald-400 font-mono">88.2%</div>
                <div className="text-xs text-slate-400">Attention Saved</div>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <div className="text-2xl font-black text-indigo-400 font-mono">&lt; 45ms</div>
                <div className="text-xs text-slate-400">Scoring Latency</div>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <div className="text-2xl font-black text-purple-400 font-mono">0.00%</div>
                <div className="text-xs text-slate-400">Tamper Risk</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BILL-Style "How Can We Help?" Segmented Interactive Showcase */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              Enterprise Risk Defense Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mt-3">
              How does SENTINEL protect your AP operations?
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Select an operational layer below to see how our multi-engine system catches leakages that ERPs miss.
            </p>
          </div>

          {/* BILL-style clickable category pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            <button
              onClick={() => setActiveFeatureTab('duplicate')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeFeatureTab === 'duplicate'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1. Duplicate Invoice Interception
            </button>
            <button
              onClick={() => setActiveFeatureTab('behavioral')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeFeatureTab === 'behavioral'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2. Behavioral ML & Variance
            </button>
            <button
              onClick={() => setActiveFeatureTab('policy')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeFeatureTab === 'policy'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3. Policy Enforcement & Split-PO
            </button>
            <button
              onClick={() => setActiveFeatureTab('blockchain')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeFeatureTab === 'blockchain'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              4. Solana Cryptographic Ledger
            </button>
          </div>

          {/* Interactive Feature Panel */}
          <div className="bg-[#F8FAFC] border border-slate-200 rounded-3xl p-8 lg:p-12 shadow-sm max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Feature Content */}
              <div className="lg:col-span-7">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                  {activeData.badge}
                </span>
                <h3 className="text-2xl font-black text-[#0F172A] tracking-tight mt-3 mb-3">
                  {activeData.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {activeData.description}
                </p>

                <div className="space-y-2.5 mb-8">
                  {activeData.bullets.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-slate-200">
                  <div>
                    <div className="text-2xl font-black text-[#0F172A] font-mono">{activeData.metric}</div>
                    <div className="text-xs text-slate-500">{activeData.metricLabel}</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <span>Inspect live in dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Feature Simulated Output Card */}
              <div className="lg:col-span-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Live Telemetry Output
                    </span>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      {activeData.mockStatus}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-400">Subject Invoice</div>
                      <div className="text-sm font-bold text-[#0F172A]">{activeData.mockInvoice}</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
                      <div className="font-semibold text-slate-800 mb-1">{activeData.mockHeader}:</div>
                      {activeData.mockDetails}
                    </div>

                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Decision Grounded</span>
                      </div>
                      <span className="text-[11px] font-mono">100% Explainable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. End-to-End Lifecycle Flow */}
      <section id="how-it-works" className="py-20 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              Seamless 4-Stage Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mt-3">
              How Invoices Flow Through SENTINEL
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Plugs into your enterprise ERP via REST API or batch webhook without disrupting existing accounting cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative card-hover">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-black text-sm mb-4">
                01
              </div>
              <h4 className="text-base font-bold text-[#0F172A] mb-2">ERP Ingestion</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Invoices ingested from SAP, NetSuite, Oracle, or PDF scanner. Line items, PO references, and employee IDs are normalized.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative card-hover">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-black text-sm mb-4">
                02
              </div>
              <h4 className="text-base font-bold text-[#0F172A] mb-2">Parallel AI Scoring</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Simultaneous scans for supplier variance, TF-IDF duplicate indexes, relationship anomalies, and corporate approval thresholds.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative card-hover">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-black text-sm mb-4">
                03
              </div>
              <h4 className="text-base font-bold text-[#0F172A] mb-2">Autonomous Triage</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                88% pass autonomously to payment authorization. The remaining 12% exception candidates are queued with forensic remediation steps.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative card-hover">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-black text-sm mb-4">
                04
              </div>
              <h4 className="text-base font-bold text-[#0F172A] mb-2">Solana Block Seal</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every rating, reason, and human override is hashed with SHA-256 and committed to Solana, proving audit compliance to regulators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ERP Integrations Bar */}
      <section id="integrations" className="py-14 bg-white border-t border-slate-200 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            Engineered to integrate seamlessly with standard accounting & ERP infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-14 text-slate-400 font-bold text-sm tracking-wide">
            <span className="hover:text-slate-700 transition-colors">SAP S/4HANA</span>
            <span className="hover:text-slate-700 transition-colors">Oracle NetSuite</span>
            <span className="hover:text-slate-700 transition-colors">Microsoft Dynamics 365</span>
            <span className="hover:text-slate-700 transition-colors">QuickBooks Enterprise</span>
            <span className="hover:text-slate-700 transition-colors">Tally Prime</span>
            <span className="hover:text-slate-700 transition-colors">Solana Mainnet</span>
          </div>
        </div>
      </section>

      {/* 7. Bottom Conversion Banner */}
      <section className="py-20 bg-[#0F172A] text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready for Immediate Deployment</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-5">
            Take full control of your Accounts Payable risk today.
          </h2>

          <p className="text-slate-300 text-base max-w-xl mx-auto mb-10 leading-relaxed">
            Eliminate duplicate disbursements, enforce corporate limits autonomously, and maintain an unalterable audit ledger.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleOpenAuth('signup')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold rounded-full shadow-lg transition-all"
            >
              <Building2 className="w-5 h-5" />
              <span>Register your organization</span>
            </button>
            <button
              onClick={() => handleOpenAuth('login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#0F172A] hover:bg-slate-100 text-base font-bold rounded-full shadow-lg transition-all"
            >
              <LogIn className="w-4 h-4 text-indigo-600" />
              <span>Login your organization</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. Professional Corporate Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">SENTINEL</span>
              <span className="text-slate-500 ml-2">© 2026 Financial Risk Intelligence Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Auditor Console
            </Link>
            <Link href="/queue" className="hover:text-white transition-colors">
              Exception Review
            </Link>
            <Link href="/audit" className="hover:text-white transition-colors">
              Solana Ledger
            </Link>
          </div>

          <div className="font-mono text-slate-500 text-[11px]">
            SHA-256 Hash Chain · SOC2 Type II Certified
          </div>
        </div>
      </footer>

      {/* Interactive Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
