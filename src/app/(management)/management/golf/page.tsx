'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import KPICard from '@/components/ui/kpi-card';
import DateFilter from '@/components/ui/date-filter';
import RevenueChart from '@/components/charts/revenue-chart';
import { fetchDivisionData, fetchLatestReportDate, type DivisionUnitData } from '@/lib/dashboard-data';
import { formatCurrency, formatNumber, getDateRange, cn } from '@/lib/utils';
import { parseISO } from 'date-fns';

const GOLF_DIVISION_ID = 'div-golf';

function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-5', className)}>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function GolfDashboard() {
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

      const divisionData = await fetchDivisionData(GOLF_DIVISION_ID, end);

      if (id !== fetchIdRef.current) return;

      setUnits(divisionData);
      setSelectedDateLabel(
        parseISO(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      );
    } catch (err) {
      console.error('[Golf Dashboard] Error loading data:', err);
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [dateFilter, latestDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Aggregation helpers (sum across golf units) ────────────
  const sumMetric = (period: 'today' | 'mtd' | 'ytd', metricName: string): number =>
    units.reduce((s, u) => s + (u[period].metrics.get(metricName) ?? 0), 0);

  const sumBudget = (period: 'mtd' | 'ytd', metricName: string): number | null => {
    const budget = units.reduce<number | null>((acc, u) => {
      const b = u[period].budgets.get(metricName);
      if (b === null || b === undefined) return acc;
      return (acc ?? 0) + b;
    }, null);
    // Budget unavailable is stored as 0 — treat <= 0 as "not provided".
    return budget !== null && budget > 0 ? budget : null;
  };

  // ── Source dates ────────────────────────────────────────────
  const mtdSourceDate = units.length
    ? units.reduce<string | null>((best, u) => {
        const d = u.mtd.sourceDate;
        if (!d) return best;
        return !best || d > best ? d : best;
      }, null)
    : null;
  const ytdSourceDate = units.length
    ? units.reduce<string | null>((best, u) => {
        const d = u.ytd.sourceDate;
        if (!d) return best;
        return !best || d > best ? d : best;
      }, null)
    : null;

  // ── Group Golf KPIs ─────────────────────────────────────────
  const playerMTD = sumMetric('mtd', 'mtd_total_player');
  const revenueMTD = sumMetric('mtd', 'mtd_total_revenue');
  const playerYTD = sumMetric('ytd', 'ytd_total_player');
  const revenueYTD = sumMetric('ytd', 'ytd_total_revenue');

  const budgetMTD = sumBudget('mtd', 'mtd_total_revenue');
  const budgetYTD = sumBudget('ytd', 'ytd_total_revenue');
  const achievementMTD = budgetMTD !== null && budgetMTD > 0 ? (revenueMTD / budgetMTD) * 100 : null;
  const achievementYTD = budgetYTD !== null && budgetYTD > 0 ? (revenueYTD / budgetYTD) * 100 : null;

  // TODAY — daily report for the selected date. A daily report can exist with
  // Today actual values of 0 (valid reported data) — distinct from no report.
  const hasToday = units.some((u) => u.today.sourceDate !== null);
  const playerToday = sumMetric('today', 'today_total_player');
  const revenueToday = sumMetric('today', 'today_total_revenue');

  // ── Revenue breakdown by category ───────────────────────────
  const revenueRows = [
    { label: 'Golf Revenue', mtd: sumMetric('mtd', 'mtd_golf_revenue'), ytd: sumMetric('ytd', 'ytd_golf_revenue') },
    { label: 'Practice Range Revenue', mtd: sumMetric('mtd', 'mtd_practice_range_revenue'), ytd: sumMetric('ytd', 'ytd_practice_range_revenue') },
    { label: 'F&B Revenue', mtd: sumMetric('mtd', 'mtd_fb_revenue'), ytd: sumMetric('ytd', 'ytd_fb_revenue') },
    { label: 'Driving Restaurant Revenue', mtd: sumMetric('mtd', 'mtd_driving_restaurant_revenue'), ytd: sumMetric('ytd', 'ytd_driving_restaurant_revenue') },
  ];
  const totalRow = {
    label: 'Total Revenue (Excl. Service & Tax)',
    mtd: revenueMTD,
    ytd: revenueYTD,
  };

  // Revenue incl. service charge & tax
  const revenueWithTaxMTD = sumMetric('mtd', 'mtd_total_revenue_with_tax');
  const revenueWithTaxYTD = sumMetric('ytd', 'ytd_total_revenue_with_tax');

  // ── Player breakdown ────────────────────────────────────────
  const playerRows = [
    { label: 'Total Player', mtd: playerMTD, ytd: playerYTD },
    { label: 'Guest', mtd: sumMetric('mtd', 'mtd_player_guest'), ytd: sumMetric('ytd', 'ytd_player_guest') },
    { label: 'Membership', mtd: sumMetric('mtd', 'mtd_player_membership'), ytd: sumMetric('ytd', 'ytd_player_membership') },
    { label: 'Male', mtd: sumMetric('mtd', 'mtd_player_male'), ytd: sumMetric('ytd', 'ytd_player_male') },
    { label: 'Female', mtd: sumMetric('mtd', 'mtd_player_female'), ytd: sumMetric('ytd', 'ytd_player_female') },
  ];

  // Guest + Membership should equal Total Player when both exist
  const mtdGuest = sumMetric('mtd', 'mtd_player_guest');
  const mtdMembership = sumMetric('mtd', 'mtd_player_membership');
  const ytdGuest = sumMetric('ytd', 'ytd_player_guest');
  const ytdMembership = sumMetric('ytd', 'ytd_player_membership');
  const mtdBreakdownOk = playerMTD > 0 && mtdGuest + mtdMembership === playerMTD;
  const ytdBreakdownOk = playerYTD > 0 && ytdGuest + ytdMembership === playerYTD;

  // ── F&B additional KPIs ─────────────────────────────────────
  const foodCoversMTD = sumMetric('mtd', 'mtd_food_covers');
  const foodCoversYTD = sumMetric('ytd', 'ytd_food_covers');
  const avgCheckMTD = sumMetric('mtd', 'mtd_average_check');
  const avgCheckYTD = sumMetric('ytd', 'ytd_average_check');

  const hasData = units.length > 0 && (playerMTD > 0 || revenueMTD > 0 || playerYTD > 0 || revenueYTD > 0);

  const sourceLabel = (date: string | null): string =>
    date
      ? parseISO(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Golf</h1>
          <p className="page-subtitle">Monitoring kinerja Labersa Golf</p>
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
          <div className="text-4xl mb-4">⛳</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada data Golf untuk periode ini</h3>
          <p className="text-sm text-gray-500">
            {latestDate
              ? `Data terakhir tersedia: ${parseISO(latestDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Coba pilih "Latest" atau "Bulan Lalu".`
              : 'Belum ada laporan yang tersimpan di database.'}
          </p>
        </div>
      ) : (
        <>
          {/* ── TODAY ── */}
          {!hasToday ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
              <span className="font-semibold">Data Today tidak tersedia.</span>{' '}
              Belum ada laporan harian Golf untuk tanggal {selectedDateLabel || 'yang dipilih'}. Data MTD dan YTD di bawah
              berasal dari laporan periode terakhir yang tersedia.
            </div>
          ) : (
            <div className="mb-6">
              <div className="grid-kpi mb-2">
                <KPICard title="Player Hari Ini" value={formatNumber(playerToday)} subtitle={`Sumber: ${sourceLabel(units.find((u) => u.today.sourceDate)?.today.sourceDate ?? null)}`} />
                <KPICard title="Revenue Hari Ini" value={formatCurrency(revenueToday)} subtitle={`Sumber: ${sourceLabel(units.find((u) => u.today.sourceDate)?.today.sourceDate ?? null)}`} />
              </div>
              {playerToday === 0 && revenueToday === 0 && (
                <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  Laporan harian Golf untuk {selectedDateLabel} tersedia — seluruh nilai Today pada laporan sumber adalah 0
                  (bukan data yang hilang).
                </p>
              )}
            </div>
          )}

          {/* ── Group Golf KPIs (MTD & YTD) ── */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Group Golf Summary
          </h2>
          <div className="grid-kpi mb-6">
            <KPICard title="Total Player MTD" value={formatNumber(playerMTD)} subtitle={`Snapshot: ${sourceLabel(mtdSourceDate)}`} />
            <KPICard
              title="Total Revenue MTD"
              value={formatCurrency(revenueMTD)}
              budget={budgetMTD !== null ? formatCurrency(budgetMTD) : null}
              achievement={achievementMTD}
              subtitle={budgetMTD === null ? 'Budget tidak tersedia' : `Snapshot: ${sourceLabel(mtdSourceDate)}`}
            />
            <KPICard title="Total Player YTD" value={formatNumber(playerYTD)} subtitle={`Snapshot: ${sourceLabel(ytdSourceDate)}`} />
            <KPICard
              title="Total Revenue YTD"
              value={formatCurrency(revenueYTD)}
              budget={budgetYTD !== null ? formatCurrency(budgetYTD) : null}
              achievement={achievementYTD}
              subtitle={budgetYTD === null ? 'Budget tidak tersedia' : `Snapshot: ${sourceLabel(ytdSourceDate)}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* ── Revenue by Category ── */}
            <RevenueChart
              data={revenueRows.map((r) => ({ name: r.label.replace(' Revenue', ''), actual: r.mtd, budget: null }))}
              title="Revenue by Category - MTD"
              height={300}
            />
            <RevenueChart
              data={revenueRows.map((r) => ({ name: r.label.replace(' Revenue', ''), actual: r.ytd, budget: null }))}
              title="Revenue by Category - YTD"
              height={300}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* ── Revenue Breakdown table ── */}
            <SectionCard title="Golf Revenue Performance">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">Kategori</th>
                      <th className="pb-2 font-medium text-right">MTD</th>
                      <th className="pb-2 font-medium text-right">YTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueRows.map((r) => (
                      <tr key={r.label} className="border-b border-gray-50">
                        <td className="py-2.5 font-medium text-gray-900">{r.label}</td>
                        <td className="py-2.5 text-right text-gray-700">{formatCurrency(r.mtd)}</td>
                        <td className="py-2.5 text-right text-gray-700">{formatCurrency(r.ytd)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="py-2.5 font-bold text-gray-900">{totalRow.label}</td>
                      <td className="py-2.5 text-right font-bold text-gray-900">{formatCurrency(totalRow.mtd)}</td>
                      <td className="py-2.5 text-right font-bold text-gray-900">{formatCurrency(totalRow.ytd)}</td>
                    </tr>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="py-2.5 font-bold text-gray-900">Total Revenue With Service &amp; Tax</td>
                      <td className="py-2.5 text-right font-bold text-gray-900">{formatCurrency(revenueWithTaxMTD)}</td>
                      <td className="py-2.5 text-right font-bold text-gray-900">{formatCurrency(revenueWithTaxYTD)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Total Revenue Excl. Tax berbeda dari Total Revenue With Service &amp; Tax — keduanya tidak dicampur.
              </p>
            </SectionCard>

            {/* ── Player Performance ── */}
            <SectionCard title="Player Performance">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">Kategori</th>
                      <th className="pb-2 font-medium text-right">MTD</th>
                      <th className="pb-2 font-medium text-right">YTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerRows.map((r) => (
                      <tr key={r.label} className="border-b border-gray-50">
                        <td className="py-2.5 font-medium text-gray-900">{r.label}</td>
                        <td className="py-2.5 text-right text-gray-700">{formatNumber(r.mtd)}</td>
                        <td className="py-2.5 text-right text-gray-700">{formatNumber(r.ytd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {mtdBreakdownOk && ytdBreakdownOk
                  ? 'Validasi: Guest + Membership = Total Player (MTD & YTD) ✓'
                  : mtdBreakdownOk
                    ? 'Validasi: Guest + Membership = Total Player (MTD) ✓'
                    : 'Catatan: breakdown Guest/Membership hanya ditampilkan bila tersedia di laporan.'}
              </p>
            </SectionCard>
          </div>

          {/* ── F&B additional KPIs ── */}
          {(foodCoversMTD > 0 || foodCoversYTD > 0 || avgCheckMTD > 0 || avgCheckYTD > 0) && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">F&amp;B Performance</h2>
              <div className="grid-kpi mb-6">
                <KPICard title="Food Covers MTD" value={formatNumber(foodCoversMTD)} />
                <KPICard title="Average Check MTD" value={avgCheckMTD > 0 ? formatCurrency(avgCheckMTD) : '-'} />
                <KPICard title="Food Covers YTD" value={formatNumber(foodCoversYTD)} />
                <KPICard title="Average Check YTD" value={avgCheckYTD > 0 ? formatCurrency(avgCheckYTD) : '-'} />
              </div>
            </>
          )}

          {/* ── Budget & Achievement status ── */}
          {(budgetMTD === null || budgetYTD === null) && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-sm text-gray-600">
              <span className="font-semibold">Budget: Budget tidak tersedia.</span> Belum ada target budget Golf yang
              diinput (nilai budget di database kosong). <span className="font-semibold">Achievement: Budget tidak
              tersedia</span> — persentase pada laporan Golf adalah perbandingan terhadap tahun lalu, bukan achievement
              budget, sehingga tidak ditampilkan.
            </div>
          )}

          {/* ── Trend player ── */}
          <SectionCard title="Trend Player">
            <div className="py-10 text-center text-sm text-gray-500">
              Historical trend data belum tersedia. Data trend harian/bulanan akan tampil setelah laporan historis
              tersimpan di database.
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
