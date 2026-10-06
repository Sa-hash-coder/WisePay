import { cn } from '@/lib/utils';

export function RiskBadge({ score, className }: { score: number; className?: string }) {
  let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 80) color = 'bg-rose-50 text-rose-700 border-rose-200';
  else if (score >= 50) color = 'bg-amber-50 text-amber-800 border-amber-200';

  return (
    <span className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full border tabular-nums shadow-xs", color, className)}>
      {score}
    </span>
  );
}
