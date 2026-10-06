'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

interface NetworkNode {
  id: string;
  label: string;
  type: 'employee' | 'vendor';
  count?: number;
  dept?: string;
  category?: string;
  x?: number;
  y?: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  count: number;
}

const getNodeColor = (type: string) => {
  if (type === 'employee') return '#4F46E5';
  return '#7C3AED';
};

export function NetworkGraph() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [laid, setLaid] = useState<NetworkNode[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    api.dashboard.network()
      .then(data => {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      })
      .catch(() => {
        setNodes([
          { id: 'emp_E001', label: 'Employee 1', type: 'employee', count: 15 },
          { id: 'emp_E002', label: 'Employee 2', type: 'employee', count: 8 },
          { id: 'emp_E003', label: 'Employee 3', type: 'employee', count: 12 },
          { id: 'ven_V003', label: 'Office Supplies', type: 'vendor', count: 25 },
          { id: 'ven_V002', label: 'TCS', type: 'vendor', count: 18 },
          { id: 'ven_V009', label: 'LegalEase', type: 'vendor', count: 10 },
        ]);
        setEdges([
          { source: 'emp_E001', target: 'ven_V003', weight: 1500000, count: 14 },
          { source: 'emp_E002', target: 'ven_V002', weight: 800000, count: 6 },
          { source: 'emp_E003', target: 'ven_V009', weight: 2000000, count: 10 },
          { source: 'emp_E001', target: 'ven_V002', weight: 400000, count: 3 },
        ]);
      });
  }, []);

  useEffect(() => {
    if (!nodes.length) return;
    const W = 340, H = 200;
    const employees = nodes.filter(n => n.type === 'employee');
    const vendors = nodes.filter(n => n.type === 'vendor');

    const positioned: NetworkNode[] = [
      ...employees.map((n, i) => ({
        ...n,
        x: 80,
        y: 30 + (i * (H - 40)) / Math.max(employees.length - 1, 1)
      })),
      ...vendors.map((n, i) => ({
        ...n,
        x: W - 80,
        y: 30 + (i * (H - 40)) / Math.max(vendors.length - 1, 1)
      })),
    ];
    setLaid(positioned);
  }, [nodes]);

  const getNode = (id: string) => laid.find(n => n.id === id);
  const maxWeight = Math.max(...edges.map(e => e.weight), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Relationship Anomaly Map</h3>
        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">Flagged transactions only</span>
      </div>
      
      <svg ref={svgRef} width="100%" viewBox="0 0 340 200" className="overflow-visible">
        {/* Grid line */}
        <line x1="170" y1="0" x2="170" y2="200" stroke="#F3F4F6" strokeWidth="0.5" strokeDasharray="4 4" />
        
        {/* Column labels */}
        <text x="80" y="15" textAnchor="middle" fill="#9CA3AF" fontSize="9" fontFamily="system-ui">EMPLOYEES</text>
        <text x="260" y="15" textAnchor="middle" fill="#9CA3AF" fontSize="9" fontFamily="system-ui">VENDORS</text>
        
        {/* Edges */}
        {edges.map((edge, i) => {
          const src = getNode(edge.source);
          const tgt = getNode(edge.target);
          if (!src || !tgt) return null;
          const opacity = 0.15 + (edge.weight / maxWeight) * 0.5;
          const strokeW = 0.5 + (edge.count / 15) * 2.5;
          const isAnomaly = edge.count > 10;
          return (
            <g key={i}>
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={isAnomaly ? '#DC2626' : '#A78BFA'}
                strokeWidth={strokeW}
                strokeOpacity={opacity}
                strokeDasharray={isAnomaly ? '4 2' : undefined}
              />
              {isAnomaly && (
                <text
                  x={(src.x! + tgt.x!) / 2} y={(src.y! + tgt.y!) / 2 - 5}
                  textAnchor="middle" fill="#DC2626" fontSize="7"
                >
                  ⚠ {edge.count} invoices
                </text>
              )}
            </g>
          );
        })}
        
        {/* Nodes */}
        {laid.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x} cy={node.y}
              r={6 + Math.min(8, (node.count || 1) * 0.3)}
              fill={getNodeColor(node.type)}
              fillOpacity={0.15}
              stroke={getNodeColor(node.type)}
              strokeWidth={1.5}
              strokeOpacity={0.6}
            />
            <circle
              cx={node.x} cy={node.y}
              r={3}
              fill={getNodeColor(node.type)}
            />
            <text
              x={node.x} y={node.y! - 14}
              textAnchor="middle" fill="#6B7280" fontSize="8"
              className="select-none"
            >
              {node.label.length > 14 ? node.label.slice(0, 12) + '…' : node.label}
            </text>
          </g>
        ))}
      </svg>
      
      <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Employees
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-violet-500" /> Vendors
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-4 h-0.5 bg-red-500" style={{borderTop: '1px dashed #DC2626'}} /> Anomalous cluster
        </div>
      </div>
    </div>
  );
}
