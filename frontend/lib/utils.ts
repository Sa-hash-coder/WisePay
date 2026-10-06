import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function getRiskColor(score: number) {
  if (score >= 80) return 'text-rose-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-emerald-600';
}

export function getDecisionColor(decision: string) {
  switch (decision) {
    case 'HIGH_RISK': return 'text-rose-700 bg-rose-50 border-rose-200';
    case 'HUMAN_REVIEW': return 'text-amber-800 bg-amber-50 border-amber-200';
    case 'AUTO_PASS': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}
