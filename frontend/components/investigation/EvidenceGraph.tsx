'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Transaction } from '@/types';

interface EvidenceGraphProps {
  transaction: Transaction;
  graphData?: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      risk?: number;
      contribution?: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      label: string;
    }>;
  };
  duplicateInfo?: any;
  behavioralData?: any;
  policyViolations?: any[];
}

export function EvidenceGraph({ transaction, graphData, duplicateInfo, behavioralData, policyViolations }: EvidenceGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Compute structured layout of evidence chain
  const chainNodes = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'transaction' | 'vendor' | 'employee' | 'duplicate' | 'rule' | 'behavioral' | 'decision';
      color: string;
      bg: string;
      border: string;
      iconText: string;
    }> = [];

    // 1. Transaction Node
    list.push({
      id: 'tx_origin',
      title: transaction.invoice_id,
      subtitle: `Amount: ₹${transaction.amount?.toLocaleString('en-IN')}`,
      type: 'transaction',
      color: '#4F46E5',
      bg: '#EEF2FF',
      border: '#C7D2FE',
      iconText: 'TX'
    });

    // 2. Vendor Node
    list.push({
      id: 'vendor_node',
      title: transaction.vendor_name,
      subtitle: `Vendor ID: ${transaction.vendor_id}`,
      type: 'vendor',
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      iconText: 'VEN'
    });

    // 3. Submitter Node
    list.push({
      id: 'emp_node',
      title: transaction.employee_name,
      subtitle: `${transaction.employee_dept} Department`,
      type: 'employee',
      color: '#0284C7',
      bg: '#F0F9FF',
      border: '#BAE6FD',
      iconText: 'EMP'
    });

    // 4. Duplicate Evidence (if present)
    if (duplicateInfo?.is_duplicate) {
      const matchType = duplicateInfo.match_type || 'NEAR';
      const sim = Math.round((duplicateInfo.similarity_score || 0.96) * 100);
      list.push({
        id: 'dup_node',
        title: matchType === 'EXACT' ? 'Exact Duplicate Match' : `${sim}% Similarity Match`,
        subtitle: `Matched: ${duplicateInfo.matched_invoice_id?.slice(0, 14)}...`,
        type: 'duplicate',
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
        iconText: 'DUP'
      });
    }

    // 5. Behavioral Anomaly
    const vendorBeh = behavioralData?.vendor_behavior;
    if (vendorBeh?.ratio_to_max && vendorBeh.ratio_to_max > 1.5) {
      list.push({
        id: 'beh_node',
        title: `${vendorBeh.ratio_to_max.toFixed(1)}× Historical Deviation`,
        subtitle: `Range ₹${(vendorBeh.historical_min/1000).toFixed(0)}k - ₹${(vendorBeh.historical_max/1000).toFixed(0)}k`,
        type: 'behavioral',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FECACA',
        iconText: 'ANOM'
      });
    }

    // 6. Policy Rules
    if (policyViolations && policyViolations.length > 0) {
      policyViolations.forEach((pv, idx) => {
        list.push({
          id: `rule_${pv.rule_id || idx}`,
          title: pv.rule_name || pv.rule_id,
          subtitle: `Risk +${pv.score_contribution} pts · ${pv.description?.slice(0, 30)}...`,
          type: 'rule',
          color: '#EA580C',
          bg: '#FFF7ED',
          border: '#FED7AA',
          iconText: 'RULE'
        });
      });
    }

    // 7. Decision Result
    const isHigh = transaction.decision === 'HIGH_RISK';
    const isAuto = transaction.decision === 'AUTO_PASS';
    list.push({
      id: 'decision_node',
      title: `${transaction.decision.replace('_', ' ')} (Score: ${transaction.risk_score})`,
      subtitle: `Confidence: ${transaction.confidence}%`,
      type: 'decision',
      color: isHigh ? '#DC2626' : isAuto ? '#059669' : '#D97706',
      bg: isHigh ? '#FEF2F2' : isAuto ? '#ECFDF5' : '#FFFBEB',
      border: isHigh ? '#FCA5A5' : isAuto ? '#A7F3D0' : '#FDE68A',
      iconText: isHigh ? 'HOLD' : isAuto ? 'PASS' : 'REV'
    });

    return list;
  }, [transaction, duplicateInfo, behavioralData, policyViolations]);

  return (
    <div className="flex flex-col gap-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
            Explainable Decision Chain
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Every score and routing action is strictly grounded in verifiable transactional evidence.
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
          {chainNodes.length} Linked Nodes
        </span>
      </div>

      {/* Visual Vertical / Flow Graph */}
      <div className="relative pl-6 py-2 space-y-4">
        {chainNodes.map((node, i) => {
          const isLast = i === chainNodes.length - 1;
          const isSelected = selectedNode === node.id;
          return (
            <div key={node.id} className="relative">
              {/* Vertical connector line */}
              {!isLast && (
                <div 
                  className="absolute left-[15px] top-[32px] w-[2px] h-[calc(100%+16px)]"
                  style={{
                    background: `linear-gradient(180deg, ${node.color} 0%, ${chainNodes[i+1]?.color || '#CBD5E1'} 100%)`,
                    opacity: 0.4
                  }}
                />
              )}

              {/* Node Card */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelectedNode(node.id)}
                className={`relative flex items-center gap-4 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-indigo-500 shadow-xs' : 'hover:shadow-xs'
                }`}
                style={{
                  backgroundColor: node.bg,
                  borderColor: isSelected ? node.color : node.border,
                }}
              >
                {/* Node icon pill */}
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 text-white shadow-2xs"
                  style={{
                    backgroundColor: node.color,
                  }}
                >
                  {node.iconText}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#0F172A] truncate">
                    {node.title}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">
                    {node.subtitle}
                  </div>
                </div>

                <div className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white/80 text-slate-700 flex-shrink-0 border border-slate-200">
                  {node.type}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
