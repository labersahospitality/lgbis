/**
 * Dashboard Data Layer — LGBIS
 *
 * All revenue values come from Supabase.
 * MTD/YTD are SNAPSHOT values (cumulative), NOT daily sums.
 * Each business unit has its own latest report date.
 */

import { createClient } from '@/lib/supabase/client';
import { getDateRange, getMtdSnapshotRange, getYtdSnapshotRange } from '@/lib/utils';
import { parseISO } from 'date-fns';
import { CANONICAL_REVENUE_METRIC } from '@/lib/constants';

// ── Public Types ────────────────────────────────────────────

export interface KPIData {
  revenueToday: { value: number; budget: number | null; achievement: number | null; sourceDate: string | null };
  revenueMTD: { value: number; budget: number | null; achievement: number | null; sourceDate: string | null };
  revenueYTD: { value: number; budget: number | null; achievement: number | null; sourceDate: string | null };
  profitToday: { value: number | null; budget: number | null; achievement: number | null };
  varianceToday: number | null;
  trend: number | null;
}

export interface ChartData {
  name: string;
  actual: number;
  budget: number | null;
}

export interface TrendData {
  date: string;
  actual: number;
  budget: number | null;
}

export interface UnitRanking {
  rank: number;
  name: string;
  value: number;
  budget: number | null;
  achievement: number | null;
  format: 'currency' | 'percent' | 'number';
}

export interface HotelPerformance {
  name: string;
  occupancy: number | null;
  roomRevenue: number;
  fbRevenue: number;
  totalRevenue: number;
  budget: number;
  achievement: number | null;
}

// ── Internal Types ──────────────────────────────────────────

interface MetricRow {
  metric_name: string;
  actual_value: number | null;
  budget_value?: number | null;
  achievement_percent?: number | null;
}

interface RawReport {
  business_unit_id: string;
  report_date: string;
  report_metrics: MetricRow[];
}

interface RawBudget {
  metric_name: string;
  budget_value: number;
  period_type: string;
  day: number | null;
}

interface SnapshotResult {
  unitId: string;
  sourceDate: string;
  metrics: Map<string, number>;
  budgets: Map<string, number | null>;
  achievements: Map<string, number | null>;
}

// ── Helper: build actual/budget/achievement maps from metric rows ─

function buildMetricMaps(reportMetrics: MetricRow[]): {
  metrics: Map<string, number>;
  budgets: Map<string, number | null>;
  achievements: Map<string, number | null>;
} {
  const metrics = new Map<string, number>();
  const budgets = new Map<string, number | null>();
  const achievements = new Map<string, number | null>();
  for (const m of reportMetrics) {
    if (m.actual_value !== null && m.actual_value !== undefined) {
      metrics.set(m.metric_name, Number(m.actual_value));
    }
    budgets.set(
      m.metric_name,
      m.budget_value !== null && m.budget_value !== undefined ? Number(m.budget_value) : null,
    );
    achievements.set(
      m.metric_name,
      m.achievement_percent !== null && m.achievement_percent !== undefined
        ? Number(m.achievement_percent)
        : null,
    );
  }
  return { metrics, budgets, achievements };
}

// ── Helper: find metric value (exact name match) ────────────

function getMetricValue(
  metrics: { metric_name: string; actual_value: number | null }[],
  name: string,
): number {
  const m = metrics.find((x) => x.metric_name === name);
  return m?.actual_value ? Number(m.actual_value) : 0;
}

// ── Helper: latest snapshot per unit ────────────────────────

/**
 * For each business unit, fetch the LATEST snapshot for a given period_type
 * within the date constraints.
 *
 * This is the core anti-double-counting mechanism:
 * - We take ONE snapshot per unit, not SUM across dates.
 * - MTD snapshots must be from the same month & year as selectedDate.
 * - YTD snapshots must be from the same year as selectedDate.
 */
async function fetchLatestSnapshotPerUnit(
  periodType: 'mtd' | 'ytd',
  selectedDate: string,
): Promise<SnapshotResult[]> {
  const supabase = createClient();

  let query = supabase
    .from('daily_reports')
    .select('business_unit_id, report_date, report_metrics!inner(metric_name, actual_value, budget_value, achievement_percent)')
    .eq('period_type', periodType)
    .lte('report_date', selectedDate)
    .order('report_date', { ascending: false });

  // MTD: must be same month & year
  if (periodType === 'mtd') {
    const { monthStart } = getMtdSnapshotRange(selectedDate);
    query = query.gte('report_date', monthStart);
  }

  // YTD: must be same year
  if (periodType === 'ytd') {
    const { yearStart } = getYtdSnapshotRange(selectedDate);
    query = query.gte('report_date', yearStart);
  }

  const { data } = await query;
  const rawReports = (data || []) as unknown as RawReport[];

  // Group by business_unit_id, keep only the LATEST per unit
  const latestByUnit = new Map<string, RawReport>();
  for (const report of rawReports) {
    const existing = latestByUnit.get(report.business_unit_id);
    if (!existing || report.report_date > existing.report_date) {
      latestByUnit.set(report.business_unit_id, report);
    }
  }

  // Convert to SnapshotResult
  const results: SnapshotResult[] = [];
  Array.from(latestByUnit.entries()).forEach(([unitId, report]) => {
    const { metrics: metricsMap, budgets, achievements } = buildMetricMaps(report.report_metrics);
    results.push({
      unitId,
      sourceDate: report.report_date,
      metrics: metricsMap,
      budgets,
      achievements,
    });
  });

  return results;
}

// ── Step 4: fetchLatestReportDatePerUnit ────────────────────

export interface UnitLatestDate {
  unitId: string;
  unitName: string;
  divisionId: string;
  latestDate: string | null;
}

export async function fetchLatestReportDatePerUnit(): Promise<UnitLatestDate[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from('daily_reports')
    .select('business_unit_id, report_date, business_units!inner(id, name, division_id)')
    .order('report_date', { ascending: false });

  const rawReports = (data || []) as unknown as {
    business_unit_id: string;
    report_date: string;
    business_units: { id: string; name: string; division_id: string } | null;
  }[];

  // Track latest date per unit
  const latestMap = new Map<string, { name: string; divisionId: string; date: string }>();
  for (const r of rawReports) {
    const bu = r.business_units;
    if (!bu) continue;
    const existing = latestMap.get(r.business_unit_id);
    if (!existing || r.report_date > existing.date) {
      latestMap.set(r.business_unit_id, { name: bu.name, divisionId: bu.division_id, date: r.report_date });
    }
  }

  return Array.from(latestMap.entries()).map(([unitId, info]) => ({
    unitId,
    unitName: info.name,
    divisionId: info.divisionId,
    latestDate: info.date,
  }));
}

/**
 * Get the global latest report date (the most recent date ANY unit reported).
 */
export async function fetchLatestReportDate(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('daily_reports')
    .select('report_date')
    .order('report_date', { ascending: false })
    .limit(1)
    .single();

  return data?.report_date || null;
}

// ── Step 5: fetchKPIs — Snapshot-based ──────────────────────

export async function fetchKPIs(
  filter: string,
  latestDate?: string | null,
  customStart?: string,
  customEnd?: string,
): Promise<KPIData> {
  const supabase = createClient();
  const { end } = getDateRange(filter, filter === 'latest' ? latestDate : undefined, customStart, customEnd);

  // TODAY: daily reports for the selected date
  const { data: todayRaw } = await supabase
    .from('daily_reports')
    .select('business_unit_id, report_date, report_metrics!inner(metric_name, actual_value)')
    .eq('period_type', 'daily')
    .eq('report_date', end);

  const todayData = (todayRaw || []) as unknown as RawReport[];

  // MTD: LATEST snapshot per unit, same month & year as selectedDate
  const mtdSnapshots = await fetchLatestSnapshotPerUnit('mtd', end);

  // YTD: LATEST snapshot per unit, same year as selectedDate
  const ytdSnapshots = await fetchLatestSnapshotPerUnit('ytd', end);

  // ── Revenue TODAY ───────────────────────────────────────
  // Sum across units, each using its canonical metric name
  let revenueToday = 0;
  for (const report of todayData) {
    // Determine unit's division from business_unit_id prefix
    const metricName = getCanonicalMetricForUnit(report.business_unit_id, 'today');
    if (metricName) {
      revenueToday += getMetricValue(report.report_metrics, metricName);
    }
  }

  // ── Revenue MTD — one snapshot per unit ─────────────────
  let revenueMTD = 0;
  let mtdSourceDate: string | null = null;
  for (const snap of mtdSnapshots) {
    const metricName = getCanonicalMetricForUnit(snap.unitId, 'mtd');
    if (metricName) {
      revenueMTD += snap.metrics.get(metricName) || 0;
    }
    // Track the latest source date across all units
    if (!mtdSourceDate || snap.sourceDate > mtdSourceDate) {
      mtdSourceDate = snap.sourceDate;
    }
  }

  // ── Revenue YTD — one snapshot per unit ─────────────────
  let revenueYTD = 0;
  let ytdSourceDate: string | null = null;
  for (const snap of ytdSnapshots) {
    const metricName = getCanonicalMetricForUnit(snap.unitId, 'ytd');
    if (metricName) {
      revenueYTD += snap.metrics.get(metricName) || 0;
    }
    if (!ytdSourceDate || snap.sourceDate > ytdSourceDate) {
      ytdSourceDate = snap.sourceDate;
    }
  }

  // Today source date = the selected date itself
  const todaySourceDate = end;

  // Expense (if available)
  let expenseToday = 0;
  for (const report of todayData) {
    expenseToday += getMetricValue(report.report_metrics, 'expense')
      + getMetricValue(report.report_metrics, 'cost');
  }
  const profitToday = expenseToday > 0 ? revenueToday - expenseToday : null;

  // Budgets
  const filterEndDate = new Date(end);
  const [dailyBudgets, monthlyBudgets, allYearBudgets] = await Promise.all([
    supabase
      .from('budgets')
      .select('metric_name, budget_value, period_type, day')
      .eq('period_type', 'daily')
      .eq('year', filterEndDate.getFullYear())
      .eq('month', filterEndDate.getMonth() + 1),
    supabase
      .from('budgets')
      .select('metric_name, budget_value, period_type, day')
      .eq('period_type', 'monthly')
      .eq('year', filterEndDate.getFullYear())
      .lte('month', filterEndDate.getMonth() + 1),
    supabase
      .from('budgets')
      .select('metric_name, budget_value, period_type, day')
      .eq('period_type', 'monthly')
      .eq('year', filterEndDate.getFullYear()),
  ]);

  const dailyData = (dailyBudgets.data || []) as unknown as RawBudget[];
  const monthlyData = (monthlyBudgets.data || []) as unknown as RawBudget[];
  const yearData = (allYearBudgets.data || []) as unknown as RawBudget[];

  const budgetTodayRev = dailyData
    .filter((b) => ['total_revenue', 'revenue'].includes(b.metric_name))
    .reduce((s, b) => s + Number(b.budget_value), 0);
  const budgetMTDRev = monthlyData
    .filter((b) => ['total_revenue', 'revenue'].includes(b.metric_name))
    .reduce((s, b) => s + Number(b.budget_value), 0);
  const budgetYTDRev = yearData
    .filter((b) => ['total_revenue', 'revenue'].includes(b.metric_name))
    .reduce((s, b) => s + Number(b.budget_value), 0);

  const achieve = (a: number, b: number | null): number | null => {
    if (b === null || b === 0) return null;
    return (a / b) * 100;
  };

  return {
    revenueToday: {
      value: revenueToday,
      budget: budgetTodayRev || null,
      achievement: achieve(revenueToday, budgetTodayRev || null),
      sourceDate: todaySourceDate,
    },
    revenueMTD: {
      value: revenueMTD,
      budget: budgetMTDRev || null,
      achievement: achieve(revenueMTD, budgetMTDRev || null),
      sourceDate: mtdSourceDate,
    },
    revenueYTD: {
      value: revenueYTD,
      budget: budgetYTDRev || null,
      achievement: achieve(revenueYTD, budgetYTDRev || null),
      sourceDate: ytdSourceDate,
    },
    profitToday: {
      value: profitToday,
      budget: null,
      achievement: null,
    },
    varianceToday: budgetTodayRev ? revenueToday - budgetTodayRev : null,
    trend: null,
  };
}

// ── Step 6: fetchDivisionData — Hotel/Waterpark/Golf ────────

export interface DivisionPeriodData {
  metrics: Map<string, number>;
  budgets: Map<string, number | null>;
  achievements: Map<string, number | null>;
  sourceDate: string | null;
}

export interface DivisionUnitData {
  unitId: string;
  unitName: string;
  today: DivisionPeriodData;
  mtd: DivisionPeriodData;
  ytd: DivisionPeriodData;
}

/**
 * Fetch data for all units in a division.
 * Returns per-unit snapshots for TODAY, MTD, YTD.
 */
export async function fetchDivisionData(
  divisionId: string,
  selectedDate: string,
): Promise<DivisionUnitData[]> {
  const supabase = createClient();

  // Get all units in this division
  const { data: units } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('division_id', divisionId)
    .eq('active', true);

  const unitList = (units || []) as { id: string; name: string }[];
  const unitIds = unitList.map((u) => u.id);

  if (unitIds.length === 0) return [];

  // TODAY: daily reports for selectedDate
  const { data: todayRaw } = await supabase
    .from('daily_reports')
    .select('business_unit_id, report_date, report_metrics!inner(metric_name, actual_value, budget_value, achievement_percent)')
    .eq('period_type', 'daily')
    .eq('report_date', selectedDate)
    .in('business_unit_id', unitIds);

  const todayReports = (todayRaw || []) as unknown as RawReport[];

  // MTD: LATEST snapshot per unit, same month & year
  const allMtdSnapshots = await fetchLatestSnapshotPerUnit('mtd', selectedDate);
  const mtdSnapshots = allMtdSnapshots.filter((s) => unitIds.includes(s.unitId));

  // YTD: LATEST snapshot per unit, same year
  const allYtdSnapshots = await fetchLatestSnapshotPerUnit('ytd', selectedDate);
  const ytdSnapshots = allYtdSnapshots.filter((s) => unitIds.includes(s.unitId));

  // Build per-unit results
  const todayByUnit = new Map<string, RawReport>();
  for (const r of todayReports) {
    todayByUnit.set(r.business_unit_id, r);
  }

  const mtdByUnit = new Map<string, SnapshotResult>();
  for (const s of mtdSnapshots) {
    mtdByUnit.set(s.unitId, s);
  }

  const ytdByUnit = new Map<string, SnapshotResult>();
  for (const s of ytdSnapshots) {
    ytdByUnit.set(s.unitId, s);
  }

  return unitList.map((unit) => {
    const todayReport = todayByUnit.get(unit.id);
    const mtdSnap = mtdByUnit.get(unit.id);
    const ytdSnap = ytdByUnit.get(unit.id);

    const todayMaps = todayReport ? buildMetricMaps(todayReport.report_metrics) : null;

    return {
      unitId: unit.id,
      unitName: unit.name,
      today: {
        metrics: todayMaps?.metrics || new Map(),
        budgets: todayMaps?.budgets || new Map(),
        achievements: todayMaps?.achievements || new Map(),
        sourceDate: todayReport?.report_date || null,
      },
      mtd: {
        metrics: mtdSnap?.metrics || new Map(),
        budgets: mtdSnap?.budgets || new Map(),
        achievements: mtdSnap?.achievements || new Map(),
        sourceDate: mtdSnap?.sourceDate || null,
      },
      ytd: {
        metrics: ytdSnap?.metrics || new Map(),
        budgets: ytdSnap?.budgets || new Map(),
        achievements: ytdSnap?.achievements || new Map(),
        sourceDate: ytdSnap?.sourceDate || null,
      },
    };
  });
}

// ── Chart/Ranking/Trend functions (kept for dashboard-utama) ──

export async function fetchRevenueChart(
  filter: string,
  latestDate?: string | null,
  customStart?: string,
  customEnd?: string,
): Promise<ChartData[]> {
  const supabase = createClient();
  const { end } = getDateRange(filter, filter === 'latest' ? latestDate : undefined, customStart, customEnd);

  const selectedYear = parseISO(end).getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Fetch all MTD reports for this year
  const { data: reports } = await supabase
    .from('daily_reports')
    .select('business_unit_id, report_date, report_metrics!inner(metric_name, actual_value)')
    .eq('period_type', 'mtd')
    .gte('report_date', `${selectedYear}-01-01`)
    .lte('report_date', end);

  const rawReports = (reports || []) as unknown as RawReport[];

  // Track latest snapshot per unit per month (anti-double-count)
  // Key: `${unitId}-${month}` → { val, date }
  const latestSnapshots = new Map<string, { val: number; date: string }>();

  rawReports.forEach((r) => {
    const month = new Date(r.report_date).getMonth();
    const metricName = getCanonicalMetricForUnit(r.business_unit_id, 'mtd');
    if (!metricName) return;
    const val = getMetricValue(r.report_metrics, metricName);
    const key = `${r.business_unit_id}-${month}`;
    const existing = latestSnapshots.get(key);
    if (!existing || r.report_date > existing.date) {
      latestSnapshots.set(key, { val, date: r.report_date });
    }
  });

  // Sum across units per month (each unit contributes its latest snapshot)
  const dedupedRevenue: Record<number, number> = {};
  Array.from(latestSnapshots.entries()).forEach(([key, snap]) => {
    const month = parseInt(key.split('-').pop() || '0', 10);
    dedupedRevenue[month] = (dedupedRevenue[month] || 0) + snap.val;
  });

  const selectedMonth = parseISO(end).getMonth();
  return Array.from({ length: selectedMonth + 1 }, (_, i) => ({
    name: monthNames[i],
    actual: dedupedRevenue[i] || 0,
    budget: null,
  }));
}

export async function fetchDivisionRevenue(
  filter: string,
  latestDate?: string | null,
  customStart?: string,
  customEnd?: string,
): Promise<ChartData[]> {
  const supabase = createClient();
  const { end } = getDateRange(filter, filter === 'latest' ? latestDate : undefined, customStart, customEnd);

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('business_unit_id, report_date, report_metrics!inner(metric_name, actual_value), business_units!inner(division_id, divisions!inner(name))')
    .eq('period_type', 'daily')
    .eq('report_date', end);

  const rawReports = (reports || []) as Array<RawReport & {
    business_units?: { divisions?: { name: string } };
  }>;

  const divisionRevenue: Record<string, number> = {};
  rawReports.forEach((r) => {
    const divName = r.business_units?.divisions?.name || 'Unknown';
    const metricName = getCanonicalMetricForUnit(r.business_unit_id, 'today');
    if (metricName) {
      const val = getMetricValue(r.report_metrics, metricName);
      if (val > 0) {
        divisionRevenue[divName] = (divisionRevenue[divName] || 0) + val;
      }
    }
  });

  return Object.entries(divisionRevenue).map(([name, actual]) => ({ name, actual, budget: null }));
}

export async function fetchDailyTrend(
  filter: string,
  latestDate?: string | null,
  customStart?: string,
  customEnd?: string,
): Promise<TrendData[]> {
  const supabase = createClient();
  const { start, end } = getDateRange(filter, filter === 'latest' ? latestDate : undefined, customStart, customEnd);

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('business_unit_id, report_date, report_metrics!inner(metric_name, actual_value)')
    .eq('period_type', 'daily')
    .gte('report_date', start)
    .lte('report_date', end);

  const rawReports = (reports || []) as unknown as RawReport[];

  const dailyRevenue: Record<string, number> = {};
  for (const r of rawReports) {
    const metricName = getCanonicalMetricForUnit(r.business_unit_id, 'today');
    if (metricName) {
      const val = getMetricValue(r.report_metrics, metricName);
      dailyRevenue[r.report_date] = (dailyRevenue[r.report_date] || 0) + val;
    }
  }

  return Object.entries(dailyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, actual]) => ({ date: date.substring(8), actual, budget: null }));
}

export async function fetchUnitRanking(
  filter: string,
  latestDate?: string | null,
  customStart?: string,
  customEnd?: string,
): Promise<UnitRanking[]> {
  const supabase = createClient();
  const { end } = getDateRange(filter, filter === 'latest' ? latestDate : undefined, customStart, customEnd);

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('business_unit_id, report_metrics!inner(metric_name, actual_value), business_units!inner(name)')
    .eq('period_type', 'daily')
    .eq('report_date', end);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawReports: any[] = reports || [];

  const unitRevenue: Record<string, { name: string; actual: number }> = {};
  for (const r of rawReports) {
    const unitId = r.business_unit_id;
    if (!unitRevenue[unitId]) {
      unitRevenue[unitId] = { name: r.business_units?.name || unitId, actual: 0 };
    }
    const metricName = getCanonicalMetricForUnit(unitId, 'today');
    if (metricName) {
      unitRevenue[unitId].actual += getMetricValue(r.report_metrics, metricName);
    }
  }

  return Object.values(unitRevenue)
    .sort((a, b) => b.actual - a.actual)
    .map((u, i) => ({
      rank: i + 1,
      name: u.name,
      value: u.actual,
      budget: null,
      achievement: null,
      format: 'currency' as const,
    }));
}

export async function fetchHotelPerformance(
  filter: string,
  latestDate?: string | null,
  customStart?: string,
  customEnd?: string,
): Promise<HotelPerformance[]> {
  const { end } = getDateRange(filter, filter === 'latest' ? latestDate : undefined, customStart, customEnd);
  const divisionData = await fetchDivisionData('div-hotel', end);

  return divisionData.map((unit) => ({
    name: unit.unitName,
    occupancy: unit.mtd.metrics.get('mtd_occupancy') ?? unit.today.metrics.get('today_occupancy') ?? null,
    roomRevenue: unit.mtd.metrics.get('mtd_room_revenue') ?? unit.today.metrics.get('today_room_revenue') ?? 0,
    fbRevenue: unit.mtd.metrics.get('mtd_fb_revenue') ?? unit.today.metrics.get('today_fb_revenue') ?? 0,
    totalRevenue: unit.mtd.metrics.get('mtd_total_revenue') ?? unit.today.metrics.get('today_total_revenue') ?? 0,
    budget: 0,
    achievement: null,
  }));
}

// ── Unit → Canonical metric resolver ────────────────────────

/**
 * Maps a business_unit_id to its canonical revenue metric name for a given period.
 * Uses the unit_id prefix to determine division.
 *
 * This is the SINGLE SOURCE OF TRUTH for which metric name to use.
 * No fallback, no fuzzy matching, no endsWith.
 */
function getCanonicalMetricForUnit(unitId: string, period: 'today' | 'mtd' | 'ytd'): string | null {
  if (unitId.startsWith('bu-hotel')) {
    return CANONICAL_REVENUE_METRIC.HOTEL[period];
  }
  if (unitId.startsWith('bu-wp')) {
    return CANONICAL_REVENUE_METRIC.WATERPARK[period];
  }
  if (unitId === 'bu-golf') {
    return CANONICAL_REVENUE_METRIC.GOLF[period];
  }
  return null;
}
