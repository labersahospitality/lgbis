'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import KPICard from '@/components/ui/kpi-card';
import DateFilter from '@/components/ui/date-filter';
import RevenueChart from '@/components/charts/revenue-chart';
import TrendChart from '@/components/charts/trend-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import RankingTable from '@/components/ui/ranking-table';
import ComparisonTable from '@/components/ui/comparison-table';
import {
  DEMO_KPI,
  DEMO_REVENUE_CHART,
  DEMO_DAILY_TREND,
  DEMO_DIVISION_REVENUE,
  DEMO_UNIT_REVENUE,
  DEMO_HOTEL_PERFORMANCE,
} from '@/lib/demo-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  BarChart3,
} from 'lucide-react';

const IS_DEMO = true;

export default function ManagementDashboard() {
  const [dateFilter, setDateFilter] = useState('this_month');

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
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          <span className="font-semibold">⚠ MODE DEMO</span>
          <span>- Data ditampilkan untuk preview UI</span>
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <DateFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* KPI Cards */}
      <div className="grid-kpi mb-6">
        <KPICard
          title="Revenue Hari Ini"
          value={formatCurrency(DEMO_KPI.revenueToday.value)}
          budget={formatCurrency(DEMO_KPI.revenueToday.budget)}
          achievement={DEMO_KPI.revenueToday.achievement}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Revenue MTD"
          value={formatCurrency(DEMO_KPI.revenueMTD.value)}
          budget={formatCurrency(DEMO_KPI.revenueMTD.budget)}
          achievement={DEMO_KPI.revenueMTD.achievement}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Revenue YTD"
          value={formatCurrency(DEMO_KPI.revenueYTD.value)}
          budget={formatCurrency(DEMO_KPI.revenueYTD.budget)}
          achievement={DEMO_KPI.revenueYTD.achievement}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Profit Hari Ini"
          value={formatCurrency(DEMO_KPI.profitToday.value)}
          budget={formatCurrency(DEMO_KPI.profitToday.budget)}
          achievement={DEMO_KPI.profitToday.achievement}
          trend={DEMO_KPI.trend.value}
          isDemo={IS_DEMO}
        />
      </div>

      {/* Revenue Comparison Chart & Achievement */}
      <div className="grid-charts mb-6">
        <RevenueChart
          data={DEMO_REVENUE_CHART}
          title="Actual Revenue vs Budget (Bulanan)"
          isDemo={IS_DEMO}
        />
        <AchievementChart
          items={[
            { name: 'Revenue Hari Ini', achievement: DEMO_KPI.revenueToday.achievement },
            { name: 'Revenue MTD', achievement: DEMO_KPI.revenueMTD.achievement },
            { name: 'Revenue YTD', achievement: DEMO_KPI.revenueYTD.achievement },
            { name: 'Profit Hari Ini', achievement: DEMO_KPI.profitToday.achievement },
          ]}
          title="Achievement Overview"
          isDemo={IS_DEMO}
        />
      </div>

      {/* Division Revenue & Daily Trend */}
      <div className="grid-charts mb-6">
        <RevenueChart
          data={DEMO_DIVISION_REVENUE}
          title="Revenue per Divisi"
          isDemo={IS_DEMO}
        />
        <TrendChart
          data={DEMO_DAILY_TREND}
          title="Trend Revenue Harian"
          isDemo={IS_DEMO}
        />
      </div>

      {/* Unit Ranking */}
      <div className="mb-6">
        <RankingTable
          items={DEMO_UNIT_REVENUE.map((u, i) => ({
            rank: i + 1,
            name: u.name,
            value: u.actual,
            budget: u.budget,
            achievement: u.budget > 0 ? (u.actual / u.budget) * 100 : null,
            format: 'currency' as const,
          }))}
          title="Ranking Unit Bisnis - Revenue"
          isDemo={IS_DEMO}
        />
      </div>

      {/* Division Comparison */}
      <ComparisonTable
        title="Perbandingan Divisi - Revenue"
        rows={DEMO_HOTEL_PERFORMANCE.map((h) => ({
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
        isDemo={IS_DEMO}
      />
    </div>
  );
}
