'use client';
import { useEffect, useState } from 'react';
import { AnimatedCounter } from './AnimatedCounter';
import { Zap, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AttentionSavedGaugeProps {
  percentage: number;
  loading?: boolean;
}

export function AttentionSavedGauge({ percentage, loading }: AttentionSavedGaugeProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => setAnimated(percentage), 300);
    return () => clearTimeout(timer);
  }, [percentage, loading]);

  return (
    <div className="bg-white border border-[#E2ECE4] rounded-2xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8F8EE] text-[#16A34A] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">Autonomous Attention Saved</h3>
              <p className="text-[11px] text-[#64748B]">Zero-touch automated invoice approvals</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-extrabold text-[#16A34A] tracking-tight">
              {loading ? '--' : <AnimatedCounter value={Math.round(percentage)} />}%
            </div>
            <div className="text-[10px] text-[#94A3B8] font-medium">Clearance Rate</div>
          </div>
        </div>
        
        {/* Finlytics styled progress bar */}
        <div className="relative h-3 bg-[#EAF4ED] rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full shadow-xs"
            style={{
              width: `${animated}%`,
              background: 'linear-gradient(90deg, #10B981, #22C55E)',
              transition: 'width 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </div>
      </div>
      
      {/* Sub-metrics */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#EAEFEA]">
        <div className="flex items-center gap-1.5 bg-[#F3F8F4] border border-[#E2ECE4] px-2.5 py-1 rounded-lg text-xs font-medium text-[#0F172A]">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>Auto-Approved</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#F3F8F4] border border-[#E2ECE4] px-2.5 py-1 rounded-lg text-xs font-medium text-[#0F172A]">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <span>Tier-1 Review</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#F3F8F4] border border-[#E2ECE4] px-2.5 py-1 rounded-lg text-xs font-medium text-[#0F172A]">
          <div className="w-2 h-2 rounded-full bg-[#DC2626]" />
          <span>Quarantine Hold</span>
        </div>
      </div>
    </div>
  );
}
