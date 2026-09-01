'use client';

import { cn } from '@/lib/utils';

interface ComparisonRow {
  unit_name: string;
  division?: string;
  metrics: {
    label: string;
    value: number | null;
    format: 'currency' | 'percent' | 'number';
  }[];
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
  title: string;
  isDemo?: boolean;
}

function formatValue(value: number | null, format: 'currency' | 'percent' | 'number'): string {
  if (value === null) return '-';
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number':
      return new Intl.NumberFormat('id-ID').format(value);
  }
}

export default function ComparisonTable({ rows, title, isDemo = false }: ComparisonTableProps) {
  if (rows.length === 0) return null;

  const metricLabels = rows[0].metrics.map((m) => m.label);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {isDemo && (
          <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">DEMO</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">Unit</th>
              {rows[0].division && <th className="pb-2 font-medium">Divisi</th>}
              {metricLabels.map((label) => (
                <th key={label} className="pb-2 font-medium text-right">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 font-medium text-gray-900">{row.unit_name}</td>
                {row.division && <td className="py-3 text-gray-500">{row.division}</td>}
                {row.metrics.map((metric, j) => (
                  <td key={j} className="py-3 text-right text-gray-700">
                    {formatValue(metric.value, metric.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
