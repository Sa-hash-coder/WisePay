'use client';
import { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

const chartData = [
  { time: '0.0', yellow: 0.1, blue: 0.2, green: 0.3, callout: null },
  { time: '0.2', yellow: 0.15, blue: 0.22, green: 0.35, callout: null },
  { time: '0.4', yellow: 0.35, blue: 0.38, green: 0.48, callout: '₹370k' },
  { time: '0.6', yellow: 0.42, blue: 0.48, green: 0.62, callout: '₹570k' },
  { time: '0.8', yellow: 0.65, blue: 0.72, green: 0.88, callout: '₹770k' },
  { time: '1.0', yellow: 0.78, blue: 0.85, green: 1.05, callout: null },
  { time: '1.2', yellow: 0.82, blue: 0.88, green: 1.12, callout: null },
];

export function ProfitLossMonitoringChart() {
  const [range, setRange] = useState<'Monthly' | 'Weekly' | 'Daily'>('Monthly');

  return (
    <div className="bg-white border border-[#E2ECE4] rounded-2xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
      {/* Header with Monthly/Weekly/Daily toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
            Profit & Loss / Exposure Monitoring
          </h3>
          <p className="text-[#64748B] text-xs mt-0.5">
            Real-time loss mitigation curves and velocity anomalies over fiscal cycles
          </p>
        </div>

        {/* Timeframe Pill Toggle (Finlytics style) */}
        <div className="flex items-center gap-1 bg-[#F3F8F4] border border-[#E2ECE4] p-1 rounded-full text-xs font-semibold text-[#64748B]">
          {(['Monthly', 'Weekly', 'Daily'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setRange(t)}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                range === t
                  ? 'bg-white text-[#0F172A] shadow-xs font-bold border border-[#E2ECE4]'
                  : 'hover:text-[#0F172A]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-line smooth curves chart */}
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF4EE" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: '#94A3B8' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94A3B8' }} 
              axisLine={false} 
              tickLine={false}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                border: 'none',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#FFFFFF',
              }}
            />
            {/* Smooth Spline Curves: Yellow, Blue, Green */}
            <Line 
              type="monotone" 
              dataKey="yellow" 
              stroke="#F59E0B" 
              strokeWidth={2.5} 
              dot={{ fill: '#F59E0B', r: 4, strokeWidth: 2, stroke: '#FFFFFF' }} 
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              dataKey="blue" 
              stroke="#3B82F6" 
              strokeWidth={2.5} 
              dot={{ fill: '#3B82F6', r: 4, strokeWidth: 2, stroke: '#FFFFFF' }} 
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              dataKey="green" 
              stroke="#10B981" 
              strokeWidth={3} 
              dot={{ fill: '#10B981', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }} 
              activeDot={{ r: 7 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Floating Badges summary underneath */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#EAEFEA] text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span>Target Velocity</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#3B82F6] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            <span>Baseline Spend</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#F59E0B] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span>Recovered Losses</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] bg-[#0F172A] text-white px-3 py-1 rounded-lg">
          <span>Active Loss Prevention:</span>
          <span className="text-[#4ADE80] font-bold">₹38,72,940</span>
        </div>
      </div>
    </div>
  );
}
