'use client';
import React from 'react';
import { motion } from 'framer-motion';

export function RiskGauge({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Use half circle (arc)
  const strokeDasharray = `${circumference / 2} ${circumference}`;
  const strokeDashoffset = circumference / 2 - (score / 100) * (circumference / 2);

  let color = '#059669'; // emerald
  if (score >= 80) color = '#DC2626'; // red
  else if (score >= 35) color = '#D97706'; // amber

  return (
    <div className="relative w-40 h-24 flex flex-col items-center justify-end">
      <svg className="absolute top-0 w-full h-32" viewBox="0 0 160 80">
        {/* Background Arc */}
        <circle 
          cx="80" cy="70" r={radius} fill="none" 
          stroke="#E2E8F0" strokeWidth="12" 
          strokeDasharray={strokeDasharray} 
          strokeLinecap="round"
          className="transform -rotate-180 origin-[80px_70px]"
        />
        {/* Value Arc */}
        <motion.circle 
          cx="80" cy="70" r={radius} fill="none" 
          stroke={color} strokeWidth="12"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference / 2 }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          className="transform -rotate-180 origin-[80px_70px]"
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>{score}</span>
        <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">RISK SCORE</span>
      </div>
    </div>
  );
}
