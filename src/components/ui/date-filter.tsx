'use client';

import { cn } from '@/lib/utils';

interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const FILTERS = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'previous_month', label: 'Bulan Lalu' },
  { value: 'ytd', label: 'YTD' },
  { value: 'custom', label: 'Custom' },
];

export default function DateFilter({ value, onChange, className }: DateFilterProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
            value === filter.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
