'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import KPICard from '@/components/ui/kpi-card';
import DateFilter from '@/components/ui/date-filter';
import RevenueChart from '@/components/charts/revenue-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import ComparisonTable from '@/components/ui/comparison-table';
import { fetchDivisionData, fetchLatestReportDate, type DivisionUnitData } from '@/lib/dashboard-data';
import { formatCurrency, formatNumber, getDateRange, cn } from '@/lib/utils';
import { parseISO } from 'date-fns';

const WATERPARK_DIVISION_ID = 'div-waterpark';

function achievementBadgeClass(value: number): string {
  return cn(
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
    value >= 100 ? 'bg-emerald-100 text-emerald-700' :
    value >= 90 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700'
  );
}

// Resolve achievement % for a period:
// - Compute from actual / budget × 100 when budget > 0 (precise).
// - Fall back to stored achievement_percent only when budget is missing.
// Never returns '-' when both actual and budget exist.
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

export default function WaterparkDashboard() {
  const [dateFilter, setDateFilter] = useState('latest');
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [units, setUnits] = useState<DivisionUnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateLabel, setSelectedDateLabel] = useState('');
  const fetchIdRef = useRef(0);

  useEffect(() => {
    fetchLatestReportDate().then(setLatestDate);
  }, []);

  const loadData = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);

    try {
      const effectiveLatestDate = latestDate;
      const { end } = getDateRange(
        dateFilter,
        dateFilter === 'latest' ? effectiveLatestDate : undefined,
      );

      const divisionData = await fetchDivisionData(WATERPARK_DIVISION_ID, end);

      if (id !== fetchIdRef.current) return;

      setUnits(divisionData);
      setSelectedDateLabel(
        parseISO(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      );
    } catch (err) {
      console.error('[Waterpark Dashboard] Error loading data:', err);
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [dateFilter, latestDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Compute Group KPIs ──
  const totalRevenue = units.reduce(
    (s, u) => s + (u.mtd.metrics.get('mtd_revenue') ?? u.today.metrics.get('today_revenue') ?? 0),
    0,
  );
  const totalVisitors = units.reduce(
    (s, u) => s + (u.mtd.metrics.get('mtd_visitors') ?? u.today.metrics.get('today_visitors') ?? 0),
    0,
  );
  const todayVisitors = units.reduce(
    (s, u) => s + (u.today.metrics.get('today_visitors') ?? 0),
    0,
  );
  const todayRevenue = units.reduce(
    (s, u) => s + (u.today.metrics.get('today_revenue') ?? 0),
    0,
  );

  // ── Per-waterpark data ──
  const wpRows = units.map((u) => {
    const mtdRevenue = u.mtd.metrics.get('mtd_revenue') ?? u.today.metrics.get('today_revenue') ?? 0;
    const mtdBudget = u.mtd.budgets.get('mtd_revenue');
    const mtdStoredAch = u.mtd.achievements.get('mtd_revenue');
    const ytdRevenue = u.ytd.metrics.get('ytd_revenue') ?? 0;
    const ytdBudget = u.ytd.budgets.get('ytd_revenue');
    const ytdStoredAch = u.ytd.achievements.get('ytd_revenue');

    return {
      name: u.unitName,
      visitorToday: u.today.metrics.get('today_visitors') ?? 0,
      visitorMTD: u.mtd.metrics.get('mtd_visitors') ?? u.today.metrics.get('today_visitors') ?? 0,
      visitorYTD: u.ytd.metrics.get('ytd_visitors') ?? 0,
      revenueMTD: mtdRevenue,
      mtdBudget: mtdBudget ?? null,
      mtdAchievement: resolveAchievement(mtdStoredAch, mtdRevenue, mtdBudget),
      revenueYTD: ytdRevenue,
      ytdBudget: ytdBudget ?? null,
      ytdAchievement: resolveAchievement(ytdStoredAch, ytdRevenue, ytdBudget),
      gokartRevenue: u.mtd.metrics.get('mtd_gokart_revenue') ?? 0,
      mobilListrikRevenue: u.mtd.metrics.get('mtd_mobil_listrik_revenue') ?? 0,
      sportCenterRevenue: u.mtd.metrics.get('mtd_sport_center_revenue') ?? 0,
      sourceDate: u.mtd.sourceDate || u.today.sourceDate,
    };
  });

  const hasData = units.length > 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Waterpark</h1>
          <p className="page-subtitle">Monitoring kinerja Waterpark HTN, RIFAN, TOFAN, dan SIFAN</p>
        </div>
      </div>

      <DateFilter
        value={dateFilter}
        onChange={setDateFilter}
        latestDate={latestDate}
        className="mb-6"
      />

      {selectedDateLabel && (
        <p className="text-sm text-gray-500 mb-4">
          📅 Tanggal Laporan: <span className="font-semibold text-gray-700">{selectedDateLabel}</span>
        </p>
      )}

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
          <div className="text-4xl mb-4">🏊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada data waterpark untuk periode ini</h3>
          <p className="text-sm text-gray-500">
            {latestDate
              ? `Data terakhir tersedia: ${parseISO(latestDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Coba pilih "Latest" atau "Bulan Lalu".`
              : 'Belum ada laporan yang tersimpan di database.'}
          </p>
        </div>
      ) : (
        <>
          {/* Group Waterpark Summary */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Group Waterpark Summary</h2>
          <div className="grid-kpi mb-6">
            <KPICard
              title="Visitor Hari Ini"
              value={todayVisitors > 0 ? formatNumber(todayVisitors) : '-'}
            />
            <KPICard
              title="Visitor MTD"
              value={totalVisitors > 0 ? formatNumber(totalVisitors) : '-'}
            />
            <KPICard
              title="Revenue Hari Ini"
              value={formatCurrency(todayRevenue)}
            />
            <KPICard
              title="Revenue MTD"
              value={formatCurrency(totalRevenue)}
            />
          </div>

          <div className="grid-kpi mb-6">
            <KPICard
              title="Visitor YTD"
              value={formatNumber(
                units.reduce(
                  (s, u) => s + (u.ytd.metrics.get('ytd_visitors') ?? 0),
                  0,
                ),
              )}
            />
            <KPICard
              title="Revenue YTD"
              value={formatCurrency(
                units.reduce(
                  (s, u) => s + (u.ytd.metrics.get('ytd_revenue') ?? 0),
                  0,
                ),
              )}
            />
            <KPICard
              title="Unit Aktif"
              value={String(units.length)}
              subtitle="Waterpark"
            />
          </div>

          {/* Per-Waterpark Comparison Table */}
          <ComparisonTable
            title="Perbandingan Waterpark"
            rows={wpRows.map((w) => ({
              unit_name: w.name,
              division: 'Waterpark',
              metrics: [
                { label: 'Visitor Hari Ini', value: w.visitorToday, format: 'number' as const },
                { label: 'Visitor MTD', value: w.visitorMTD, format: 'number' as const },
                { label: 'Revenue MTD', value: w.revenueMTD, format: 'currency' as const },
                { label: 'Revenue YTD', value: w.revenueYTD, format: 'currency' as const },
              ],
            }))}
          />

          {/* Charts */}
          <div className="grid-charts mt-6 mb-6">
            <RevenueChart
              data={wpRows.map((w) => ({ name: w.name, actual: w.revenueMTD, budget: null }))}
              title="Revenue MTD per Waterpark"
            />
            <RevenueChart
              data={wpRows.map((w) => ({ name: w.name, actual: w.visitorMTD, budget: null }))}
              title="Visitor MTD per Waterpark"
            />
          </div>

          <div className="grid-charts mb-6">
            <RevenueChart
              data={wpRows
                .filter((w) => w.gokartRevenue > 0 || w.mobilListrikRevenue > 0 || w.sportCenterRevenue > 0)
                .map((w) => ({
                  name: w.name,
                  actual: w.gokartRevenue + w.mobilListrikRevenue + w.sportCenterRevenue,
                  budget: null,
                }))}
              title="Revenue Tambahan (Go-Kart, Mobil Listrik, Sport Center)"
            />
            <AchievementChart
              items={wpRows
                .filter((w) => w.visitorMTD > 0)
                .map((w) => ({
                  name: w.name,
                  achievement: w.visitorMTD,
                }))}
              title="Visitor Distribution"
              format="number"
            />
          </div>

          {/* Ranking Waterpark - Total Revenue (MTD & YTD) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Ranking Waterpark - Total Revenue (MTD & YTD)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium w-10">#</th>
                    <th className="pb-2 font-medium">Unit</th>
                    <th className="pb-2 font-medium text-right">Total Revenue MTD</th>
                    <th className="pb-2 font-medium text-right">Budget MTD</th>
                    <th className="pb-2 font-medium text-right">Achievement MTD</th>
                    <th className="pb-2 font-medium text-right">Total Revenue YTD</th>
                    <th className="pb-2 font-medium text-right">Budget YTD</th>
                    <th className="pb-2 font-medium text-right">Achievement YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {[...wpRows]
                    .sort((a, b) => b.revenueMTD - a.revenueMTD)
                    .map((w, i) => (
                      <tr key={w.name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border',
                              i === 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              i === 1 ? 'bg-gray-100 text-gray-600 border-gray-300' :
                              i === 2 ? 'bg-orange-100 text-orange-700 border-orange-300' :
                              'bg-gray-50 text-gray-500 border-gray-200'
                            )}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-gray-900">{w.name}</td>
                        <td className="py-3 text-right text-gray-700">{formatCurrency(w.revenueMTD)}</td>
                        <td className="py-3 text-right text-gray-500">
                          {w.mtdBudget ? formatCurrency(w.mtdBudget) : '-'}
                        </td>
                        <td className="py-3 text-right">
                          {w.mtdAchievement !== null ? (
                            <span className={achievementBadgeClass(w.mtdAchievement)}>
                              {w.mtdAchievement.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-gray-700">{formatCurrency(w.revenueYTD)}</td>
                        <td className="py-3 text-right text-gray-500">
                          {w.ytdBudget ? formatCurrency(w.ytdBudget) : '-'}
                        </td>
                        <td className="py-3 text-right">
                          {w.ytdAchievement !== null ? (
                            <span className={achievementBadgeClass(w.ytdAchievement)}>
                              {w.ytdAchievement.toFixed(1)}%
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
        </>
      )}
    </div>
  );
}
