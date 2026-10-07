import { cn } from '@/lib/utils';

export function ConfidenceMeter({ confidence }: { confidence: number }) {
  const isHigh = confidence >= 80;
  return (
    <div className="flex flex-col gap-2 w-48">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">AI Confidence</span>
        <span className={cn("text-sm font-bold font-mono", isHigh ? "text-[#16A34A]" : "text-[#D97706]")}>
          {confidence}%
        </span>
      </div>
      <div className="relative overflow-hidden bg-[#F3F8F4] rounded-full w-full h-2.5 border border-[#E2ECE4]">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out", 
            isHigh ? "bg-[#16A34A]" : "bg-[#F59E0B]"
          )} 
          style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }} 
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] uppercase font-bold tracking-wider", isHigh ? "text-[#16A34A]" : "text-[#D97706]")}>
          {isHigh ? 'High Evidence Grounding' : 'Ambiguous / Needs Review'}
        </span>
      </div>
    </div>
  );
}
