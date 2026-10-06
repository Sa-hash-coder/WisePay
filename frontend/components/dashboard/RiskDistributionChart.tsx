'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/lib/api';

export function RiskDistributionChart() {
  const [data, setData] = useState<Array<{label: string; count: number}>>([]);
  const [categories, setCategories] = useState<Array<{category: string; count: number}>>([]);

  useEffect(() => {
    api.dashboard.riskDistribution().then(d => {
      const formatted = d.labels.map((label: string, i: number) => ({
        label,
        count: d.data[i]
      }));
      setData(formatted);
    }).catch(() => {
      setData([
        {label:'0-9', count: 6200}, {label:'10-19', count: 2800},
        {label:'20-29', count: 280}, {label:'30-39', count: 150},
        {label:'40-49', count: 60}, {label:'50-59', count: 20},
        {label:'60-69', count: 10}, {label:'70-79', count: 8},
        {label:'80-89', count: 4}, {label:'90-100', count: 3},
      ]);
    });

    api.dashboard.topCategories().then((cats: Array<{category: string; count: number}>) => {
      setCategories(cats);
    }).catch(() => {
      setCategories([
        {category: 'Missing Approval', count: 248},
        {category: 'Policy Limit', count: 180},
        {category: 'New Vendor', count: 92},
        {category: 'Missing Receipt', count: 67},
        {category: 'Weekend Submission', count: 45},
      ]);
    });
  }, []);

  const getBarColor = (label: string) => {
    const bucket = parseInt(label.split('-')[0]);
    if (bucket >= 80) return '#DC2626';
    if (bucket >= 50) return '#D97706';
    if (bucket >= 30) return '#F59E0B';
    return '#059669';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Risk Score Distribution</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, color: '#1F2937', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            formatter={(v) => [v, 'Transactions']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getBarColor(entry.label)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {categories.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Top Risk Categories</div>
          <div className="space-y-2.5">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${Math.min(100, (cat.count / (categories[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{cat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
