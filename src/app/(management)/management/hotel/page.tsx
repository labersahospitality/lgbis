'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import KPICard from '@/components/ui/kpi-card';
import DateFilter from '@/components/ui/date-filter';
import RevenueChart from '@/components/charts/revenue-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import ComparisonTable from '@/components/ui/comparison-table';
import { fetchDivisionData, fetchLatestReportDate, type DivisionUnitData } from '@/lib/dashboard-data';
import { formatCurrency, formatPercent, getDateRange, cn } from '@/lib/utils';
import { parseISO } from 'date-fns';

function achievementBadgeClass(value: number): string {
  return cn(
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
    value >= 100 ? 'bg-emerald-100 text-emerald-700' :
    value >= 90 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700'
  );
}

const HOTEL_DIVISION_ID = 'div-hotel';

// Resolve achievement % for a period:
// - Compute from actual / budget × 100 when budget > 0 (authoritative and
//   precise; report-stored percents can be coarse integers, e.g. 20%).
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

export default function HotelDashboard() {
  const [dateFilter, setDateFilter] = useState('latest');
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [units, setUnits] = useState<DivisionUnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateLabel, setSelectedDateLabel] = useState('');
  const fetchIdRef = useRef(0);

  // Fetch latest report date on mount
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

      const divisionData = await fetchDivisionData(HOTEL_DIVISION_ID, end);

      if (id !== fetchIdRef.current) return;

      setUnits(divisionData);
      setSelectedDateLabel(
        parseISO(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      );
    } catch (err) {
      console.error('[Hotel Dashboard] Error loading data:', err);
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [dateFilter, latestDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Compute Group KPIs (weighted across all hotels) ──
  //
  // Occupancy = (Σ room_sold) / (Σ room_available) × 100
  // ARR       = (Σ room_revenue) / (Σ room_sold)
  //
  // These are WEIGHTED calculations — each hotel contributes
  // proportionally to its room inventory and sales volume.

  const totalRoomRevenue = units.reduce(
    (s, u) => s + (u.mtd.metrics.get('mtd_room_revenue') ?? u.today.metrics.get('today_room_revenue') ?? 0),
    0,
  );
  const totalFbRevenue = units.reduce(
    (s, u) => s + (u.mtd.metrics.get('mtd_fb_revenue') ?? u.today.metrics.get('today_fb_revenue') ?? 0),
    0,
  );
  const totalRevenue = units.reduce(
    (s, u) => s + (u.mtd.metrics.get('mtd_total_revenue') ?? u.today.metrics.get('today_total_revenue') ?? 0),
    0,
  );
  const totalRoomSold = units.reduce(
    (s, u) => s + (u.mtd.metrics.get('mtd_room_sold') ?? u.today.metrics.get('today_room_sold') ?? 0),
    0,
  );

  // Room available per hotel — three strategies:
  // 1. mtd_room_available metric (if parser captured it)
  // 2. mtd_room_saleable metric (alternative label)
  // 3. Derived from occupancy & room_sold: room_available = room_sold / (occupancy / 100)
  const totalRoomAvailable = units.reduce((s, u) => {
    // Try direct metric first
    const available = u.mtd.metrics.get('mtd_room_available') ?? u.today.metrics.get('today_room_available');
    if (available !== undefined && available > 0) return s + available;
    // Try saleable
    const saleable = u.mtd.metrics.get('mtd_room_saleable') ?? u.today.metrics.get('today_room_saleable');
    if (saleable !== undefined && saleable > 0) return s + saleable;
    // Derive from occupancy & room_sold
    const occ = u.mtd.metrics.get('mtd_occupancy') ?? u.today.metrics.get('today_occupancy');
    const sold = u.mtd.metrics.get('mtd_room_sold') ?? u.today.metrics.get('today_room_sold');
    if (occ !== undefined && occ > 0 && sold !== undefined && sold > 0) {
      return s + Math.round(sold / (occ / 100));
    }
    return s;
  }, 0);

  // Weighted Occupancy: totalRoomSold / totalRoomAvailable × 100
  const totalOccupancy = totalRoomAvailable > 0
    ? (totalRoomSold / totalRoomAvailable) * 100
    : null;

  // Weighted ARR: totalRoomRevenue / totalRoomSold
  const avgArr = totalRoomSold > 0 ? totalRoomRevenue / totalRoomSold : null;

  // ── Per-hotel data for comparison/ranking ──
  const hotelRows = units.map((u) => {
    const mtdTotal = u.mtd.metrics.get('mtd_total_revenue') ?? u.today.metrics.get('today_total_revenue') ?? 0;
    const mtdBudget = u.mtd.budgets.get('mtd_total_revenue');
    const mtdStoredAch = u.mtd.achievements.get('mtd_total_revenue');
    const ytdTotal = u.ytd.metrics.get('ytd_total_revenue') ?? 0;
    const ytdBudget = u.ytd.budgets.get('ytd_total_revenue');
    const ytdStoredAch = u.ytd.achievements.get('ytd_total_revenue');

    return {
      name: u.unitName,
      occupancy: u.mtd.metrics.get('mtd_occupancy') ?? u.today.metrics.get('today_occupancy') ?? null,
      roomRevenue: u.mtd.metrics.get('mtd_room_revenue') ?? u.today.metrics.get('today_room_revenue') ?? 0,
      fbRevenue: u.mtd.metrics.get('mtd_fb_revenue') ?? u.today.metrics.get('today_fb_revenue') ?? 0,
      totalRevenue: mtdTotal,
      mtdRevenue: mtdTotal,
      mtdBudget: mtdBudget ?? null,
      mtdAchievement: resolveAchievement(mtdStoredAch, mtdTotal, mtdBudget),
      ytdRevenue: ytdTotal,
      ytdBudget: ytdBudget ?? null,
      ytdAchievement: resolveAchievement(ytdStoredAch, ytdTotal, ytdBudget),
      arr: u.mtd.metrics.get('mtd_arr') ?? u.today.metrics.get('today_arr') ?? null,
      roomSold: u.mtd.metrics.get('mtd_room_sold') ?? u.today.metrics.get('today_room_sold') ?? 0,
      sourceDate: u.mtd.sourceDate || u.today.sourceDate,
    };
  });

  const hasData = units.length > 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Hotel</h1>
          <p className="page-subtitle">Monitoring kinerja Hotel Pekanbaru, Toba, dan Samosir</p>
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
        /* Skeleton loading */
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
        /* Empty state */
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada data hotel untuk periode ini</h3>
          <p className="text-sm text-gray-500">
            {latestDate
              ? `Data terakhir tersedia: ${parseISO(latestDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Coba pilih "Latest" atau "Bulan Lalu".`
              : 'Belum ada laporan yang tersimpan di database.'}
          </p>
        </div>
      ) : (
        <>
          {/* Group Hotel Summary KPIs */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Group Hotel Summary</h2>
          <div className="grid-kpi mb-6">
            <KPICard
              title="Occupancy Rata-rata"
              value={totalOccupancy !== null ? formatPercent(totalOccupancy) : '-'}
            />
            <KPICard
              title="Total Revenue"
              value={formatCurrency(totalRevenue)}
            />
            <KPICard
              title="ARR Rata-rata"
              value={avgArr !== null ? formatCurrency(avgArr) : '-'}
              subtitle="Average Room Rate"
            />
            <KPICard
              title="Rooms Sold Total"
              value={totalRoomSold > 0 ? new Intl.NumberFormat('id-ID').format(totalRoomSold) : '-'}
            />
          </div>

          {/* Revenue breakdown */}
          <div className="grid-kpi mb-6">
            <KPICard
              title="Room Revenue"
              value={formatCurrency(totalRoomRevenue)}
              subtitle="Total dari 3 hotel"
            />
            <KPICard
              title="F&B Revenue"
              value={formatCurrency(totalFbRevenue)}
              subtitle="Total dari 3 hotel"
            />
            <KPICard
              title="Hotel Count"
              value={String(units.length)}
              subtitle="Unit aktif"
            />
          </div>

          {/* Hotel Performance Table */}
          <ComparisonTable
            title="Hotel Performance"
            rows={hotelRows.map((h) => ({
              unit_name: h.name,
              division: 'Hotel',
              metrics: [
                { label: 'Occupancy', value: h.occupancy, format: 'percent' as const },
                { label: 'Room Sold', value: h.roomSold, format: 'number' as const },
                { label: 'ARR', value: h.arr, format: 'currency' as const },
                { label: 'Room Revenue', value: h.roomRevenue, format: 'currency' as const },
                { label: 'F&B Revenue', value: h.fbRevenue, format: 'currency' as const },
                { label: 'Total Revenue', value: h.totalRevenue, format: 'currency' as const },
              ],
            }))}
            totalRow={{
              unit_name: 'TOTAL GROUP',
              division: 'Hotel',
              metrics: [
                { label: 'Occupancy', value: totalOccupancy, format: 'percent' as const },
                { label: 'Room Sold', value: totalRoomSold, format: 'number' as const },
                { label: 'ARR', value: avgArr, format: 'currency' as const },
                { label: 'Room Revenue', value: totalRoomRevenue, format: 'currency' as const },
                { label: 'F&B Revenue', value: totalFbRevenue, format: 'currency' as const },
                { label: 'Total Revenue', value: totalRevenue, format: 'currency' as const },
              ],
            }}
          />

          {/* Charts */}
          <div className="grid-charts mt-6 mb-6">
            <RevenueChart
              data={hotelRows.map((h) => ({ name: h.name, actual: h.totalRevenue, budget: null }))}
              title="Total Revenue per Hotel"
            />
            <RevenueChart
              data={hotelRows.map((h) => ({ name: h.name, actual: h.roomRevenue, budget: null }))}
              title="Room Revenue per Hotel"
            />
          </div>

          <div className="grid-charts mb-6">
            <RevenueChart
              data={hotelRows.map((h) => ({ name: h.name, actual: h.fbRevenue, budget: null }))}
              title="F&B Revenue per Hotel"
            />
            <AchievementChart
              items={hotelRows
                .filter((h) => h.occupancy !== null)
                .map((h) => ({ name: h.name, achievement: h.occupancy! }))}
              title="Occupancy per Hotel"
            />
          </div>

          {/* Ranking Hotel - Total Revenue (MTD & YTD) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Ranking Hotel - Total Revenue (MTD & YTD)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium w-10">#</th>
                    <th className="pb-2 font-medium">Hotel</th>
                    <th className="pb-2 font-medium text-right">Total Revenue MTD</th>
                    <th className="pb-2 font-medium text-right">Budget MTD</th>
                    <th className="pb-2 font-medium text-right">Achievement MTD</th>
                    <th className="pb-2 font-medium text-right">Total Revenue YTD</th>
                    <th className="pb-2 font-medium text-right">Budget YTD</th>
                    <th className="pb-2 font-medium text-right">Achievement YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {[...hotelRows]
                    .sort((a, b) => b.mtdRevenue - a.mtdRevenue)
                    .map((h, i) => (
                      <tr key={h.name} className="border-b border-gray-50 hover:bg-gray-50">
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
                        <td className="py-3 font-medium text-gray-900">{h.name}</td>
                        <td className="py-3 text-right text-gray-700">{formatCurrency(h.mtdRevenue)}</td>
                        <td className="py-3 text-right text-gray-500">
                          {h.mtdBudget ? formatCurrency(h.mtdBudget) : '-'}
                        </td>
                        <td className="py-3 text-right">
                          {h.mtdAchievement !== null ? (
                            <span className={achievementBadgeClass(h.mtdAchievement)}>
                              {h.mtdAchievement.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-gray-700">{formatCurrency(h.ytdRevenue)}</td>
                        <td className="py-3 text-right text-gray-500">
                          {h.ytdBudget ? formatCurrency(h.ytdBudget) : '-'}
                        </td>
                        <td className="py-3 text-right">
                          {h.ytdAchievement !== null ? (
                            <span className={achievementBadgeClass(h.ytdAchievement)}>
                              {h.ytdAchievement.toFixed(1)}%
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
