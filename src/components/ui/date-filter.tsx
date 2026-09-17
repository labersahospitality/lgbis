'use client';

import { useState } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
  /** The latest available report date from Supabase */
  latestDate?: string | null;
  /** The actual selected date being used for queries (resolved from filter) */
  selectedDate?: string | null;
  /** Source date for MTD/YTD data (may differ from selectedDate when fallback) */
  mtdSourceDate?: string | null;
  ytdSourceDate?: string | null;
  className?: string;
}

const FILTERS = [
  { value: 'latest', label: 'Latest' },
  { value: 'today', label: 'Hari Ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'previous_month', label: 'Bulan Lalu' },
  { value: 'ytd', label: 'YTD' },
  { value: 'custom', label: 'Custom' },
];

export default function DateFilter({
  value,
  onChange,
  latestDate,
  selectedDate,
  mtdSourceDate,
  ytdSourceDate,
  className,
}: DateFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handleCustomSubmit = () => {
    if (customStart && customEnd) {
      onChange(`custom:${customStart}:${customEnd}`);
    }
  };

  // Parse the current filter to get display info
  const isCustom = value.startsWith('custom:');
  const customParts = isCustom ? value.split(':') : [];
  const displayStart = isCustom ? customParts[1] : null;
  const displayEnd = isCustom ? customParts[2] : selectedDate;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              if (filter.value === 'custom') {
                setShowCustom(!showCustom);
                if (!showCustom) {
                  onChange('custom');
                }
              } else {
                setShowCustom(false);
                onChange(filter.value);
              }
            }}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
              value === filter.value || (filter.value === 'custom' && isCustom)
                ? 'bg-labersa text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      {showCustom && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md"
          />
          <span className="text-sm text-gray-500">s/d</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md"
          />
          <button
            onClick={handleCustomSubmit}
            className="px-3 py-1 text-sm font-medium text-white bg-labersa rounded-md hover:bg-labersa-dark"
          >
            Terapkan
          </button>
        </div>
      )}

      {/* Date Display */}
      {selectedDate && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">Tanggal Laporan:</span>
            <span className="text-gray-900">
              {isCustom && displayStart
                ? `${formatDate(displayStart)} — ${formatDate(displayEnd || selectedDate)}`
                : formatDate(selectedDate)
              }
            </span>
          </div>

          {/* Source date warnings — shown when source differs from selected */}
          {mtdSourceDate && mtdSourceDate !== selectedDate && (
            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              MTD sumber: {formatDate(mtdSourceDate)}
            </div>
          )}
          {ytdSourceDate && ytdSourceDate !== selectedDate && (
            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              YTD sumber: {formatDate(ytdSourceDate)}
            </div>
          )}

          {latestDate && value === 'latest' && (
            <div className="text-xs text-labersa bg-labersa/50 px-2 py-0.5 rounded">
              Data terakhir: {formatDate(latestDate)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
