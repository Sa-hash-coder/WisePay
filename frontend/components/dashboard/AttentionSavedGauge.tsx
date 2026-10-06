'use client';
import { useEffect, useState } from 'react';
import { AnimatedCounter } from './AnimatedCounter';

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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Human Attention Saved</h3>
            <p className="text-xs text-slate-500 mt-0.5">Transactions requiring zero human intervention</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-extrabold text-emerald-600 tracking-tight">
              {loading ? '--' : <AnimatedCounter value={Math.round(percentage)} />}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">of all transactions</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-3.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="absolute inset-y-0 left-0 rounded-full shadow-xs"
            style={{
              width: `${animated}%`,
              background: 'linear-gradient(90deg, #059669, #10B981)',
              transition: 'width 2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </div>
      </div>
      
      {/* Sub-metrics */}
      <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-slate-600">Auto-approved</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs font-medium text-slate-600">Human escalation</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-xs font-medium text-slate-600">High-risk holds</span>
        </div>
      </div>
    </div>
  );
}
