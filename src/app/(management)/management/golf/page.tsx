'use client';

import { useState } from 'react';
import KPICard from '@/components/ui/kpi-card';
import DateFilter from '@/components/ui/date-filter';
import RevenueChart from '@/components/charts/revenue-chart';
import TrendChart from '@/components/charts/trend-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import { DEMO_GOLF_PERFORMANCE, DEMO_DAILY_TREND } from '@/lib/demo-data';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

const IS_DEMO = true;
const GOLF = DEMO_GOLF_PERFORMANCE;

export default function GolfDashboard() {
  const [dateFilter, setDateFilter] = useState('this_month');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Golf</h1>
          <p className="page-subtitle">Monitoring kinerja Labersa Golf</p>
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
          title="Player Hari Ini"
          value={formatNumber(GOLF.totalPlayer)}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Revenue Hari Ini"
          value={formatCurrency(GOLF.revenueToday)}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Revenue MTD"
          value={formatCurrency(GOLF.revenueMTD)}
          budget={formatCurrency(GOLF.budget / 12)}
          achievement={GOLF.achievement}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Revenue YTD"
          value={formatCurrency(GOLF.revenueYTD)}
          budget={formatCurrency(GOLF.budget)}
          achievement={GOLF.achievement}
          isDemo={IS_DEMO}
        />
      </div>

      {/* Additional KPI Row */}
      <div className="grid-kpi mb-6">
        <KPICard
          title="Player MTD"
          value={formatNumber(GOLF.playerMTD)}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Player YTD"
          value={formatNumber(GOLF.playerYTD)}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Budget YTD"
          value={formatCurrency(GOLF.budget)}
          isDemo={IS_DEMO}
        />
        <KPICard
          title="Achievement YTD"
          value={formatPercent(GOLF.achievement)}
          isDemo={IS_DEMO}
        />
      </div>

      {/* Charts */}
      <div className="grid-charts mb-6">
        <RevenueChart
          data={[
            { name: 'Revenue', actual: GOLF.revenueYTD, budget: GOLF.budget },
          ]}
          title="Revenue Actual vs Budget - Labersa Golf"
          isDemo={IS_DEMO}
        />
        <AchievementChart
          items={[
            { name: 'Revenue Achievement', achievement: GOLF.achievement },
            { name: 'Player Target', achievement: 98.0 },
          ]}
          title="Achievement - Labersa Golf"
          isDemo={IS_DEMO}
        />
      </div>

      <div className="grid-charts mb-6">
        <TrendChart
          data={DEMO_DAILY_TREND.map((d) => ({
            ...d,
            actual: d.actual * 0.07,
            budget: d.budget * 0.07,
          }))}
          title="Trend Revenue Harian - Golf"
          isDemo={IS_DEMO}
        />
        <TrendChart
          data={Array.from({ length: 8 }, (_, i) => ({
            date: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'][i],
            actual: Math.floor(1200 + Math.random() * 800),
            budget: 1500,
          }))}
          title="Trend Player Bulanan - Golf"
          height={300}
          isDemo={IS_DEMO}
        />
      </div>
    </div>
  );
}
