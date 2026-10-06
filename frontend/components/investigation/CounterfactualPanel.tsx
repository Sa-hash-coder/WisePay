'use client';
import { Card } from '@/components/shared/Card';
import { ArrowDown, CheckCircle2, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CounterfactualStep {
  action: string;
  risk_reduction: number;
  new_risk_score: number;
  new_decision: string;
  impact_area?: string;
}

interface CounterfactualPanelProps {
  currentRiskScore: number;
  steps: CounterfactualStep[];
}

export function CounterfactualPanel({ currentRiskScore, steps }: CounterfactualPanelProps) {
  if (!steps || steps.length === 0) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-[#0F172A]">Transaction Already In Safe Threshold</h3>
        <p className="text-sm text-slate-500 max-w-md">
          Current risk score is already within acceptable limits. No counterfactual remediations required.
        </p>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-rose-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getBarColor = (score: number) => {
    if (score >= 75) return 'bg-rose-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Explainer */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
        <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-indigo-950 font-bold text-sm">
            Counterfactual Remediation Engine · &ldquo;What Would Make This Safe?&rdquo;
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Rather than acting as a blunt blocking detector, WisePay computes actionable steps based on underlying mathematical scoring weights to guide submitters and reviewers towards policy compliance.
          </p>
        </div>
      </div>

      {/* Waterfall Remediation Steps */}
      <Card className="p-6 flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        {/* Starting State */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current State</span>
            <div className="text-sm font-bold text-[#0F172A] mt-0.5">Initial Flagged Evaluation</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40 h-2.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getBarColor(currentRiskScore)}`} 
                style={{ width: `${currentRiskScore}%` }} 
              />
            </div>
            <span className={`text-xl font-bold font-mono ${getScoreColor(currentRiskScore)}`}>
              {currentRiskScore}
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isAutoPass = step.new_decision === 'AUTO_PASS';
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-6 pb-4 border-l-2 border-dashed border-slate-200 last:border-0 last:pb-0"
              >
                {/* Node icon on line */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-xs">
                  <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-indigo-300 hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                        Step {index + 1}
                      </span>
                      {step.impact_area && (
                        <span className="text-[11px] font-medium text-slate-500">
                          {step.impact_area}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-[#0F172A] mt-1.5">
                      {step.action}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-mono text-emerald-600 font-bold">
                        -{step.risk_reduction} pts
                      </span>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Impact</div>
                    </div>

                    <div className="w-px h-8 bg-slate-200" />

                    <div className="text-right min-w-[70px]">
                      <span className={`text-lg font-bold font-mono ${getScoreColor(step.new_risk_score)}`}>
                        {step.new_risk_score}
                      </span>
                      <div className="text-[10px] uppercase font-bold">
                        {isAutoPass ? (
                          <span className="text-emerald-600">AUTO-PASS</span>
                        ) : (
                          <span className="text-amber-600">REVIEW</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
