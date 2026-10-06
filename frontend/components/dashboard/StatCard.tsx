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
    <div className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm card-hover ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">{title}</div>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900">
        {loading ? (
          <div className="h-9 w-24 skeleton rounded" />
        ) : (
          <AnimatedCounter value={value} />
        )}
      </div>
      {trend && (
        <div className="text-xs text-gray-400 mt-2">{trend}</div>
      )}
    </div>
  );
}
