import { cn } from '@/lib/utils';

export function ConfidenceMeter({ confidence }: { confidence: number }) {
  const isHigh = confidence >= 80;
  return (
    <div className="flex flex-col gap-2 w-48">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">AI Confidence</span>
        <span className={cn("text-sm font-bold font-mono", isHigh ? "text-indigo-600" : "text-amber-600")}>
          {confidence}%
        </span>
      </div>
      <div className="relative overflow-hidden bg-slate-100 rounded-full w-full h-2.5 border border-slate-200">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out", 
            isHigh ? "bg-indigo-600" : "bg-amber-500"
          )} 
          style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }} 
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] uppercase font-bold tracking-wider", isHigh ? "text-indigo-600" : "text-amber-600")}>
          {isHigh ? 'High Evidence Grounding' : 'Ambiguous / Needs Review'}
        </span>
      </div>
    </div>
  );
}
