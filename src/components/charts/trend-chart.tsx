'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface TrendChartProps {
  data: Array<{
    date: string;
    actual: number;
    budget: number | null;
  }>;
  title: string;
  height?: number;
  isDemo?: boolean;
}

export default function TrendChart({ data, title, height = 300, isDemo = false }: TrendChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {isDemo && (
          <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">DEMO</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any) => [`Rp ${(Number(value) / 1000000).toFixed(1)}M`, '']) as any}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="budget"
            name="Budget"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
