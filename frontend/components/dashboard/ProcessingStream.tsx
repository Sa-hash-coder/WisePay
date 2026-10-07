'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Activity } from 'lucide-react';

const DECISION_COLORS: Record<string, string> = {
  AUTO_PASS: '#10B981',
  HUMAN_REVIEW: '#F59E0B',
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
    }, 1400);

    return () => clearInterval(interval);
  }, [transactions]);

  return (
    <div className="bg-white border border-[#E2ECE4] rounded-2xl h-full flex flex-col overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
      <div className="px-5 py-3.5 bg-[#FAFCFA] border-b border-[#EAEFEA] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#16A34A]" />
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Live Processing Stream</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-semibold bg-[#E8F8EE] px-2.5 py-0.5 rounded-full border border-[#D1EED8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
          Live Feed
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3 py-2 space-y-1">
        {visible.map((txn, i) => (
          <div
            key={`${txn.id}-${i}`}
            className="flex items-center gap-2.5 py-2 px-2.5 rounded-xl text-xs transition-all duration-300 hover:bg-[#F3F8F4]"
            style={{ opacity: i === 0 ? 0.5 : 1 }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: DECISION_COLORS[txn.decision] || '#9CA3AF' }}
            />
            <span className="text-[#64748B] font-mono text-[11px] w-20 flex-shrink-0 truncate">{txn.invoice_id}</span>
            <span className="text-[#0F172A] font-semibold flex-1 truncate">{txn.vendor_name}</span>
            <span className="text-[#16A34A] font-bold text-right flex-shrink-0 tabular-nums">
              {formatCurrency(txn.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
