'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDateShort, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Database, Download, Search, Filter } from 'lucide-react';

type PeriodFilter = 'all' | 'daily' | 'mtd' | 'ytd';

interface MetricRow {
  id: string;
  unit: string;
  report_date: string;
  period_type: string;
  metric_name: string;
  actual_value: number | null;
  budget_value: number | null;
  variance_value: number | null;
  achievement_percent: number | null;
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'Daily',
  mtd: 'MTD',
  ytd: 'YTD',
};

function metricFormat(metricName: string): 'currency' | 'percent' | 'number' {
  if (/revenue/i.test(metricName)) return 'currency';
  if (/occupancy|achievement/i.test(metricName)) return 'percent';
  return 'number';
}

function formatMetricValue(value: number | null, metricName: string): string {
  if (value === null || value === undefined) return '-';
  const fmt = metricFormat(metricName);
  return fmt === 'currency'
    ? formatCurrency(value)
    : fmt === 'percent'
      ? formatPercent(value)
      : formatNumber(value);
}

export default function AdminReportsPage() {
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      let query = supabase
        .from('report_metrics')
        .select(
          'id, metric_name, actual_value, budget_value, variance_value, achievement_percent, ' +
            'daily_reports!inner(id, report_date, period_type, business_units!inner(name))',
        )
        .order('metric_name', { ascending: true });

      if (date) {
        query = query.eq('daily_reports.report_date', date);
      }
      if (period !== 'all') {
        query = query.eq('daily_reports.period_type', period);
      }

      const { data, error: dbError } = await query;

      if (dbError) throw dbError;

      const rows: MetricRow[] = (data || []).map((r) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = r as any;
        const dr = raw.daily_reports ?? {};
        return {
          id: raw.id,
          unit: dr.business_units?.name ?? 'Unknown',
          report_date: dr.report_date,
          period_type: dr.period_type,
          metric_name: raw.metric_name,
          actual_value: raw.actual_value,
          budget_value: raw.budget_value,
          variance_value: raw.variance_value,
          achievement_percent: raw.achievement_percent,
        };
      });

      // Deterministic ordering: newest report first, then unit, then metric name.
      rows.sort((a, b) => {
        if (a.report_date !== b.report_date) return a.report_date < b.report_date ? 1 : -1;
        if (a.unit !== b.unit) return a.unit.localeCompare(b.unit);
        return a.metric_name.localeCompare(b.metric_name);
      });

      setMetrics(rows);
    } catch (err) {
      console.error('[Data Reports] Error loading metrics:', err);
      setError('Gagal memuat data metrics dari database.');
    } finally {
      setLoading(false);
    }
  }, [date, period]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const filtered = search
    ? metrics.filter(
        (m) =>
          m.unit.toLowerCase().includes(search.toLowerCase()) ||
          m.metric_name.toLowerCase().includes(search.toLowerCase()),
      )
    : metrics;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Reports</h1>
          <p className="page-subtitle">Data laporan terstruktur dari database</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari unit atau metric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm ml-2 w-full"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-field w-auto"
        />
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['all', 'daily', 'mtd', 'ytd'] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                period === p
                  ? 'bg-labersa text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p === 'all' ? 'Semua' : PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="h-4 bg-gray-200 rounded w-40 mx-auto mb-3 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-64 mx-auto animate-pulse" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">
              {metrics.length === 0
                ? 'Belum ada data metrics yang tersimpan.'
                : 'Tidak ada metric yang cocok dengan filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 font-medium">Unit</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Period</th>
                  <th className="px-5 py-3 font-medium">Metric</th>
                  <th className="px-5 py-3 font-medium text-right">Actual</th>
                  <th className="px-5 py-3 font-medium text-right">Budget</th>
                  <th className="px-5 py-3 font-medium text-right">Variance</th>
                  <th className="px-5 py-3 font-medium text-right">Achievement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const budgetUnavailable =
                    item.budget_value === null || item.budget_value === 0;
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {formatDateShort(item.report_date)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.period_type === 'daily'
                              ? 'bg-green-100 text-green-700'
                              : item.period_type === 'mtd'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          {PERIOD_LABELS[item.period_type] ?? item.period_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                        {item.metric_name}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                        {formatMetricValue(item.actual_value, item.metric_name)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-500">
                        {budgetUnavailable
                          ? 'Budget tidak tersedia'
                          : formatMetricValue(item.budget_value, item.metric_name)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-500">
                        {formatMetricValue(item.variance_value, item.metric_name)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {budgetUnavailable ? (
                          <span className="text-gray-400">-</span>
                        ) : item.achievement_percent !== null ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              item.achievement_percent >= 100
                                ? 'bg-emerald-100 text-emerald-700'
                                : item.achievement_percent >= 90
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {formatPercent(item.achievement_percent)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
