import { cn, getDecisionColor } from '@/lib/utils';

export function DecisionBadge({ decision, className }: { decision: string; className?: string }) {
  return (
    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-md border", getDecisionColor(decision), className)}>
      {decision.replace('_', ' ')}
    </span>
  );
}
