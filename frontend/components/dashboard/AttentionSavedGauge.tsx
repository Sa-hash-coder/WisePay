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
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Human Attention Saved</h3>
          <p className="text-xs text-gray-400 mt-0.5">Transactions requiring zero human intervention</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-emerald-600">
            {loading ? '--' : <AnimatedCounter value={Math.round(percentage)} />}%
          </div>
          <div className="text-xs text-gray-400 mt-1">of all transactions</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${animated}%`,
            background: 'linear-gradient(90deg, #059669, #34D399)',
            transition: 'width 2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>
      
      {/* Sub-metrics */}
      <div className="flex items-center gap-6 mt-5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">Auto-approved without review</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-500">Escalated to humans</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-gray-500">High-risk holds</span>
        </div>
      </div>
    </div>
  );
}
