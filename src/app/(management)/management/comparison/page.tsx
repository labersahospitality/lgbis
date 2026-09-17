'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DateFilter from '@/components/ui/date-filter';
import ComparisonTable from '@/components/ui/comparison-table';
import RevenueChart from '@/components/charts/revenue-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import RankingTable from '@/components/ui/ranking-table';
import { fetchDivisionData, fetchLatestReportDate, type DivisionUnitData } from '@/lib/dashboard-data';
import { CANONICAL_REVENUE_METRIC } from '@/lib/constants';
import { getDateRange } from '@/lib/utils';

type ComparisonMode = 'hotel' | 'waterpark' | 'division';
type Period = 'mtd' | 'ytd';

const PERIOD_LABEL: Record<Period, string> = { mtd: 'MTD', ytd: 'YTD' };

// ── Helpers ─────────────────────────────────────────────────

/** Canonical revenue metric name for a division + period. No mixing, no fallback. */
function revenueMetric(divisionId: string, period: Period): string {
  if (divisionId === 'div-hotel') return CANONICAL_REVENUE_METRIC.HOTEL[period];
  if (divisionId === 'div-waterpark') return CANONICAL_REVENUE_METRIC.WATERPARK[period];
  return CANONICAL_REVENUE_METRIC.GOLF[period];
}

interface UnitCompare {
  unitId: string;
  name: string;
  /** null when the unit has no report for the selected period (honest unavailable) */
  actual: number | null;
  budget: number | null;
  achievement: number | null;
  secondary: number | null;
  roomSold: number | null;
  sourceDate: string | null;
}

/**
 * Build a per-unit comparison row from the snapshot data layer.
 * - actual comes from the canonical metric for the selected period
 * - budget is the stored budget_value (null/0 → unavailable → no achievement)
 * - achievement = actual / budget × 100 ONLY when budget > 0
 * - a unit without a report for the period is null (not fabricated 0)
 */
function buildUnitCompare(
  u: DivisionUnitData,
  period: Period,
  divisionId: string,
  secondaryMetric: string | null,
  roomSoldMetric: string | null = null,
): UnitCompare {
  const periodData = period === 'mtd' ? u.mtd : u.ytd;
  const hasReport = periodData.sourceDate !== null;

  if (!hasReport) {
    return {
      unitId: u.unitId,
      name: u.unitName,
      actual: null,
      budget: null,
      achievement: null,
      secondary: null,
      roomSold: null,
      sourceDate: null,
    };
  }

  const metric = revenueMetric(divisionId, period);
  const actual = periodData.metrics.get(metric) ?? 0;
  const storedBudget = periodData.budgets.get(metric);
  const budget = storedBudget !== null && storedBudget !== undefined && storedBudget > 0 ? storedBudget : null;
  const achievement = budget !== null ? (actual / budget) * 100 : null;
  const secondary = secondaryMetric ? periodData.metrics.get(secondaryMetric) ?? null : null;
  const roomSold = roomSoldMetric ? periodData.metrics.get(roomSoldMetric) ?? null : null;

  return {
    unitId: u.unitId,
    name: u.unitName,
    actual,
    budget,
    achievement,
    secondary,
    roomSold,
    sourceDate: periodData.sourceDate,
  };
}

/**
 * Compute the GROUP weighted occupancy and total room sold for hotels.
 * Mirrors the Hotel Dashboard formula exactly:
 *   Group Occupancy = (Σ room_sold) / (Σ room_available) × 100
 * where each hotel's room_available is taken from `*_room_available`,
 * else `*_room_saleable`, else derived from occupancy & room_sold.
 * Returns null when no hotel has data for the period (honest unavailable).
 */
function computeHotelGroup(
  units: DivisionUnitData[],
  period: Period,
): { roomSold: number | null; occupancy: number | null } {
  let totalSold = 0;
  let totalAvailable = 0;
  let anyData = false;

  for (const u of units) {
    const periodData = period === 'mtd' ? u.mtd : u.ytd;
    if (periodData.sourceDate === null) continue;

    const sold = periodData.metrics.get(`${period}_room_sold`);
    if (sold === undefined || sold === null) continue;
    anyData = true;
    totalSold += sold;

    let avail = periodData.metrics.get(`${period}_room_available`);
    if (avail === undefined || avail === null || avail <= 0) {
      avail = periodData.metrics.get(`${period}_room_saleable`);
    }
    if (avail === undefined || avail === null || avail <= 0) {
      const occ = periodData.metrics.get(`${period}_occupancy`);
      if (occ !== undefined && occ !== null && occ > 0) {
        avail = Math.round(sold / (occ / 100));
      }
    }
    if (avail !== undefined && avail !== null && avail > 0) totalAvailable += avail;
  }

  if (!anyData) return { roomSold: null, occupancy: null };

  return {
    roomSold: totalSold > 0 ? totalSold : null,
    occupancy: totalAvailable > 0 ? (totalSold / totalAvailable) * 100 : null,
  };
}

function sumActual(rows: UnitCompare[]): number | null {
  const withData = rows.filter((r) => r.actual !== null);
  if (withData.length === 0) return null;
  return withData.reduce((s, r) => s + (r.actual as number), 0);
}

function sumBudget(rows: UnitCompare[]): number | null {
  const withBudget = rows.filter((r) => r.budget !== null && r.budget > 0);
  if (withBudget.length === 0) return null;
  return withBudget.reduce((s, r) => s + (r.budget as number), 0);
}

function achievementFor(totalActual: number | null, totalBudget: number | null): number | null {
  if (totalActual === null || totalBudget === null || totalBudget === 0) return null;
  return (totalActual / totalBudget) * 100;
}

// ── Page ─────────────────────────────────────────────────────

export default function ComparisonPage() {
  const [mode, setMode] = useState<ComparisonMode>('hotel');
  const [period, setPeriod] = useState<Period>('mtd');
  const [dateFilter, setDateFilter] = useState('latest');
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hotelUnits, setHotelUnits] = useState<DivisionUnitData[]>([]);
  const [wpUnits, setWpUnits] = useState<DivisionUnitData[]>([]);
  const [golfUnits, setGolfUnits] = useState<DivisionUnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    fetchLatestReportDate().then(setLatestDate);
  }, []);

  const loadData = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);

    try {
      const { end } = getDateRange(dateFilter, dateFilter === 'latest' ? latestDate : undefined);

      const [hotel, wp, golf] = await Promise.all([
        fetchDivisionData('div-hotel', end),
        fetchDivisionData('div-waterpark', end),
        fetchDivisionData('div-golf', end),
      ]);

      if (id !== fetchIdRef.current) return;

      setHotelUnits(hotel);
      setWpUnits(wp);
      setGolfUnits(golf);
      setSelectedDate(end);
    } catch (err) {
      console.error('[Comparison] Error loading data:', err);
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [dateFilter, latestDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Period rows per division ──────────────────────────────
  const hotelRows = hotelUnits.map((u) =>
    buildUnitCompare(u, period, 'div-hotel', `${period}_occupancy`, `${period}_room_sold`),
  );
  const wpRows = wpUnits.map((u) => buildUnitCompare(u, period, 'div-waterpark', `${period}_visitors`));
  const golfRows = golfUnits.map((u) => buildUnitCompare(u, period, 'div-golf', `${period}_total_player`));

  // Group weighted occupancy + total room sold for hotels (mirrors Hotel Dashboard)
  const hotelGroup = computeHotelGroup(hotelUnits, period);

  // Division aggregates (sum across units; only units with data)
  const hotelTotalActual = sumActual(hotelRows);
  const hotelTotalBudget = sumBudget(hotelRows);
  const hotelAchievement = achievementFor(hotelTotalActual, hotelTotalBudget);

  const wpTotalActual = sumActual(wpRows);
  const wpTotalBudget = sumBudget(wpRows);
  const wpAchievement = achievementFor(wpTotalActual, wpTotalBudget);

  const golfTotalActual = sumActual(golfRows);
  const golfTotalBudget = sumBudget(golfRows);
  const golfAchievement = achievementFor(golfTotalActual, golfTotalBudget);

  const hasData = [...hotelRows, ...wpRows, ...golfRows].some((r) => r.actual !== null);

  // Source dates for the DateFilter warning chips
  const allUnits = [...hotelUnits, ...wpUnits, ...golfUnits];
  const mtdSource = allUnits.map((u) => u.mtd.sourceDate).filter((d): d is string => !!d).sort().pop() ?? null;
  const ytdSource = allUnits.map((u) => u.ytd.sourceDate).filter((d): d is string => !!d).sort().pop() ?? null;

  const divisions = [
    {
      name: 'Hotel Division',
      actual: hotelTotalActual,
      budget: hotelTotalBudget,
      achievement: hotelAchievement,
    },
    {
      name: 'Waterpark Division',
      actual: wpTotalActual,
      budget: wpTotalBudget,
      achievement: wpAchievement,
    },
    {
      name: 'Golf Division',
      actual: golfTotalActual,
      budget: golfTotalBudget,
      achievement: golfAchievement,
    },
  ];

  const modeTabs: { key: ComparisonMode; label: string }[] = [
    { key: 'hotel', label: 'Hotel vs Hotel' },
    { key: 'waterpark', label: 'Waterpark vs Waterpark' },
    { key: 'division', label: 'Division vs Division' },
  ];

  const renderComparison = (
    rows: UnitCompare[],
    secondaryLabel: string,
    secondaryFormat: 'percent' | 'number',
    title: string,
    totalRow: { actual: number | null; budget: number | null; achievement: number | null; secondary: number | null } | null,
    footnote?: string,
    extraColumn?: {
      label: string;
      format: 'percent' | 'number';
      values: (number | null)[];
      total: number | null;
    } | null,
  ) => {
    const ranked = rows
      .filter((r) => r.actual !== null)
      .sort((a, b) => (b.actual as number) - (a.actual as number));

    return (
      <>
        <ComparisonTable
          title={title}
          rows={rows.map((r, i) => ({
            unit_name: r.name,
            metrics: [
              { label: secondaryLabel, value: r.secondary, format: secondaryFormat },
              ...(extraColumn
                ? [{ label: extraColumn.label, value: extraColumn.values[i] ?? null, format: extraColumn.format }]
                : []),
              { label: `Total Revenue ${PERIOD_LABEL[period]}`, value: r.actual, format: 'currency' as const },
              { label: 'Budget', value: r.budget, format: 'currency' as const },
              { label: 'Achievement', value: r.achievement, format: 'percent' as const },
            ],
          }))}
          totalRow={
            totalRow
              ? {
                  unit_name: 'TOTAL GROUP',
                  metrics: [
                    { label: secondaryLabel, value: totalRow.secondary, format: secondaryFormat },
                    ...(extraColumn
                      ? [{ label: extraColumn.label, value: extraColumn.total, format: extraColumn.format }]
                      : []),
                    { label: `Total Revenue ${PERIOD_LABEL[period]}`, value: totalRow.actual, format: 'currency' as const },
                    { label: 'Budget', value: totalRow.budget, format: 'currency' as const },
                    { label: 'Achievement', value: totalRow.achievement, format: 'percent' as const },
                  ],
                }
              : undefined
          }
        />
        {footnote && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mt-3">
            {footnote}
          </p>
        )}

        <div className="grid-charts mt-6 mb-6">
          <RevenueChart
            data={rows.map((r) => ({
              name: r.name,
              actual: r.actual ?? 0,
              budget: r.budget,
            }))}
            title={`Revenue Actual vs Budget - ${PERIOD_LABEL[period]}`}
          />
          <AchievementChart
            items={rows.map((r) => ({ name: r.name, achievement: r.achievement }))}
            title={`Achievement Comparison - ${PERIOD_LABEL[period]}`}
          />
        </div>

        {ranked.length > 0 && (
          <RankingTable
            items={ranked.map((r, i) => ({
              rank: i + 1,
              name: r.name,
              value: r.actual as number,
              budget: r.budget,
              achievement: r.achievement,
              format: 'currency' as const,
            }))}
            title={`Ranking - Total Revenue ${PERIOD_LABEL[period]}`}
            valueLabel={`Total Revenue ${PERIOD_LABEL[period]}`}
          />
        )}
      </>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Perbandingan</h1>
          <p className="page-subtitle">Bandingkan kinerja antar unit dan divisi dari data Supabase</p>
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

      {/* Mode Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {modeTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === tab.key
                ? 'bg-labersa text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Period Toggle: MTD / YTD */}
      <div className="flex gap-2 mb-6">
        {(['mtd', 'ytd'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              period === p
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid-kpi mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
      ) : !hasData ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada data untuk periode ini</h3>
          <p className="text-sm text-gray-500">
            {latestDate
              ? `Data terakhir tersedia: ${new Date(latestDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Coba pilih "Latest".`
              : 'Belum ada laporan yang tersimpan di database.'}
          </p>
        </div>
      ) : (
        <>
          {mode === 'hotel' &&
            renderComparison(
              hotelRows,
              'Occupancy',
              'percent',
              `Perbandingan Hotel - Total Revenue ${PERIOD_LABEL[period]}`,
              {
                actual: hotelTotalActual,
                budget: hotelTotalBudget,
                achievement: hotelAchievement,
                secondary: hotelGroup.occupancy,
              },
              undefined,
              {
                label: 'Room Sold',
                format: 'number',
                values: hotelRows.map((r) => r.roomSold),
                total: hotelGroup.roomSold,
              },
            )}

          {mode === 'waterpark' &&
            renderComparison(
              wpRows,
              'Visitors',
              'number',
              `Perbandingan Waterpark - Total Revenue ${PERIOD_LABEL[period]}`,
              {
                actual: wpTotalActual,
                budget: wpTotalBudget,
                achievement: wpAchievement,
                secondary: wpRows.some((r) => r.secondary !== null)
                  ? wpRows.filter((r) => r.secondary !== null).reduce((s, r) => s + (r.secondary as number), 0)
                  : null,
              },
            )}

          {mode === 'division' && (
            <>
              <ComparisonTable
                title={`Perbandingan Divisi - Total Revenue ${PERIOD_LABEL[period]}`}
                rows={divisions.map((d) => ({
                  unit_name: d.name,
                  division: d.name.replace(' Division', ''),
                  metrics: [
                    { label: `Total Revenue ${PERIOD_LABEL[period]}`, value: d.actual, format: 'currency' as const },
                    { label: 'Budget', value: d.budget, format: 'currency' as const },
                    { label: 'Achievement', value: d.achievement, format: 'percent' as const },
                  ],
                }))}
                totalRow={{
                  unit_name: 'TOTAL GROUP',
                  division: 'Group',
                  metrics: [
                    {
                      label: `Total Revenue ${PERIOD_LABEL[period]}`,
                      value: divisions.reduce((s, d) => s + (d.actual ?? 0), 0) || null,
                      format: 'currency' as const,
                    },
                    {
                      label: 'Budget',
                      value: divisions.reduce((s, d) => s + (d.budget ?? 0), 0) || null,
                      format: 'currency' as const,
                    },
                    {
                      label: 'Achievement',
                      value: achievementFor(
                        divisions.reduce((s, d) => s + (d.actual ?? 0), 0) || null,
                        divisions.reduce((s, d) => s + (d.budget ?? 0), 0) || null,
                      ),
                      format: 'percent' as const,
                    },
                  ],
                }}
              />
              {golfTotalBudget === null && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mt-3">
                  ⚠ Budget Golf tidak tersedia (nilai budget di database kosong) — achievement Golf tidak dihitung.
                  Persentase pada laporan Golf adalah perbandingan terhadap tahun lalu (YoY), bukan achievement budget,
                  sehingga tidak digunakan.
                </p>
              )}

              <div className="grid-charts mt-6 mb-6">
                <RevenueChart
                  data={divisions.map((d) => ({
                    name: d.name.replace(' Division', ''),
                    actual: d.actual ?? 0,
                    budget: d.budget,
                  }))}
                  title={`Revenue Actual vs Budget per Divisi - ${PERIOD_LABEL[period]}`}
                />
                <AchievementChart
                  items={divisions.map((d) => ({ name: d.name, achievement: d.achievement }))}
                  title={`Achievement per Divisi - ${PERIOD_LABEL[period]}`}
                />
              </div>

              <RankingTable
                items={divisions
                  .map((d, i) => ({
                    rank: i + 1,
                    name: d.name,
                    value: d.actual ?? 0,
                    budget: d.budget,
                    achievement: d.achievement,
                    format: 'currency' as const,
                  }))
                  .sort((a, b) => b.value - a.value)
                  .map((item, i) => ({ ...item, rank: i + 1 }))}
                title={`Ranking Divisi - Total Revenue ${PERIOD_LABEL[period]}`}
                valueLabel={`Total Revenue ${PERIOD_LABEL[period]}`}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
