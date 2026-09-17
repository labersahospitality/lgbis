'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { FileText, Download, Filter } from 'lucide-react';

interface RawImport {
  id: string;
  business_unit_id: string;
  report_date: string;
  status: string;
  created_at: string;
  source: string;
  admin: string;
  unit: string;
  parsed_data: unknown;
}

interface GroupedReport {
  key: string;
  unit: string;
  report_date: string;
  periods: string[];
  status: string;
  admin: string;
  source: string;
  rowCount: number;
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'Daily',
  mtd: 'MTD',
  ytd: 'YTD',
};

const PERIOD_ORDER = ['daily', 'mtd', 'ytd'];

const PERIOD_BADGE_COLOR: Record<string, string> = {
  daily: 'bg-green-100 text-green-700',
  mtd: 'bg-purple-100 text-purple-700',
  ytd: 'bg-teal-100 text-teal-700',
};

// Grouped status priority: most severe wins.
const STATUS_PRIORITY: Record<string, number> = {
  error: 4,
  need_review: 3,
  parsed: 2,
  saved: 1,
};

const STATUS_BY_PRIORITY = ['saved', 'parsed', 'need_review', 'error'];

/**
 * report_imports has no period_type column; each import row corresponds to one
 * period group and its stored parsed_data holds the metric array of that group.
 * The period is recovered from the metric name prefixes (today_/mtd_/ytd_).
 */
function periodFromParsedData(pd: unknown): string | null {
  if (pd === null || pd === undefined) return null;
  let arr: unknown = pd;
  if (typeof pd === 'string') {
    try {
      arr = JSON.parse(pd);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(arr)) return null;
  const names = (arr as Array<{ name?: unknown }>).map((m) =>
    m && typeof m.name === 'string' ? m.name : '',
  );
  if (names.some((n) => n.startsWith('today_'))) return 'daily';
  if (names.some((n) => n.startsWith('mtd_'))) return 'mtd';
  if (names.some((n) => n.startsWith('ytd_'))) return 'ytd';
  return null;
}

function groupStatus(rows: RawImport[]): string {
  let highest = 0;
  for (const r of rows) {
    const p = STATUS_PRIORITY[r.status];
    if (p !== undefined && p > highest) highest = p;
  }
  return highest > 0 ? STATUS_BY_PRIORITY[highest - 1] : 'saved';
}

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [reports, setReports] = useState<GroupedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const [importRes, periodsRes] = await Promise.all([
        supabase
          .from('report_imports')
          .select(
            'id, business_unit_id, report_date, status, created_at, parsed_data, ' +
              'business_units!inner(name), users!report_imports_created_by_fkey(full_name, email)',
          )
          .order('created_at', { ascending: false }),
        // daily_reports.period_type is the authoritative record of which
        // periods (daily/mtd/ytd) exist for each unit+report-date.
        supabase.from('daily_reports').select('business_unit_id, report_date, period_type'),
      ]);

      if (importRes.error) throw importRes.error;
      if (periodsRes.error) throw periodsRes.error;

      const periodsByKey = new Map<string, string[]>();
      for (const dr of periodsRes.data || []) {
        const key = `${dr.business_unit_id}|${dr.report_date}`;
        const list = periodsByKey.get(key) ?? [];
        if (!list.includes(dr.period_type)) list.push(dr.period_type);
        periodsByKey.set(key, list);
      }
      for (const list of Array.from(periodsByKey.values())) {
        list.sort((a: string, b: string) => PERIOD_ORDER.indexOf(a) - PERIOD_ORDER.indexOf(b));
      }

      const { data } = importRes;

      const rows: RawImport[] = (data || []).map((r) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = r as any;
        const unitName = raw.business_units?.name ?? raw.business_unit_id;
        const user = raw.users ?? {};
        return {
          id: raw.id,
          business_unit_id: raw.business_unit_id,
          report_date: raw.report_date,
          status: raw.status,
          created_at: raw.created_at,
          parsed_data: raw.parsed_data,
          source: 'WhatsApp',
          admin: user.full_name || user.email || 'Admin',
          unit: unitName,
        };
      });

      // Group by business_unit_id + report_date → one management-ledger row each.
      const groups = new Map<string, RawImport[]>();
      for (const row of rows) {
        const key = `${row.business_unit_id}|${row.report_date}`;
        const bucket = groups.get(key);
        if (bucket) bucket.push(row);
        else groups.set(key, [row]);
      }

      const grouped: GroupedReport[] = Array.from(groups.entries()).map(
        ([key, groupRows]) => {
          // Prefer the authoritative daily_reports periods for this unit+date;
          // fall back to deriving from stored parsed_data metric prefixes.
          const periods = periodsByKey.get(key) ?? Array.from(
            new Set(
              groupRows
                .map((r) => periodFromParsedData(r.parsed_data))
                .filter((p): p is string => p !== null),
            ),
          ).sort((a, b) => PERIOD_ORDER.indexOf(a) - PERIOD_ORDER.indexOf(b));

          const admins = Array.from(new Set(groupRows.map((r) => r.admin)));
          const sources = Array.from(new Set(groupRows.map((r) => r.source)));

          return {
            key,
            unit: groupRows[0].unit,
            report_date: groupRows[0].report_date,
            periods,
            status: groupStatus(groupRows),
            admin: admins.length === 1 ? admins[0] : 'Multiple Admin',
            source: sources.length === 1 ? sources[0] : 'Multiple',
            rowCount: groupRows.length,
          };
        },
      );

      // Tanggal laporan terbaru → terlama, lalu nama unit A→Z.
      grouped.sort((a, b) => {
        const d = b.report_date.localeCompare(a.report_date);
        if (d !== 0) return d;
        return a.unit.localeCompare(b.unit);
      });

      setReports(grouped);
    } catch (err) {
      console.error('[Laporan] Error loading reports:', err);
      setError('Gagal memuat data laporan dari database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports =
    statusFilter === 'all'
      ? reports
      : reports.filter((r) => r.status === statusFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan</h1>
          <p className="page-subtitle">Daftar seluruh laporan yang telah diinput</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        {['all', 'saved', 'parsed', 'need_review', 'error'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              statusFilter === s
                ? 'bg-labersa text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'Semua' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      {/* Table */}
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
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">
              {statusFilter === 'all'
                ? 'Belum ada laporan yang tersimpan.'
                : `Tidak ada laporan dengan status ${getStatusLabel(statusFilter)}.`}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium">Tanggal Laporan</th>
                <th className="px-5 py-3 font-medium">Periode</th>
                <th className="px-5 py-3 font-medium">Admin</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr
                  key={report.key}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {report.unit}
                      </span>
                      {report.rowCount > 1 && (
                        <span className="text-xs text-gray-400">
                          ({report.rowCount} import)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {formatDateShort(report.report_date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {report.periods.length > 0 ? (
                        report.periods.map((p) => (
                          <span
                            key={p}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              PERIOD_BADGE_COLOR[p] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {PERIOD_LABELS[p] ?? p}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{report.admin}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        report.status,
                      )}`}
                    >
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{report.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
