'use client';

import { useState } from 'react';
import ComparisonTable from '@/components/ui/comparison-table';
import RevenueChart from '@/components/charts/revenue-chart';
import AchievementChart from '@/components/charts/achievement-chart';
import RankingTable from '@/components/ui/ranking-table';
import {
  DEMO_HOTEL_PERFORMANCE,
  DEMO_WATERPARK_PERFORMANCE,
  DEMO_GOLF_PERFORMANCE,
} from '@/lib/demo-data';

const IS_DEMO = true;

type ComparisonMode = 'hotel' | 'waterpark' | 'division';

export default function ComparisonPage() {
  const [mode, setMode] = useState<ComparisonMode>('hotel');

  const divisionComparison = [
    {
      unit_name: 'Hotel Division',
      division: 'Hotel',
      metrics: [
        { label: 'Revenue MTD', value: 6800000000, format: 'currency' as const },
        { label: 'Budget', value: 7500000000, format: 'currency' as const },
        { label: 'Achievement', value: 90.7, format: 'percent' as const },
      ],
    },
    {
      unit_name: 'Waterpark Division',
      division: 'Waterpark',
      metrics: [
        { label: 'Revenue MTD', value: 3775000000, format: 'currency' as const },
        { label: 'Budget', value: 5000000000, format: 'currency' as const },
        { label: 'Achievement', value: 75.5, format: 'percent' as const },
      ],
    },
    {
      unit_name: 'Golf Division',
      division: 'Golf',
      metrics: [
        { label: 'Revenue MTD', value: DEMO_GOLF_PERFORMANCE.revenueMTD, format: 'currency' as const },
        { label: 'Budget', value: DEMO_GOLF_PERFORMANCE.budget / 12, format: 'currency' as const },
        { label: 'Achievement', value: DEMO_GOLF_PERFORMANCE.achievement, format: 'percent' as const },
      ],
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Perbandingan</h1>
          <p className="page-subtitle">Bandingkan kinerja antar unit dan divisi</p>
        </div>
        {IS_DEMO && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg font-semibold">
            ⚠ DEMO DATA
          </div>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'hotel' as const, label: 'Hotel vs Hotel' },
          { key: 'waterpark' as const, label: 'Waterpark vs Waterpark' },
          { key: 'division' as const, label: 'Division vs Division' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hotel vs Hotel */}
      {mode === 'hotel' && (
        <>
          <ComparisonTable
            title="Perbandingan Hotel - Harian"
            rows={DEMO_HOTEL_PERFORMANCE.map((h) => ({
              unit_name: h.name,
              metrics: [
                { label: 'Occupancy', value: h.occupancy, format: 'percent' as const },
                { label: 'Total Revenue', value: h.totalRevenue, format: 'currency' as const },
                { label: 'Budget', value: h.budget, format: 'currency' as const },
                { label: 'Achievement', value: h.achievement, format: 'percent' as const },
              ],
            }))}
            isDemo={IS_DEMO}
          />

          <div className="grid-charts mt-6 mb-6">
            <RevenueChart
              data={DEMO_HOTEL_PERFORMANCE.map((h) => ({
                name: h.name.replace('Labersa ', ''),
                actual: h.totalRevenue,
                budget: h.budget,
              }))}
              title="Revenue Actual vs Budget"
              isDemo={IS_DEMO}
            />
            <AchievementChart
              items={DEMO_HOTEL_PERFORMANCE.map((h) => ({
                name: h.name,
                achievement: h.achievement,
              }))}
              title="Achievement Comparison"
              isDemo={IS_DEMO}
            />
          </div>

          <RankingTable
            items={DEMO_HOTEL_PERFORMANCE.sort((a, b) => b.achievement - a.achievement).map((h, i) => ({
              rank: i + 1,
              name: h.name,
              value: h.totalRevenue,
              budget: h.budget,
              achievement: h.achievement,
              format: 'currency' as const,
            }))}
            title="Ranking Hotel"
            isDemo={IS_DEMO}
          />
        </>
      )}

      {/* Waterpark vs Waterpark */}
      {mode === 'waterpark' && (
        <>
          <ComparisonTable
            title="Perbandingan Waterpark"
            rows={DEMO_WATERPARK_PERFORMANCE.map((w) => ({
              unit_name: w.name,
              metrics: [
                { label: 'Visitor MTD', value: w.visitorMTD, format: 'number' as const },
                { label: 'Revenue MTD', value: w.revenueMTD, format: 'currency' as const },
                { label: 'Budget', value: w.budget, format: 'currency' as const },
                { label: 'Achievement', value: w.achievement, format: 'percent' as const },
              ],
            }))}
            isDemo={IS_DEMO}
          />

          <div className="grid-charts mt-6 mb-6">
            <RevenueChart
              data={DEMO_WATERPARK_PERFORMANCE.map((w) => ({
                name: w.name.replace('Waterpark ', ''),
                actual: w.revenueMTD,
                budget: w.budget,
              }))}
              title="Revenue Actual vs Budget"
              isDemo={IS_DEMO}
            />
            <AchievementChart
              items={DEMO_WATERPARK_PERFORMANCE.map((w) => ({
                name: w.name,
                achievement: w.achievement,
              }))}
              title="Achievement Comparison"
              isDemo={IS_DEMO}
            />
          </div>

          <RankingTable
            items={DEMO_WATERPARK_PERFORMANCE.sort((a, b) => b.achievement - a.achievement).map((w, i) => ({
              rank: i + 1,
              name: w.name,
              value: w.revenueMTD,
              budget: w.budget,
              achievement: w.achievement,
              format: 'currency' as const,
            }))}
            title="Ranking Waterpark"
            valueLabel="Revenue MTD"
            isDemo={IS_DEMO}
          />
        </>
      )}

      {/* Division vs Division */}
      {mode === 'division' && (
        <>
          <ComparisonTable
            title="Perbandingan Divisi"
            rows={divisionComparison}
            isDemo={IS_DEMO}
          />

          <div className="grid-charts mt-6 mb-6">
            <RevenueChart
              data={divisionComparison.map((d) => ({
                name: d.unit_name.replace(' Division', ''),
                actual: d.metrics[0].value as number,
                budget: d.metrics[1].value as number,
              }))}
              title="Revenue Actual vs Budget per Divisi"
              isDemo={IS_DEMO}
            />
            <AchievementChart
              items={divisionComparison.map((d) => ({
                name: d.unit_name,
                achievement: d.metrics[2].value as number,
              }))}
              title="Achievement per Divisi"
              isDemo={IS_DEMO}
            />
          </div>
        </>
      )}
    </div>
  );
}
