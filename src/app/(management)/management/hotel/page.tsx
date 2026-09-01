'use client';

import { useState } from 'react';
import KPICard from '@/components/ui/kpi-card';
import DateFilter from '@/components/ui/date-filter';
import RevenueChart from '@/components/charts/revenue-chart';
import TrendChart from '@/components/charts/trend-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import ComparisonTable from '@/components/ui/comparison-table';
import RankingTable from '@/components/ui/ranking-table';
import { DEMO_HOTEL_PERFORMANCE, DEMO_REVENUE_CHART, DEMO_DAILY_TREND } from '@/lib/demo-data';
import { formatCurrency, formatPercent } from '@/lib/utils';

const IS_DEMO = true;

const HOTEL_DATA = DEMO_HOTEL_PERFORMANCE;

export default function HotelDashboard() {
  const [dateFilter, setDateFilter] = useState('this_month');

  const totalOccupancy = HOTEL_DATA.reduce((sum, h) => sum + h.occupancy, 0) / HOTEL_DATA.length;
  const totalRevenue = HOTEL_DATA.reduce((sum, h) => sum + h.totalRevenue, 0);
  const totalBudget = HOTEL_DATA.reduce((sum, h) => sum + h.budget, 0);
  const totalAchievement = totalBudget > 0 ? (totalRevenue / totalBudget) * 100 : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Hotel</h1>
          <p className="page-subtitle">Monitoring kinerja Hotel Pekanbaru, Toba, dan Samosir</p>
        </div>
        {IS_DEMO && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg font-semibold">
            ⚠ DEMO DATA
          </div>
        )}
      </div>

      <DateFilter value={dateFilter} onChange={setDateFilter} className="mb-6" />

      {/* Group Hotel Summary */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Group Hotel Summary</h2>
      <div className="grid-kpi mb-6">
        <KPICard
          title="Occupancy Rata-rata"
          value={formatPercent(totalOccupancy)}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Total Revenue MTD"
          value={formatCurrency(totalRevenue)}
          budget={formatCurrency(totalBudget)}
          achievement={totalAchievement}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="ARR Rata-rata"
          value={formatCurrency(550000)}
          subtitle="Average Room Rate"
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Rooms Sold Total"
          value="2,450"
          isDemo={IS_DEMO}
        />
      </div>

      {/* Hotel Comparison */}
      <ComparisonTable
        title="Perbandingan Hotel"
        rows={HOTEL_DATA.map((h) => ({
          unit_name: h.name,
          metrics: [
            { label: 'Occupancy', value: h.occupancy, format: 'percent' as const },
            { label: 'ARR', value: 500000 + Math.random() * 200000, format: 'currency' as const },
            { label: 'Room Revenue', value: h.roomRevenue, format: 'currency' as const },
            { label: 'F&B Revenue', value: h.fbRevenue, format: 'currency' as const },
            { label: 'Total Revenue', value: h.totalRevenue, format: 'currency' as const },
            { label: 'Achievement', value: h.achievement, format: 'percent' as const },
          ],
        }))}
        isDemo={IS_DEMO}
      />

      {/* Charts */}
      <div className="grid-charts mt-6 mb-6">
        <RevenueChart
          data={HOTEL_DATA.map((h) => ({ name: h.name, actual: h.totalRevenue, budget: h.budget }))}
          title="Revenue Actual vs Budget per Hotel"
          isDemo={IS_DEMO}
        />
        <AchievementChart
          items={HOTEL_DATA.map((h) => ({ name: h.name, achievement: h.achievement }))}
          title="Achievement per Hotel"
          isDemo={IS_DEMO}
        />
      </div>

      <div className="grid-charts mb-6">
        <TrendChart
          data={DEMO_DAILY_TREND}
          title="Trend Revenue Harian - Hotel"
          isDemo={IS_DEMO}
        />
        <RevenueChart
          data={HOTEL_DATA.map((h) => ({ name: `${h.name} - Room`, actual: h.roomRevenue, budget: h.roomRevenue * 1.1 }))}
          title="Room Revenue per Hotel"
          isDemo={IS_DEMO}
        />
      </div>

      <RankingTable
        items={HOTEL_DATA.sort((a, b) => b.achievement - a.achievement).map((h, i) => ({
          rank: i + 1,
          name: h.name,
          value: h.totalRevenue,
          budget: h.budget,
          achievement: h.achievement,
          format: 'currency' as const,
        }))}
        title="Ranking Hotel - Achievement"
        isDemo={IS_DEMO}
      />
    </div>
  );
}
