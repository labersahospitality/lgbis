'use client';

import { cn } from '@/lib/utils';

interface RankingItem {
  rank: number;
  name: string;
  value: number;
  budget: number | null;
  achievement: number | null;
  format: 'currency' | 'percent' | 'number';
}

interface RankingTableProps {
  items: RankingItem[];
  title: string;
  valueLabel?: string;
  isDemo?: boolean;
}

function formatValue(value: number, format: 'currency' | 'percent' | 'number'): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number':
      return new Intl.NumberFormat('id-ID').format(value);
  }
}

function getRankBadge(rank: number) {
  switch (rank) {
    case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 2: return 'bg-gray-100 text-gray-600 border-gray-300';
    case 3: return 'bg-orange-100 text-orange-700 border-orange-300';
    default: return 'bg-gray-50 text-gray-500 border-gray-200';
  }
}

export default function RankingTable({ items, title, valueLabel = 'Revenue', isDemo = false }: RankingTableProps) {
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
              <th className="pb-2 font-medium w-10">#</th>
              <th className="pb-2 font-medium">Unit</th>
              <th className="pb-2 font-medium text-right">{valueLabel}</th>
              <th className="pb-2 font-medium text-right">Achievement</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.rank} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3">
                  <span className={cn(
                    'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border',
                    getRankBadge(item.rank)
                  )}>
                    {item.rank}
                  </span>
                </td>
                <td className="py-3 font-medium text-gray-900">{item.name}</td>
                <td className="py-3 text-right text-gray-700">
                  {formatValue(item.value, item.format)}
                </td>
                <td className="py-3 text-right">
                  {item.achievement !== null ? (
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
                      item.achievement >= 100 ? 'bg-emerald-100 text-emerald-700' :
                      item.achievement >= 90 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {item.achievement.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
