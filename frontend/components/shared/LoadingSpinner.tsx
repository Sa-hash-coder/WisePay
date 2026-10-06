import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={`animate-spin text-indigo-600 ${className}`} />;
}
