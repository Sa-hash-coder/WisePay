'use client';
import { ReactNode } from 'react';
import { AnimatedCounter } from './AnimatedCounter';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  icon?: ReactNode;
  accentColor?: string;
  trend?: string;
  actionText?: string;
  actionHref?: string;
  changePct?: number | string;
  changeType?: 'positive' | 'negative' | 'neutral';
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  loading,
  icon,
  accentColor = '#16A34A',
  trend,
  actionText = 'Analytics',
  actionHref = '/queue',
  changePct = '+56%',
  changeType = 'positive',
  prefix = '',
  suffix = '',
  className = '',
}: StatCardProps) {
  const isPositive = changeType === 'positive' || (typeof changePct === 'string' && !changePct.startsWith('-'));

  return (
    <div className={`bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_25px_-3px_rgba(22,163,74,0.07)] transition-all flex flex-col justify-between ${className}`}>
      <div>
        {/* Top Header: Icon + Title & Action Pill */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon ? (
              <div className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#16A34A] flex items-center justify-center">
                {icon}
              </div>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            )}
            <span className="text-xs font-semibold text-[#64748B] tracking-tight">{title}</span>
          </div>

          {actionText && (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] hover:text-[#16A34A] bg-[#F8FAF9] hover:bg-[#E8F8EE] border border-[#E2ECE4] hover:border-[#D1EED8] px-2.5 py-0.5 rounded-lg transition-colors"
            >
              <span>{actionText}</span>
              <ArrowUpRight className="w-3 h-3 text-[#94A3B8]" />
            </Link>
          )}
        </div>

        {/* Large Value & Percentage badge */}
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <div className="text-2xl lg:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {loading ? (
              <div className="h-8 w-28 skeleton rounded" />
            ) : (
              <span>
                {prefix}
                {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
                {suffix}
              </span>
            )}
          </div>

          {changePct && (
            <div className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
              isPositive 
                ? 'text-[#16A34A] bg-[#E8F8EE] border border-[#D5EFE0]' 
                : 'text-[#DC2626] bg-[#FEE2E2] border border-[#FECACA]'
            }`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{changePct}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
