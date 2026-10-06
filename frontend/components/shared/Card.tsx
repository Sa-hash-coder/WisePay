import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div 
      className={cn("bg-white border border-gray-200 rounded-2xl p-4 shadow-sm", className)} 
      {...props} 
    />
  );
}
