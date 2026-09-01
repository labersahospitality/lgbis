'use client';

import { useState } from 'react';
import KPICard from '@/components/ui/kpi-card';
import DateFilter from '@/components/ui/date-filter';
import RevenueChart from '@/components/charts/revenue-chart';
import TrendChart from '@/components/charts/trend-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import ComparisonTable from '@/components/ui/comparison-table';
import RankingTable from '@/components/ui/ranking-table';
import { DEMO_WATERPARK_PERFORMANCE, DEMO_DAILY_TREND } from '@/lib/demo-data';
import { formatCurrency, formatNumber } from '@/lib/utils';

const IS_DEMO = true;

const WP_DATA = DEMO_WATERPARK_PERFORMANCE;

export default function WaterparkDashboard() {
  const [dateFilter, setDateFilter] = useState('this_month');

  const totalVisitorMTD = WP_DATA.reduce((sum, w) => sum + w.visitorMTD, 0);
  const totalRevenueMTD = WP_DATA.reduce((sum, w) => sum + w.revenueMTD, 0);
  const totalBudget = WP_DATA.reduce((sum, w) => sum + w.budget, 0);
  const totalAchievement = totalBudget > 0 ? (totalRevenueMTD / totalBudget) * 100 : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Waterpark</h1>
          <p className="page-subtitle">Monitoring kinerja Waterpark HTN, RIFAN, TOFAN, dan SIFAN</p>
        </div>
        {IS_DEMO && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg font-semibold">
            ⚠ DEMO DATA
          </div>
        )}
      </div>

      <DateFilter value={dateFilter} onChange={setDateFilter} className="mb-6" />

      {/* KPI */}
      <div className="grid-kpi mb-6">
        <KPICard
          title="Visitor Hari Ini"
          value={formatNumber(WP_DATA.reduce((sum, w) => sum + w.visitorToday, 0))}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Visitor MTD"
          value={formatNumber(totalVisitorMTD)}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Revenue MTD"
          value={formatCurrency(totalRevenueMTD)}
          budget={formatCurrency(totalBudget)}
          achievement={totalAchievement}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Achievement Rata-rata"
          value={`${totalAchievement?.toFixed(1) ?? '-'}%`}
          isDemo={IS_DEMO}
        />
      </div>

      {/* Comparison */}
      <ComparisonTable
        title="Perbandingan Waterpark"
        rows={WP_DATA.map((w) => ({
          unit_name: w.name,
          metrics: [
            { label: 'Visitor Hari Ini', value: w.visitorToday, format: 'number' as const },
            { label: 'Visitor MTD', value: w.visitorMTD, format: 'number' as const },
            { label: 'Revenue MTD', value: w.revenueMTD, format: 'currency' as const },
            { label: 'Budget', value: w.budget, format: 'currency' as const },
            { label: 'Achievement', value: w.achievement, format: 'percent' as const },
          ],
        }))}
        isDemo={IS_DEMO}
      />

      {/* Charts */}
      <div className="grid-charts mt-6 mb-6">
        <RevenueChart
          data={WP_DATA.map((w) => ({ name: w.name, actual: w.revenueMTD, budget: w.budget }))}
          title="Revenue Actual vs Budget per Waterpark"
          isDemo={IS_DEMO}
        />
        <AchievementChart
          items={WP_DATA.map((w) => ({ name: w.name, achievement: w.achievement }))}
          title="Achievement per Waterpark"
          isDemo={IS_DEMO}
        />
      </div>

      <div className="grid-charts mb-6">
        <RevenueChart
          data={WP_DATA.map((w) => ({ name: w.name, actual: w.visitorMTD, budget: w.visitorMTD * 1.2 }))}
          title="Visitor Actual vs Budget"
          isDemo={IS_DEMO}
        />
        <TrendChart
          data={DEMO_DAILY_TREND.map((d) => ({ ...d, actual: d.actual * 0.4, budget: d.budget * 0.4 }))}
          title="Trend Visitor Harian - Waterpark"
          isDemo={IS_DEMO}
        />
      </div>

      <RankingTable
        items={WP_DATA.sort((a, b) => b.achievement - a.achievement).map((w, i) => ({
          rank: i + 1,
          name: w.name,
          value: w.revenueMTD,
          budget: w.budget,
          achievement: w.achievement,
          format: 'currency' as const,
        }))}
        title="Ranking Waterpark - Achievement"
        valueLabel="Revenue MTD"
        isDemo={IS_DEMO}
      />
    </div>
  );
}
