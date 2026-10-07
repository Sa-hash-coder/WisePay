import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  subtitle?: string;
  variant?: 'light' | 'dark';
}

export function Logo({
  className = '',
  size = 32,
  showText = false,
  subtitle,
  variant = 'dark',
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div 
        className="relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-white shadow-xs border border-[#E2ECE4]"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="WisePay Logo"
          width={size}
          height={size}
          className="object-contain w-full h-full p-0.5"
          priority
        />
      </div>
      {showText && (
        <div>
          <div className={`font-extrabold tracking-tight flex items-center gap-1.5 leading-none ${
            variant === 'light' ? 'text-white text-lg' : 'text-[#0F172A] text-base'
          }`}>
            <span>WisePay</span>
            <span className="text-[10px] font-bold text-[#16A34A] bg-[#E8F8EE] px-1.5 py-0.5 rounded">
              AI
            </span>
          </div>
          {subtitle && (
            <div className={`text-[9px] font-semibold tracking-wider uppercase mt-0.5 ${
              variant === 'light' ? 'text-emerald-300/80' : 'text-[#94A3B8]'
            }`}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
