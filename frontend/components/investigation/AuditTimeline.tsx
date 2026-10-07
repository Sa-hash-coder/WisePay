'use client';
import { CheckCircle, AlertCircle, FileText, Activity, ShieldCheck, UserCheck, Clock, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuditEventItem {
  type: string;
  timestamp: string;
  hash?: string;
  prev_hash?: string;
  block_index?: number;
  description?: string;
  data?: any;
}

interface AuditTimelineProps {
  timeline?: AuditEventItem[];
  invoiceDate?: string;
}

export function AuditTimeline({ timeline, invoiceDate }: AuditTimelineProps) {
  const events = timeline && timeline.length > 0 ? timeline.map((ev, i) => ({
    id: i + 1,
    time: ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '10:31:06',
    date: ev.timestamp ? new Date(ev.timestamp).toLocaleDateString() : 'Today',
    title: ev.description || ev.type.replace(/_/g, ' '),
    desc: ev.data ? JSON.stringify(ev.data) : 'Automated cryptographic event recorded to ledger',
    hash: ev.hash ? `${ev.hash.slice(0, 10)}...${ev.hash.slice(-8)}` : '0x7f2a...88b2',
    blockIndex: ev.block_index,
    isHuman: ev.type.includes('HUMAN'),
  })) : [
    { id: 1, time: '10:31:04', date: 'Today', title: 'Invoice Ingested & Fields Validated', desc: 'Mandatory invoice parameters verified against vendor database.', hash: '0x3a8f...92c1', isHuman: false, blockIndex: undefined as number | undefined },
    { id: 2, time: '10:31:05', date: 'Today', title: 'Intelligent Duplicate & Similarity Check', desc: 'TF-IDF vector comparison executed against all prior invoices.', hash: '0x8b12...44f9', isHuman: false, blockIndex: undefined as number | undefined },
    { id: 3, time: '10:31:05', date: 'Today', title: 'Vendor Behavioral Fingerprint Evaluated', desc: 'Amount analyzed against vendor historical range and z-score.', hash: '0x1c94...e720', isHuman: false, blockIndex: undefined as number | undefined },
    { id: 4, time: '10:31:06', date: 'Today', title: 'Policy Engine Rules Fired', desc: 'Checked against compliance thresholds and approval limits.', hash: '0x992b...183a', isHuman: false, blockIndex: undefined as number | undefined },
    { id: 5, time: '10:31:06', date: 'Today', title: 'Composite Risk & Confidence Scored', desc: 'Multi-signal non-linear risk engine rendered final decision.', hash: '0x6e41...bf02', isHuman: false, blockIndex: undefined as number | undefined },
    { id: 6, time: '10:31:07', date: 'Today', title: 'Ledger Audit Block Committed', desc: 'SHA-256 hash anchored into immutable local chain.', hash: '0xda39...8901', isHuman: false, blockIndex: 247 as number | undefined },
  ];

  return (
    <div className="relative pl-6 space-y-6">
      <div className="absolute left-[13px] top-3 bottom-3 w-px bg-[#E2ECE4]" />
      
      {events.map((ev, idx) => (
        <motion.div 
          key={ev.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.08 }}
          className="relative"
        >
          {/* Timeline node dot */}
          <div className={`absolute -left-[27px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 bg-white shadow-xs ${
            ev.isHuman 
              ? 'border-[#F59E0B] text-[#D97706]' 
              : 'border-[#16A34A] text-[#16A34A]'
          }`}>
            {ev.isHuman ? <UserCheck className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
          </div>

          <div className="bg-[#FAFCFA] rounded-xl p-4 border border-[#E2ECE4] hover:border-[#16A34A] hover:bg-white transition-all shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-xs text-[#0F172A]">{ev.title}</h4>
              <span className="text-[11px] font-mono text-[#94A3B8] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#94A3B8]" />
                {ev.time}
              </span>
            </div>

            <p className="text-xs text-[#64748B] mb-2 leading-relaxed">{ev.desc}</p>

            <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-2 border-t border-[#EAEFEA]">
              <span className="font-mono flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-[#E2ECE4] text-[#0F172A]">
                <Hash className="w-2.5 h-2.5 text-[#16A34A]" />
                Block Hash: {ev.hash}
              </span>
              {ev.blockIndex !== undefined && (
                <span className="font-mono font-bold text-[#16A34A] bg-[#E8F8EE] border border-[#D1EED8] px-2.5 py-0.5 rounded-full">
                  Block #{ev.blockIndex}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
