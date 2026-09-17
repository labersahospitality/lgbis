import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, subDays, startOfMonth, startOfYear, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}

export function formatMetricValue(value: number | null, format: 'currency' | 'percent' | 'number'): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'number':
      return formatNumber(value);
    default:
      return String(value ?? '-');
  }
}

export function calculateVariance(actual: number | null, budget: number | null): number | null {
  if (actual === null || budget === null) return null;
  return actual - budget;
}

export function calculateAchievement(actual: number | null, budget: number | null): number | null {
  if (actual === null || budget === null || budget === 0) return null;
  return (actual / budget) * 100;
}

/**
 * Compute the date range for a dashboard filter.
 *
 * @param filter      One of the DateFilter values
 * @param latestDate  The latest available report date (YYYY-MM-DD).
 *                    When provided, all date calculations use this as the
 *                    reference point instead of `new Date()` (computer clock).
 *                    This ensures the dashboard defaults to real data, not
 *                    an empty "today" that has no reports yet.
 * @param customStart Custom start date (used only when filter='custom')
 * @param customEnd   Custom end date   (used only when filter='custom')
 */
export function getDateRange(
  filter: string,
  latestDate?: string | null,
  customStart?: string,
  customEnd?: string,
): { start: string; end: string } {
  // Calendar clock — used by all filters EXCEPT 'latest'
  const today = new Date();

  switch (filter) {
    // ── Filters that use the COMPUTER CLOCK ────────────────
    case 'today':
      return { start: format(today, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') };

    case 'yesterday': {
      const yesterday = subDays(today, 1);
      return { start: format(yesterday, 'yyyy-MM-dd'), end: format(yesterday, 'yyyy-MM-dd') };
    }

    case 'this_month':
      return {
        start: format(startOfMonth(today), 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd'),
      };

    case 'previous_month': {
      const prevMonthEnd = subDays(startOfMonth(today), 1);
      return {
        start: format(startOfMonth(prevMonthEnd), 'yyyy-MM-dd'),
        end: format(prevMonthEnd, 'yyyy-MM-dd'),
      };
    }

    case 'ytd':
      return {
        start: format(startOfYear(today), 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd'),
      };

    // ── 'latest': uses latestReportDate ─────────────────────
    case 'latest': {
      const refDate = latestDate ? parseISO(latestDate) : today;
      return {
        start: format(startOfYear(refDate), 'yyyy-MM-dd'),
        end: format(refDate, 'yyyy-MM-dd'),
      };
    }

    case 'custom':
      return {
        start: customStart || format(startOfMonth(today), 'yyyy-MM-dd'),
        end: customEnd || format(today, 'yyyy-MM-dd'),
      };

    default:
      return { start: format(startOfMonth(today), 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') };
  }
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: id });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'saved':
      return 'bg-emerald-100 text-emerald-800';
    case 'parsed':
      return 'bg-green-100 text-green-800';
    case 'need_review':
      return 'bg-amber-100 text-amber-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'saved':
      return 'Tersimpan';
    case 'parsed':
      return 'Terparse';
    case 'need_review':
      return 'Perlu Review';
    case 'error':
      return 'Error';
    default:
      return status;
  }
}

export function getTrendColor(trend: number | null): string {
  if (trend === null) return 'text-gray-500';
  if (trend > 0) return 'text-emerald-600';
  if (trend < 0) return 'text-red-600';
  return 'text-gray-500';
}

// ── Snapshot Query Helpers ────────────────────────────────────

/**
 * Compute the Supabase filter range for an MTD snapshot query.
 * MTD snapshots must come from the SAME month and year as selectedDate,
 * and report_date must be <= selectedDate.
 *
 * Returns { monthStart, monthEnd } as YYYY-MM-DD strings.
 */
export function getMtdSnapshotRange(selectedDate: string): {
  monthStart: string;
  monthEnd: string;
} {
  const d = parseISO(selectedDate);
  return {
    monthStart: format(startOfMonth(d), 'yyyy-MM-dd'),
    monthEnd: format(d, 'yyyy-MM-dd'),
  };
}

/**
 * Compute the Supabase filter range for a YTD snapshot query.
 * YTD snapshots must come from the SAME year as selectedDate,
 * and report_date must be <= selectedDate.
 *
 * Returns { yearStart, yearEnd } as YYYY-MM-DD strings.
 */
export function getYtdSnapshotRange(selectedDate: string): {
  yearStart: string;
  yearEnd: string;
} {
  const d = parseISO(selectedDate);
  return {
    yearStart: format(startOfYear(d), 'yyyy-MM-dd'),
    yearEnd: format(d, 'yyyy-MM-dd'),
  };
}
