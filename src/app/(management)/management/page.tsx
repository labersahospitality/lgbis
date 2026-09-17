'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import KPICard from '@/components/ui/kpi-card';
import DateFilter from '@/components/ui/date-filter';
import RevenueChart from '@/components/charts/revenue-chart';
import TrendChart from '@/components/charts/trend-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import RankingTable from '@/components/ui/ranking-table';
import ComparisonTable from '@/components/ui/comparison-table';
import { formatCurrency, getDateRange } from '@/lib/utils';
import {
  type KPIData,
  type ChartData,
  type TrendData,
  type UnitRanking,
  type HotelPerformance,
  fetchKPIs,
  fetchRevenueChart,
  fetchDivisionRevenue,
  fetchDailyTrend,
  fetchUnitRanking,
  fetchHotelPerformance,
  fetchLatestReportDate,
} from '@/lib/dashboard-data';
import { BarChart3, AlertCircle } from 'lucide-react';

export default function ManagementDashboard() {
  // 'latest' is the default — dashboard opens to real data, not calendar today
  const [dateFilter, setDateFilter] = useState('latest');
  const [latestDate, setLatestDate] = useState<string | null>(null);

  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [revenueChart, setRevenueChart] = useState<ChartData[]>([]);
  const [divisionRevenue, setDivisionRevenue] = useState<ChartData[]>([]);
  const [dailyTrend, setDailyTrend] = useState<TrendData[]>([]);
  const [unitRanking, setUnitRanking] = useState<UnitRanking[]>([]);
  const [hotelPerformance, setHotelPerformance] = useState<HotelPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve the effective dateFilter and latestDate
  // For 'latest': use latestDate from Supabase
  // For others: use calendar clock
  const effectiveFilter = dateFilter;
  const effectiveLatestDate = dateFilter === 'latest' ? latestDate : undefined;

  // Compute selectedDate for display
  const { end: selectedDate } = getDateRange(
    effectiveFilter,
    effectiveFilter === 'latest' ? latestDate : undefined,
  );

  // Use a ref to track the latest fetch call and prevent race conditions
  const fetchIdRef = useRef(0);

  const loadData = useCallback(async () => {
    const thisFetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      // Parse custom filter inside callback to avoid new array ref every render
      const isCustom = effectiveFilter.startsWith('custom:');
      const parts = isCustom ? effectiveFilter.split(':') : [];
      const filterArg = isCustom ? 'custom' : effectiveFilter;
      const customStart = isCustom ? parts[1] : undefined;
      const customEnd = isCustom ? parts[2] : undefined;

      const [k, rc, dr, dt, ur, hp] = await Promise.all([
        fetchKPIs(filterArg, effectiveLatestDate, customStart, customEnd),
        fetchRevenueChart(filterArg, effectiveLatestDate, customStart, customEnd),
        fetchDivisionRevenue(filterArg, effectiveLatestDate, customStart, customEnd),
        fetchDailyTrend(filterArg, effectiveLatestDate, customStart, customEnd),
        fetchUnitRanking(filterArg, effectiveLatestDate, customStart, customEnd),
        fetchHotelPerformance(filterArg, effectiveLatestDate, customStart, customEnd),
      ]);

      // Only apply results if this is still the latest fetch
      if (thisFetchId !== fetchIdRef.current) return;

      setKpis(k);
      setRevenueChart(rc);
      setDivisionRevenue(dr);
      setDailyTrend(dt);
      setUnitRanking(ur);
      setHotelPerformance(hp);
    } catch (err) {
      if (thisFetchId !== fetchIdRef.current) return;
      console.error('[LGBIS] Dashboard fetch error:', err);
    } finally {
      if (thisFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [effectiveFilter, effectiveLatestDate]);

  // Fetch latest report date on mount
  useEffect(() => {
    let cancelled = false;
    fetchLatestReportDate().then((date) => {
      if (!cancelled) setLatestDate(date);
    });
    return () => { cancelled = true; };
  }, []);

  // Load data whenever filter or latestDate changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilter: string) => {
    setDateFilter(newFilter);
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">LABERSA GROUP BUSINESS INTELLIGENCE</h1>
            <p className="page-subtitle">Dashboard Utama - Monitoring Kinerja Seluruh Unit Bisnis</p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 h-80" />
            <div className="bg-white rounded-xl border border-gray-200 p-5 h-80" />
          </div>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">LABERSA GROUP BUSINESS INTELLIGENCE</h1>
            <p className="page-subtitle">Dashboard Utama - Monitoring Kinerja Seluruh Unit Bisnis</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Gagal memuat data dashboard.</p>
        </div>
      </div>
    );
  }

  const hasData = kpis.revenueToday.value > 0 || kpis.revenueMTD.value > 0 || kpis.revenueYTD.value > 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">LABERSA GROUP BUSINESS INTELLIGENCE</h1>
          <p className="page-subtitle">
            Dashboard Utama - Monitoring Kinerja Seluruh Unit Bisnis
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <DateFilter
          value={dateFilter}
          onChange={handleFilterChange}
          latestDate={latestDate}
          selectedDate={selectedDate}
          mtdSourceDate={kpis.revenueMTD.sourceDate}
          ytdSourceDate={kpis.revenueYTD.sourceDate}
        />
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mb-6">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">Tidak ada data untuk periode ini</p>
          <p className="text-gray-400 text-sm">
            {latestDate
              ? `Data terakhir tersedia: ${latestDate}. Coba pilih "Latest" atau "Bulan Lalu".`
              : 'Belum ada laporan yang diinput. Data akan muncul setelah admin menginput laporan WhatsApp.'
            }
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-kpi mb-6">
        <KPICard
          title="Revenue Hari Ini"
          value={formatCurrency(kpis.revenueToday.value)}
          budget={kpis.revenueToday.budget ? formatCurrency(kpis.revenueToday.budget) : null}
          achievement={kpis.revenueToday.achievement}
          subtitle={kpis.revenueToday.sourceDate ? `Sumber: ${kpis.revenueToday.sourceDate}` : undefined}
        />
        <KPICard
          title="Revenue MTD"
          value={formatCurrency(kpis.revenueMTD.value)}
          budget={kpis.revenueMTD.budget ? formatCurrency(kpis.revenueMTD.budget) : null}
          achievement={kpis.revenueMTD.achievement}
          subtitle={kpis.revenueMTD.sourceDate ? `Sumber: ${kpis.revenueMTD.sourceDate}` : undefined}
        />
        <KPICard
          title="Revenue YTD"
          value={formatCurrency(kpis.revenueYTD.value)}
          budget={kpis.revenueYTD.budget ? formatCurrency(kpis.revenueYTD.budget) : null}
          achievement={kpis.revenueYTD.achievement}
          subtitle={kpis.revenueYTD.sourceDate ? `Sumber: ${kpis.revenueYTD.sourceDate}` : undefined}
        />
        <KPICard
          title="Profit Hari Ini"
          value={kpis.profitToday.value !== null ? formatCurrency(kpis.profitToday.value) : '-'}
          budget={kpis.profitToday.budget ? formatCurrency(kpis.profitToday.budget) : null}
          achievement={kpis.profitToday.achievement}
          trend={kpis.trend}
        />
      </div>

      {/* Revenue Comparison Chart & Achievement */}
      <div className="grid-charts mb-6">
        <RevenueChart
          data={revenueChart}
          title="Actual Revenue vs Budget (Bulanan)"
        />
        <AchievementChart
          items={[
            { name: 'Revenue Hari Ini', achievement: kpis.revenueToday.achievement },
            { name: 'Revenue MTD', achievement: kpis.revenueMTD.achievement },
            { name: 'Revenue YTD', achievement: kpis.revenueYTD.achievement },
            ...(kpis.profitToday.achievement !== null
              ? [{ name: 'Profit Hari Ini', achievement: kpis.profitToday.achievement }]
              : []),
          ]}
          title="Achievement Overview"
        />
      </div>

      {/* Division Revenue & Daily Trend */}
      <div className="grid-charts mb-6">
        <RevenueChart
          data={divisionRevenue}
          title="Revenue per Divisi"
        />
        <TrendChart
          data={dailyTrend}
          title="Trend Revenue Harian"
        />
      </div>

      {/* Unit Ranking */}
      {unitRanking.length > 0 && (
        <div className="mb-6">
          <RankingTable
            items={unitRanking}
            title="Ranking Unit Bisnis - Revenue"
          />
        </div>
      )}

      {/* Hotel Performance Comparison */}
      {hotelPerformance.length > 0 && (
        <ComparisonTable
          title="Perbandingan Hotel - Revenue"
          rows={hotelPerformance.map((h) => ({
            unit_name: h.name,
            division: 'Hotel',
            metrics: [
              { label: 'Occupancy', value: h.occupancy, format: 'percent' as const },
              { label: 'Room Revenue', value: h.roomRevenue, format: 'currency' as const },
              { label: 'F&B Revenue', value: h.fbRevenue, format: 'currency' as const },
              { label: 'Total Revenue', value: h.totalRevenue, format: 'currency' as const },
              { label: 'Achievement', value: h.achievement, format: 'percent' as const },
            ],
          }))}
        />
      )}
    </div>
  );
}
