'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';

const DECISION_COLORS: Record<string, string> = {
  AUTO_PASS: '#059669',
  HUMAN_REVIEW: '#D97706',
  HIGH_RISK: '#DC2626',
};

export function ProcessingStream() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState<Transaction[]>([]);

  useEffect(() => {
    api.dashboard.processingStream()
      .then(data => {
        setTransactions([...data, ...data, ...data]);
      })
      .catch(() => {
        const mock: Partial<Transaction>[] = [
          { id: '1', invoice_id: 'INV-45123', vendor_name: 'Infosys Technologies', amount: 245000, decision: 'AUTO_PASS' },
          { id: '2', invoice_id: 'INV-23891', vendor_name: 'Office Supplies Co', amount: 450000, decision: 'HIGH_RISK' },
          { id: '3', invoice_id: 'INV-67234', vendor_name: 'Sharma Travels', amount: 45000, decision: 'AUTO_PASS' },
          { id: '4', invoice_id: 'INV-89012', vendor_name: 'Metro Catering', amount: 28500, decision: 'HUMAN_REVIEW' },
          { id: '5', invoice_id: 'INV-12345', vendor_name: 'Azure Cloud', amount: 1200000, decision: 'AUTO_PASS' },
        ];
        setTransactions([...mock, ...mock, ...mock] as Transaction[]);
      });
  }, []);

  useEffect(() => {
    if (transactions.length === 0) return;
    setVisible(transactions.slice(0, 7));

    const interval = setInterval(() => {
      setCurrentIdx(prev => {
        const next = (prev + 1) % (transactions.length - 6);
        setVisible(transactions.slice(next, next + 7));
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [transactions]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl h-full flex flex-col overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Processing Stream</h3>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-3 py-2 space-y-1">
        {visible.map((txn, i) => (
          <div
            key={`${txn.id}-${i}`}
            className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-xs transition-all duration-300 even:bg-slate-50/70 hover:bg-slate-100/80"
            style={{ opacity: i === 0 ? 0.5 : 1 }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: DECISION_COLORS[txn.decision] || '#9CA3AF' }}
            />
            <span className="text-slate-500 font-mono text-[11px] w-20 flex-shrink-0 truncate">{txn.invoice_id}</span>
            <span className="text-slate-800 font-medium flex-1 truncate">{txn.vendor_name}</span>
            <span className="text-slate-600 font-medium text-right flex-shrink-0 tabular-nums">
              {formatCurrency(txn.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
