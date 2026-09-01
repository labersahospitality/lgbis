import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, parseISO } from 'date-fns';
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

export function getDateRange(filter: string, customStart?: string, customEnd?: string): { start: string; end: string } {
  const today = new Date();

  switch (filter) {
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
      return 'bg-blue-100 text-blue-800';
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
