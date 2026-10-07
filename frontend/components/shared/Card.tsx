import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div 
      className={cn("bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_25px_-3px_rgba(22,163,74,0.06)] transition-all", className)} 
      {...props} 
    />
  );
}
