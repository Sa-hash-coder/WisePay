'use client';

export function ReceiptScannerHero() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto">
      {/* Decorative ambient soft glow */}
      <div className="absolute -inset-3 bg-gradient-to-tr from-indigo-500/10 via-slate-300/15 to-amber-500/10 rounded-[28px] blur-xl pointer-events-none" />

      {/* Clean image card snugly fitting the image with matching rounded corners */}
      <div className="relative rounded-[24px] overflow-hidden shadow-xl border border-slate-200/60">
        {/* Perfectly Cropped Receipt Scan Image */}
        <img 
          src="/images/receipt-scan.png" 
          alt="Receipt Scanner" 
          className="w-full h-auto block select-none pointer-events-none"
        />

        {/* Animated Scanner Laser Line */}
        <div 
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-lime-400 to-transparent shadow-[0_0_14px_#A3E635] pointer-events-none opacity-90"
          style={{
            animation: 'scanline 2.8s ease-in-out infinite alternate',
          }}
        />
      </div>
    </div>
  );
}
