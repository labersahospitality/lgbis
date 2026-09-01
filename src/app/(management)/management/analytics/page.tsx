'use client';

import { useState } from 'react';
import RevenueChart from '@/components/charts/revenue-chart';
import TrendChart from '@/components/charts/trend-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import {
  DEMO_REVENUE_CHART,
  DEMO_DAILY_TREND,
  DEMO_DIVISION_REVENUE,
  DEMO_HOTEL_PERFORMANCE,
  DEMO_WATERPARK_PERFORMANCE,
} from '@/lib/demo-data';

const IS_DEMO = true;

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('monthly');

  const ytdRevenue = Array.from({ length: 8 }, (_, i) => ({
    date: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'][i],
    actual: DEMO_REVENUE_CHART[i].actual,
    budget: DEMO_REVENUE_CHART[i].budget,
  }));

  const monthlyGrowth = ytdRevenue.map((d, i) => ({
    ...d,
    growth: i > 0 ? ((d.actual - ytdRevenue[i - 1].actual) / ytdRevenue[i - 1].actual) * 100 : 0,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Analisis mendalam kinerja Labersa Group</p>
        </div>
        {IS_DEMO && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg font-semibold">
            ⚠ DEMO DATA
          </div>
        )}
      </div>

      {/* Period Toggle */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'daily', label: 'Harian' },
          { key: 'monthly', label: 'Bulanan' },
          { key: 'ytd', label: 'YTD' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              period === p.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* YTD Performance */}
      <div className="grid-charts mb-6">
        <TrendChart
          data={ytdRevenue}
          title="YTD Performance - Revenue Actual vs Budget"
          height={350}
          isDemo={IS_DEMO}
        />
        <RevenueChart
          data={DEMO_DIVISION_REVENUE}
          title="Revenue per Divisi (YTD)"
          isDemo={IS_DEMO}
        />
      </div>

      {/* Growth Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Growth Analysis - Bulanan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Bulan</th>
                <th className="pb-2 font-medium text-right">Actual</th>
                <th className="pb-2 font-medium text-right">Budget</th>
                <th className="pb-2 font-medium text-right">Achievement</th>
                <th className="pb-2 font-medium text-right">Growth</th>
              </tr>
            </thead>
            <tbody>
              {monthlyGrowth.map((m, i) => {
                const achievement = (m.actual / m.budget) * 100;
                return (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium">{m.date}</td>
                    <td className="py-2.5 text-right">
                      Rp {(m.actual / 1000000000).toFixed(1)}M
                    </td>
                    <td className="py-2.5 text-right">
                      Rp {(m.budget / 1000000000).toFixed(1)}M
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`font-semibold ${
                        achievement >= 100 ? 'text-emerald-600' : achievement >= 90 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {achievement.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {i > 0 && (
                        <span className={`font-medium ${
                          m.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {m.growth >= 0 ? '+' : ''}{m.growth.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit Achievement Overview */}
      <div className="grid-charts mb-6">
        <AchievementChart
          items={[
            ...DEMO_HOTEL_PERFORMANCE.map((h) => ({ name: h.name, achievement: h.achievement })),
          ]}
          title="Achievement - Hotel"
          isDemo={IS_DEMO}
        />
        <AchievementChart
          items={[
            ...DEMO_WATERPARK_PERFORMANCE.map((w) => ({ name: w.name, achievement: w.achievement })),
          ]}
          title="Achievement - Waterpark"
          isDemo={IS_DEMO}
        />
      </div>

      {/* Daily Trend */}
      <TrendChart
        data={DEMO_DAILY_TREND}
        title="Trend Revenue Harian (30 Hari)"
        height={350}
        isDemo={IS_DEMO}
      />
    </div>
  );
}
