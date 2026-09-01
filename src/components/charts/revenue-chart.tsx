'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface RevenueChartProps {
  data: Array<{
    name: string;
    actual: number;
    budget: number | null;
  }>;
  title: string;
  height?: number;
  isDemo?: boolean;
}

export default function RevenueChart({ data, title, height = 350, isDemo = false }: RevenueChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {isDemo && (
          <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">DEMO</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any) => [`Rp ${(Number(value) / 1000000).toFixed(1)}M`, '']) as any}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend />
          <Bar dataKey="actual" name="Actual" fill="#2563eb" radius={[4, 4, 0, 0]} />
          <Bar dataKey="budget" name="Budget" fill="#d1d5db" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
