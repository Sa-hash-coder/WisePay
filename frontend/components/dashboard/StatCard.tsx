'use client';
import { ReactNode } from 'react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: number;
  loading?: boolean;
  icon?: ReactNode;
  accentColor?: string;
  className?: string;
  trend?: string;
}

export function StatCard({ title, value, loading, icon, accentColor = '#4F46E5', className = '', trend }: StatCardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-xs card-hover flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{title}</div>
          {icon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100"
              style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
            >
              {icon}
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight">
          {loading ? (
            <div className="h-9 w-24 skeleton rounded" />
          ) : (
            <AnimatedCounter value={value} />
          )}
        </div>
      </div>
      {trend && (
        <div className="text-[11px] text-slate-500 font-medium mt-3 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md w-fit">
          {trend}
        </div>
      )}
    </div>
  );
}
