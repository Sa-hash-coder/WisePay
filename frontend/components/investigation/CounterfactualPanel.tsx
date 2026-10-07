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
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-3 bg-white border border-[#E2ECE4] rounded-2xl shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#E8F8EE] border border-[#D1EED8] flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-[#16A34A]" />
        </div>
        <h3 className="text-base font-bold text-[#0F172A]">Transaction Already In Safe Threshold</h3>
        <p className="text-sm text-[#64748B] max-w-md">
          Current risk score is already within acceptable limits. No counterfactual remediations required.
        </p>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-[#DC2626]';
    if (score >= 40) return 'text-[#D97706]';
    return 'text-[#16A34A]';
  };

  const getBarColor = (score: number) => {
    if (score >= 75) return 'bg-[#DC2626]';
    if (score >= 40) return 'bg-[#F59E0B]';
    return 'bg-[#16A34A]';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Explainer */}
      <div className="bg-[#E8F8EE] border border-[#D1EED8] rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
        <Sparkles className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[#166534] font-bold text-sm">
            Counterfactual Remediation Engine · &ldquo;What Would Make This Safe?&rdquo;
          </h4>
          <p className="text-xs text-[#334155] mt-1 leading-relaxed">
            Rather than acting as a blunt blocking detector, WisePay computes actionable steps based on underlying mathematical scoring weights to guide submitters and reviewers towards policy compliance.
          </p>
        </div>
      </div>

      {/* Waterfall Remediation Steps */}
      <Card className="p-6 flex flex-col gap-6 bg-white border border-[#E2ECE4] rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
        {/* Starting State */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAEFEA]">
          <div>
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Current State</span>
            <div className="text-sm font-bold text-[#0F172A] mt-0.5">Initial Flagged Evaluation</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40 h-2.5 bg-[#F3F8F4] border border-[#E2ECE4] rounded-full overflow-hidden">
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
                className="relative pl-6 pb-4 border-l-2 border-dashed border-[#CBD5E1] last:border-0 last:pb-0"
              >
                {/* Node icon on line */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#16A34A] flex items-center justify-center shadow-xs">
                  <ArrowDown className="w-2.5 h-2.5 text-[#16A34A]" />
                </div>

                <div className="p-4 rounded-xl bg-[#FAFCFA] border border-[#E2ECE4] hover:border-[#16A34A] hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-[#E8F8EE] text-[#16A34A] px-2.5 py-0.5 rounded-full border border-[#D1EED8]">
                        Step {index + 1}
                      </span>
                      {step.impact_area && (
                        <span className="text-[11px] font-medium text-[#64748B]">
                          {step.impact_area}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-[#0F172A] mt-1.5">
                      {step.action}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-mono text-[#16A34A] font-bold">
                        -{step.risk_reduction} pts
                      </span>
                      <div className="text-[10px] text-[#94A3B8] font-bold uppercase">Impact</div>
                    </div>

                    <div className="w-px h-8 bg-[#E2ECE4]" />

                    <div className="text-right min-w-[70px]">
                      <span className={`text-lg font-bold font-mono ${getScoreColor(step.new_risk_score)}`}>
                        {step.new_risk_score}
                      </span>
                      <div className="text-[10px] uppercase font-bold">
                        {isAutoPass ? (
                          <span className="text-[#16A34A]">AUTO-PASS</span>
                        ) : (
                          <span className="text-[#D97706]">REVIEW</span>
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
