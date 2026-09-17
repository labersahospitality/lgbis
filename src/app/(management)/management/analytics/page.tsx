'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DateFilter from '@/components/ui/date-filter';
import RevenueChart from '@/components/charts/revenue-chart';
import TrendChart from '@/components/charts/trend-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import { createClient } from '@/lib/supabase/client';
import {
  fetchRevenueChart,
  fetchDailyTrend,
  fetchDivisionData,
  fetchLatestReportDate,
  type ChartData,
  type TrendData,
  type DivisionUnitData,
  type DivisionPeriodData,
} from '@/lib/dashboard-data';
import { CANONICAL_REVENUE_METRIC } from '@/lib/constants';
import { getDateRange, getMtdSnapshotRange } from '@/lib/utils';
import { parseISO } from 'date-fns';

// ── Types & constants ────────────────────────────────────────

type Period = 'daily' | 'mtd' | 'ytd';

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Harian' },
  { key: 'mtd', label: 'Bulanan' },
  { key: 'ytd', label: 'YTD' },
];

const PERIOD_LABEL: Record<Period, string> = {
  daily: 'Harian',
  mtd: 'MTD',
  ytd: 'YTD',
};

interface AchievementItem {
  name: string;
  achievement: number | null;
}

interface BudgetRow {
  business_unit_id: string;
  metric_name: string;
  budget_value: number;
  period_type: string;
  year: number;
  month: number;
  day: number | null;
}

/** Revenue budget metric names as stored in the `budgets` table (unprefixed). */
const REVENUE_BUDGET_METRICS = ['total_revenue', 'revenue'];

// ── Helpers ───────────────────────────────────────────────────

/** Canonical revenue metric name for a division + period (single source of truth). */
function revenueMetric(divisionId: string, period: Period): string {
  const key = period === 'daily' ? 'today' : period;
  if (divisionId === 'div-hotel') return CANONICAL_REVENUE_METRIC.HOTEL[key];
  if (divisionId === 'div-waterpark') return CANONICAL_REVENUE_METRIC.WATERPARK[key];
  return CANONICAL_REVENUE_METRIC.GOLF[key];
}

function periodDataOf(unit: DivisionUnitData, period: Period): DivisionPeriodData {
  if (period === 'daily') return unit.today;
  if (period === 'mtd') return unit.mtd;
  return unit.ytd;
}

/**
 * Resolve achievement % for a period — mirrors Hotel Dashboard pattern:
 * actual / budget × 100 when budget > 0, else stored achievement_percent,
 * else null. Never invents a budget.
 */
function resolveAchievement(
  stored: number | null | undefined,
  actual: number,
  budget: number | null | undefined,
): number | null {
  if (budget !== null && budget !== undefined && budget > 0) {
    return (actual / budget) * 100;
  }
  if (stored !== null && stored !== undefined) return stored;
  return null;
}

function buildAchievementItems(
  units: DivisionUnitData[],
  divisionId: string,
  period: Period,
): AchievementItem[] {
  const metric = revenueMetric(divisionId, period);
  return units.map((u) => {
    const p = periodDataOf(u, period);
    const budgetRaw = p.budgets.get(metric);
    const budget = budgetRaw !== null && budgetRaw !== undefined && budgetRaw > 0 ? budgetRaw : null;
    const actual = p.sourceDate !== null ? (p.metrics.get(metric) ?? 0) : 0;
    return {
      name: u.unitName,
      achievement: resolveAchievement(p.achievements.get(metric), actual, budget),
    };
  });
}

/** Sum canonical revenue across units that actually reported for the period. */
function sumUnitRevenue(units: DivisionUnitData[], divisionId: string, period: Period): number {
  const metric = revenueMetric(divisionId, period);
  let total = 0;
  for (const u of units) {
    const p = periodDataOf(u, period);
    if (p.sourceDate === null) continue;
    total += p.metrics.get(metric) ?? 0;
  }
  return total;
}

/**
 * Whether at least one unit in the division actually has a report for the period.
 * Presence is based on sourceDate (report exists), NOT on actual > 0:
 * an actual value of 0 (e.g. Golf revenue Rp0 on 31/08) is still valid data.
 */
function divisionHasReport(units: DivisionUnitData[], period: Period): boolean {
  return units.some((u) => periodDataOf(u, period).sourceDate !== null);
}

/**
 * Division budget from the `budgets` table (real data only).
 * - daily → daily budget rows for the reference day
 * - mtd   → monthly budget rows of the reference month
 * - ytd   → monthly budget rows summed over the whole year
 * Returns null when no budget row exists (never fabricates 0).
 */
function divisionBudget(
  rows: BudgetRow[],
  unitIds: string[],
  metricNames: string[],
  period: Period,
  refMonth: number,
  refDay: number,
): number | null {
  let sum = 0;
  let found = false;
  for (const b of rows) {
    if (!unitIds.includes(b.business_unit_id)) continue;
    if (!metricNames.includes(b.metric_name)) continue;
    const isDaily = period === 'daily' && b.period_type === 'daily' && b.day === refDay && b.month === refMonth;
    const isMtd = period === 'mtd' && b.period_type === 'monthly' && b.month === refMonth;
    const isYtd = period === 'ytd' && b.period_type === 'monthly';
    if (isDaily || isMtd || isYtd) {
      sum += Number(b.budget_value);
      found = true;
    }
  }
  return found ? sum : null;
}

function latestSource(units: DivisionUnitData[], periodType: 'mtd' | 'ytd'): string | null {
  let latest: string | null = null;
  for (const u of units) {
    const d = periodType === 'mtd' ? u.mtd.sourceDate : u.ytd.sourceDate;
    if (d && (latest === null || d > latest)) latest = d;
  }
  return latest;
}

function formatRpM(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return `Rp ${(value / 1000000000).toFixed(1)}M`;
}

function EmptyCard({ title, message }: { title: string; message?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-full">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-4">{message ?? 'Data belum tersedia untuk periode ini.'}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('mtd');

  const [dateFilter, setDateFilter] = useState('latest');
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [monthlySeries, setMonthlySeries] = useState<ChartData[]>([]);
  const [monthlyBudgetByMonth, setMonthlyBudgetByMonth] = useState<Map<number, number>>(new Map());
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>([]);
  const [hotelUnits, setHotelUnits] = useState<DivisionUnitData[]>([]);
  const [wpUnits, setWpUnits] = useState<DivisionUnitData[]>([]);
  const [golfUnits, setGolfUnits] = useState<DivisionUnitData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [trendBudgetsByDay, setTrendBudgetsByDay] = useState<Map<number, number>>(new Map());
  const [refMonthDay, setRefMonthDay] = useState<{ month: number; day: number }>({ month: 1, day: 1 });
  const fetchIdRef = useRef(0);

  useEffect(() => {
    fetchLatestReportDate().then(setLatestDate);
  }, []);

  const loadData = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError('');

    try {
      const isCustom = dateFilter.startsWith('custom:');
      const parts = isCustom ? dateFilter.split(':') : [];
      const filterArg = isCustom ? 'custom' : dateFilter;
      const customStart = isCustom ? parts[1] : undefined;
      const customEnd = isCustom ? parts[2] : undefined;

      const { end } = getDateRange(
        filterArg,
        filterArg === 'latest' ? latestDate : undefined,
        customStart,
        customEnd,
      );
      const refDate = parseISO(end);
      const year = refDate.getFullYear();
      const month = refDate.getMonth() + 1;
      const day = refDate.getDate();
      const { monthStart } = getMtdSnapshotRange(end);

      // Monthly revenue series (MTD snapshots, latest per unit per month)
      const monthly = await fetchRevenueChart(
        filterArg,
        filterArg === 'latest' ? latestDate : undefined,
        customStart,
        customEnd,
      );

      // Per-unit snapshots for TODAY / MTD / YTD (one fetch covers all periods)
      const [hotel, wp, golf] = await Promise.all([
        fetchDivisionData('div-hotel', end),
        fetchDivisionData('div-waterpark', end),
        fetchDivisionData('div-golf', end),
      ]);

      // Daily trend — only days that really have reports in the reference month
      const trend = await fetchDailyTrend('custom', undefined, monthStart, end);

      // Real budgets from the budgets table (single fetch for the year)
      const supabase = createClient();
      const { data: budgetsRaw, error: budgetsError } = await supabase
        .from('budgets')
        .select('business_unit_id, metric_name, budget_value, period_type, year, month, day')
        .eq('year', year);
      if (budgetsError) throw budgetsError;
      const budgetRowsData = (budgetsRaw || []) as BudgetRow[];

      // Monthly budgets (period_type='monthly') keyed by month (1-12)
      const monthlyBudgetMap = new Map<number, number>();
      // Daily budgets (period_type='daily') keyed by day of the reference month
      const dailyBudgetMap = new Map<number, number>();
      for (const b of budgetRowsData) {
        if (!REVENUE_BUDGET_METRICS.includes(b.metric_name)) continue;
        if (b.period_type === 'monthly') {
          const m = b.month;
          monthlyBudgetMap.set(m, (monthlyBudgetMap.get(m) || 0) + Number(b.budget_value));
        } else if (b.period_type === 'daily' && b.day !== null && b.month === month) {
          dailyBudgetMap.set(b.day, (dailyBudgetMap.get(b.day) || 0) + Number(b.budget_value));
        }
      }

      if (id !== fetchIdRef.current) return;

      setMonthlySeries(monthly);
      setMonthlyBudgetByMonth(monthlyBudgetMap);
      setBudgetRows(budgetRowsData);
      setHotelUnits(hotel);
      setWpUnits(wp);
      setGolfUnits(golf);
      setTrendData(trend);
      setTrendBudgetsByDay(dailyBudgetMap);
      setRefMonthDay({ month, day });
      setSelectedDate(end);
    } catch (err) {
      console.error('[Analytics] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Error tidak diketahui');
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }, [dateFilter, latestDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived data (real, period-aware) ──────────────────────

  // Monthly chart: only months that really have data (actual > 0). Budget is
  // shown only when a real monthly budget exists for that month.
  const monthlyChart: ChartData[] = monthlySeries
    .map((m, i) => ({
      name: m.name,
      actual: m.actual,
      budget: monthlyBudgetByMonth.get(i + 1) ?? null,
    }))
    .filter((m) => m.actual > 0);

  const growthRows: Array<ChartData & { achievement: number | null; growth: number | null }> = monthlyChart.map(
    (m, i) => {
      const prev = i > 0 ? monthlyChart[i - 1] : null;
      const growth =
        prev !== null && prev.actual > 0 ? ((m.actual - prev.actual) / prev.actual) * 100 : null;
      const achievement = m.budget !== null && m.budget > 0 ? (m.actual / m.budget) * 100 : null;
      return { ...m, growth, achievement };
    },
  );

  const divisionRevenue: ChartData[] = [
    {
      name: 'Hotel',
      actual: sumUnitRevenue(hotelUnits, 'div-hotel', period),
      budget: divisionBudget(
        budgetRows,
        hotelUnits.map((u) => u.unitId),
        ['total_revenue'],
        period,
        refMonthDay.month,
        refMonthDay.day,
      ),
    },
    {
      name: 'Waterpark',
      actual: sumUnitRevenue(wpUnits, 'div-waterpark', period),
      budget: divisionBudget(
        budgetRows,
        wpUnits.map((u) => u.unitId),
        ['revenue'],
        period,
        refMonthDay.month,
        refMonthDay.day,
      ),
    },
    {
      name: 'Golf',
      actual: sumUnitRevenue(golfUnits, 'div-golf', period),
      budget: divisionBudget(
        budgetRows,
        golfUnits.map((u) => u.unitId),
        ['revenue'],
        period,
        refMonthDay.month,
        refMonthDay.day,
      ),
    },
  ];
  // Presence is determined by real reports (sourceDate), NOT by actual > 0.
  // An actual value of 0 (e.g. Golf revenue Rp0 on 31/08) is still valid data.
  const divisionHasData =
    divisionHasReport(hotelUnits, period) ||
    divisionHasReport(wpUnits, period) ||
    divisionHasReport(golfUnits, period);

  const hotelAchievement = buildAchievementItems(hotelUnits, 'div-hotel', period);
  const wpAchievement = buildAchievementItems(wpUnits, 'div-waterpark', period);

  // Daily trend with a real budget line (budgets table) where the day exists
  const trendWithBudget: TrendData[] = trendData.map((t) => ({
    date: t.date,
    actual: t.actual,
    budget: trendBudgetsByDay.get(parseInt(t.date, 10)) ?? null,
  }));

  const mtdSource = latestSource([...hotelUnits, ...wpUnits, ...golfUnits], 'mtd');
  const ytdSource = latestSource([...hotelUnits, ...wpUnits, ...golfUnits], 'ytd');

  const trendMonthLabel = selectedDate
    ? parseISO(selectedDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : '';

  const hasAnyData =
    monthlyChart.length > 0 ||
    divisionHasData ||
    trendData.length > 0 ||
    hotelAchievement.some((a) => a.achievement !== null) ||
    wpAchievement.some((a) => a.achievement !== null);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Analisis mendalam kinerja Labersa Group</p>
        </div>
      </div>

      <DateFilter
        value={dateFilter}
        onChange={setDateFilter}
        latestDate={latestDate}
        selectedDate={selectedDate}
        mtdSourceDate={mtdSource}
        ytdSourceDate={ytdSource}
        className="mb-4"
      />

      {/* Period Toggle — drives the period semantics of the period-aware widgets */}
      <div className="flex gap-2 mb-6">
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              period === p.key
                ? 'bg-labersa text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        /* Skeleton loading */
        <div className="grid-charts mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error state */
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">Gagal memuat data</h3>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-labersa rounded-lg hover:bg-labersa-dark"
          >
            Coba Lagi
          </button>
        </div>
      ) : !hasAnyData ? (
        /* Empty state */
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada data untuk periode ini</h3>
          <p className="text-sm text-gray-500">
            {latestDate
              ? `Data terakhir tersedia: ${parseISO(latestDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Coba pilih "Latest".`
              : 'Belum ada laporan yang tersimpan di database.'}
          </p>
        </div>
      ) : (
        <>
          {/* Revenue per Divisi (mengikuti toggle periode). Kartu "Revenue Bulanan (Snapshot MTD)"
              hanya dirender pada mode Bulanan; pada mode Harian/YTD tidak dirender sama sekali
              agar tidak memunculkan label MTD di luar konteksnya. Revenue per Divisi melebar penuh
              (lg:col-span-2) saat kartu bulanan tidak dirender agar grid tidak menyisakan ruang kosong. */}
          <div className="grid-charts mb-6">
            {period === 'mtd' && monthlyChart.length > 0 ? (
              <RevenueChart
                data={monthlyChart}
                title="Revenue Bulanan (Snapshot MTD)"
                height={350}
              />
            ) : period === 'mtd' ? (
              <EmptyCard
                title="Revenue Bulanan (Snapshot MTD)"
                message="Data Bulanan (snapshot MTD) belum tersedia. Menampilkan hanya periode yang memang tersedia."
              />
            ) : null}
            <div className={period === 'mtd' ? '' : 'lg:col-span-2'}>
              {divisionHasData ? (
                <RevenueChart
                  data={divisionRevenue}
                  title={`Revenue per Divisi - ${PERIOD_LABEL[period]}`}
                  height={350}
                />
              ) : (
                <EmptyCard title={`Revenue per Divisi - ${PERIOD_LABEL[period]}`} />
              )}
            </div>
          </div>

      {/* Growth Analysis - Bulanan */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Growth Analysis - Bulanan</h3>
            {growthRows.length === 0 ? (
              <p className="text-sm text-gray-500">
                Data Bulanan belum tersedia. Menampilkan hanya periode yang memang tersedia.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">Bulan</th>
                      <th className="pb-2 font-medium text-right">Actual</th>
                      <th className="pb-2 font-medium text-right">Budget</th>
                      <th className="pb-2 font-medium text-right">Achievement</th>
                      <th className="pb-2 font-medium text-right">Growth (MoM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {growthRows.map((m, i) => {
                      const ach = m.achievement;
                      return (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2.5 font-medium">{m.name}</td>
                          <td className="py-2.5 text-right">{formatRpM(m.actual)}</td>
                          <td className="py-2.5 text-right">{formatRpM(m.budget)}</td>
                          <td className="py-2.5 text-right">
                            {ach !== null ? (
                              <span
                                className={`font-semibold ${
                                  ach >= 100 ? 'text-emerald-600' : ach >= 90 ? 'text-amber-600' : 'text-red-600'
                                }`}
                              >
                                {ach.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right">
                            {m.growth !== null ? (
                              <span
                                className={`font-medium ${
                                  m.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                {m.growth >= 0 ? '+' : ''}
                                {m.growth.toFixed(1)}%
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

      {/* Achievement Hotel / Waterpark (period-aware) */}
          <div className="grid-charts mb-6">
            {hotelAchievement.length > 0 ? (
              <AchievementChart
                items={hotelAchievement}
                title={`Achievement - Hotel (${PERIOD_LABEL[period]})`}
              />
            ) : (
              <EmptyCard title={`Achievement - Hotel (${PERIOD_LABEL[period]})`} />
            )}
            {wpAchievement.length > 0 ? (
              <AchievementChart
                items={wpAchievement}
                title={`Achievement - Waterpark (${PERIOD_LABEL[period]})`}
              />
            ) : (
              <EmptyCard title={`Achievement - Waterpark (${PERIOD_LABEL[period]})`} />
            )}
          </div>

          {/* Daily Trend — only days with real reports, budget only where real */}
          {trendWithBudget.length > 0 ? (
            <TrendChart
              data={trendWithBudget}
              title={`Trend Revenue Harian - ${trendMonthLabel || 'Bulan Referensi'}`}
              height={350}
            />
          ) : (
            <EmptyCard
              title="Trend Revenue Harian"
              message="Data harian belum tersedia untuk bulan referensi."
            />
          )}
        </>
      )}
    </div>
  );
}
