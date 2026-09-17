'use client';

import { useState } from 'react';
import {
  BUSINESS_UNITS,
  HOTEL_UNITS,
  WATERPARK_UNITS,
  GOLF_UNITS,
  METRIC_LABELS,
} from '@/lib/constants';
import type { DivisionCode, ParsedMetric } from '@/lib/types';
import { parseReport } from '@/lib/parser';
import { createClient } from '@/lib/supabase/client';
import {
  ClipboardEdit,
  Play,
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface ParsedPreview {
  unit_name: string;
  unit_code: string;
  report_date: string;
  metrics: ParsedMetric[];
  warnings: string[];
}

interface PendingSave {
  supabase: ReturnType<typeof createClient>;
  user: { id: string };
  businessUnitId: string;
  periodGroups: Record<string, ParsedMetric[]>;
  parsed: ParsedPreview;
  rawText: string;
}

export default function AdminInputPage() {
  const [division, setDivision] = useState<DivisionCode | ''>('');
  const [unitId, setUnitId] = useState('');
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  

  const getUnits = () => {
    switch (division) {
      case 'HOTEL': return HOTEL_UNITS;
      case 'WATERPARK': return WATERPARK_UNITS;
      case 'GOLF': return GOLF_UNITS;
      default: return [];
    }
  };

  const selectedUnit = getUnits().find((u) => u.id === unitId);

  const handleParse = async () => {
    if (!rawText.trim() || !unitId || !reportDate) return;

    setParsing(true);

    // Use real parser
    const unitName = selectedUnit?.name || '';
    const unitCode = selectedUnit?.code || '';
    const result = parseReport(
      division as DivisionCode,
      unitCode,
      unitName,
      rawText,
    );

    const preview: ParsedPreview = {
      unit_name: unitName,
      unit_code: unitCode,
      report_date: reportDate,
      metrics: result.data.metrics,
      warnings: result.warnings.length > 0 ? result.warnings :
        result.data.metrics.length === 0 ? ['Tidak ada metric yang berhasil diparsing. Periksa format laporan.'] : [],
    };

    setParsed(preview);
    setParsing(false);
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);
    setSaveError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveError('Anda harus login untuk menyimpan data.');
        setSaving(false);
        return;
      }

      // Group metrics by period (today_, mtd_, ytd_)
      const periodGroups: Record<string, ParsedMetric[]> = {};
      for (const metric of parsed.metrics) {
        let period = 'daily';
        if (metric.name.startsWith('today_')) period = 'daily';
        else if (metric.name.startsWith('mtd_')) period = 'mtd';
        else if (metric.name.startsWith('ytd_')) period = 'ytd';

        if (!periodGroups[period]) periodGroups[period] = [];
        periodGroups[period].push(metric);
      }

      // Look up business_unit_id from code
      const allUnits = Object.values(BUSINESS_UNITS);
      const unitEntry = allUnits.find(
        (u) => u.code === parsed.unit_code || u.id === unitId
      );
      const businessUnitId = unitEntry?.id || unitId;
// Check if any active data exists for the periods we are about to save
       const { data: existingReports, error: checkError } = await supabase
         .from('daily_reports')
         .select('id, period_type')
         .eq('business_unit_id', businessUnitId)
         .eq('report_date', parsed.report_date)
         .in('period_type', Object.keys(periodGroups));

       if (checkError) {
         console.error('[LGBIS] Cek laporan aktif error:', checkError);
         setSaveError('Gagal memeriksa laporan yang ada.');
         setSaving(false);
         return;
       }

       if (existingReports && existingReports.length > 0) {
         // Store data needed for save after confirmation
         setPendingSave({ supabase, user, businessUnitId, periodGroups, parsed, rawText });
         setShowConfirm(true);
         setSaving(false);
         return;
       }

      // Insert daily_reports + report_metrics for each period
      for (const [periodType, metrics] of Object.entries(periodGroups)) {
        // Upsert daily_report (handle existing rows with same unit+date+period)
        const { data: report, error: reportError } = await supabase
          .from('daily_reports')
          .upsert({
            business_unit_id: businessUnitId,
            report_date: parsed.report_date,
            period_type: periodType,
            source: 'whatsapp',
            raw_text: rawText,
            created_by: user.id,
          }, {
            onConflict: 'business_unit_id,report_date,period_type',
          })
          .select('id')
          .single();

        if (reportError) {
          console.error('[LGBIS] daily_reports upsert error:', reportError);
          setSaveError(`Gagal menyimpan laporan: ${reportError.message}`);
          setSaving(false);
          return;
        }

        // Delete old metrics for this report (in case of re-save)
        await supabase
          .from('report_metrics')
          .delete()
          .eq('daily_report_id', report.id);

        // Create report_metrics
        const metricRows = metrics.map((m) => ({
          daily_report_id: report.id,
          metric_name: m.name,
          metric_category: m.category,
          actual_value: m.actual,
          budget_value: m.budget,
          variance_value: m.variance,
          achievement_percent: m.achievement,
          unit: m.unit,
        }));

        const { error: metricsError } = await supabase
          .from('report_metrics')
          .insert(metricRows);

        if (metricsError) {
          console.error('[LGBIS] report_metrics insert error:', metricsError);
          setSaveError(`Gagal menyimpan metrics: ${metricsError.message}`);
          setSaving(false);
          return;
        }

        // Log to report_imports
        await supabase.from('report_imports').insert({
          business_unit_id: businessUnitId,
          report_date: parsed.report_date,
          raw_text: rawText,
          parsed_data: JSON.stringify(metrics),
          status: 'saved',
          created_by: user.id,
        });
      }

      setSaving(false);
      setSaved(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setSaved(false);
        setParsed(null);
        setRawText('');
      }, 3000);
    } catch (err) {
      console.error('[LGBIS] Save error:', err);
      setSaveError('Terjadi kesalahan saat menyimpan. Silakan coba lagi.');
      setSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!pendingSave) return;
    setSaving(true);
    setSaveError('');

    try {
      const { supabase, user, businessUnitId, periodGroups, parsed, rawText } = pendingSave;
      for (const [periodType, metrics] of Object.entries(periodGroups)) {
        const { data: report, error: reportError } = await supabase
          .from('daily_reports')
          .upsert(
            {
              business_unit_id: businessUnitId,
              report_date: parsed.report_date,
              period_type: periodType,
              source: 'whatsapp',
              raw_text: rawText,
              created_by: user.id,
            },
            { onConflict: 'business_unit_id,report_date,period_type' }
          )
          .select('id')
          .single();

        if (reportError) {
          console.error('[LGBIS] daily_reports upsert error:', reportError);
          setSaveError(`Gagal menyimpan laporan: ${reportError.message}`);
          setSaving(false);
          setPendingSave(null);
          setShowConfirm(false);
          return;
        }

        await supabase
          .from('report_metrics')
          .delete()
          .eq('daily_report_id', report.id);

        const metricRows = metrics.map((m) => ({
          daily_report_id: report.id,
          metric_name: m.name,
          metric_category: m.category,
          actual_value: m.actual,
          budget_value: m.budget,
          variance_value: m.variance,
          achievement_percent: m.achievement,
          unit: m.unit,
        }));

        const { error: metricsError } = await supabase
          .from('report_metrics')
          .insert(metricRows);

        if (metricsError) {
          console.error('[LGBIS] report_metrics insert error:', metricsError);
          setSaveError(`Gagal menyimpan metrics: ${metricsError.message}`);
          setSaving(false);
          setPendingSave(null);
          setShowConfirm(false);
          return;
        }

        await supabase.from('report_imports').insert({
          business_unit_id: businessUnitId,
          report_date: parsed.report_date,
          raw_text: rawText,
          parsed_data: JSON.stringify(metrics),
          status: 'saved',
          created_by: user.id,
        });
      }

      setSaving(false);
      setSaved(true);
      setPendingSave(null);
      setShowConfirm(false);

      setTimeout(() => {
        setSaved(false);
        setParsed(null);
        setRawText('');
      }, 3000);
    } catch (err) {
      console.error('[LGBIS] Save error:', err);
      setSaveError('Terjadi kesalahan saat menyimpan. Silakan coba lagi.');
      setSaving(false);
      setPendingSave(null);
      setShowConfirm(false);
    }
  };

  const handleCancelSave = () => {
    setPendingSave(null);
    setShowConfirm(false);
    setSaving(false);
  };

  const handleReset = () => {
    setParsed(null);
    setRawText('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Input Laporan</h1>
          <p className="page-subtitle">Copy & paste laporan WhatsApp, lalu parse dan simpan</p>
        </div>
      </div>

      {saved && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            Laporan berhasil disimpan ke database!
          </span>
        </div>
      )}

      {saveError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-sm font-medium text-red-700">
            {saveError}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardEdit className="w-4 h-4" />
              Form Input
            </h3>

            <div className="space-y-4">
              {/* Division */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Divisi *
                </label>
                <select
                  value={division}
                  onChange={(e) => {
                    setDivision(e.target.value as DivisionCode);
                    setUnitId('');
                    setParsed(null);
                  }}
                  className="select-field"
                >
                  <option value="">Pilih Divisi</option>
                  <option value="HOTEL">Hotel</option>
                  <option value="WATERPARK">Waterpark</option>
                  <option value="GOLF">Golf</option>
                </select>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Unit *
                </label>
                <select
                  value={unitId}
                  onChange={(e) => {
                    setUnitId(e.target.value);
                    setParsed(null);
                  }}
                  className="select-field"
                  disabled={!division}
                >
                  <option value="">Pilih Unit</option>
                  {getUnits().map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tanggal Laporan *
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Textarea & Parse */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Copy / Paste Laporan WhatsApp
            </h3>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Tempel (paste) laporan WhatsApp di sini...\n\nContoh format:\n---\n*Labersa Hotel Samosir*\nDate: 31/08/2026\n\nOccupancy: 65%\nRoom Revenue: Rp 850.000.000\nF&B Revenue: Rp 420.000.000\nTotal Revenue: Rp 1.270.000.000\n---\n\nAtau format lain sesuai dengan yang dikirim via WhatsApp.`}
              className="textarea-field min-h-[300px] font-mono text-xs leading-relaxed"
              disabled={!!parsed}
            />

            <div className="flex items-center gap-3 mt-4">
              {!parsed ? (
                <button
                  onClick={handleParse}
                  disabled={!rawText.trim() || !unitId || !reportDate || parsing}
                  className="btn-primary"
                >
{showConfirm && (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
     <div className="bg-white rounded-lg p-6 w-96">
       <h3 className="text-lg font-medium mb-4">Konfirmasi Penyimpanan</h3>
       <p className="mb-6">
         Data laporan untuk unit dan tanggal tersebut sudah pernah disimpan. Jika dilanjutkan, data aktif akan diganti dengan data baru. Lanjutkan?
       </p>
       <div className="flex justify-end gap-3">
         <button
           onClick={handleCancelSave}
           className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
         >
           Batal
         </button>
         <button
           onClick={handleConfirmSave}
           className="px-4 py-2 bg-labersa text-white rounded hover:bg-labersa-dark"
         >
           Konfirmasi
         </button>
       </div>
     </div>
   </div>
 )}
                  {parsing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Parse Laporan
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button onClick={handleSave} disabled={saving} className="btn-success">
                    {saving ? 'Menyimpan...' : 'Simpan ke Database'}
                  </button>
                  <button onClick={handleReset} className="btn-secondary">
                    <X className="w-4 h-4" />
                    Batal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Data */}
      {parsed && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Preview Data
            </h3>
            <span className="text-xs text-gray-500">
              Periksa data sebelum disimpan
            </span>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="text-xs text-gray-500">Unit</span>
              <p className="text-sm font-semibold text-gray-900">{parsed.unit_name}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Tanggal</span>
              <p className="text-sm font-semibold text-gray-900">{parsed.report_date}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Kode Unit</span>
              <p className="text-sm font-semibold text-gray-900">{parsed.unit_code}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Metric Ditemukan</span>
              <p className="text-sm font-semibold text-gray-900">{parsed.metrics.length}</p>
            </div>
          </div>

          {/* Warnings */}
          {parsed.warnings.length > 0 && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Data membutuhkan pemeriksaan admin</p>
                {parsed.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700 mt-1">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Metric</th>
                  <th className="pb-2 font-medium text-right">Actual</th>
                  <th className="pb-2 font-medium text-right">Budget</th>
                  <th className="pb-2 font-medium text-right">Variance</th>
                  <th className="pb-2 font-medium text-right">Achievement</th>
                </tr>
              </thead>
              <tbody>
                {parsed.metrics.map((metric, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium text-gray-900">
                      {METRIC_LABELS[metric.name] || metric.name}
                    </td>
                    <td className="py-2.5 text-right">
                      {metric.unit === 'percent'
                        ? `${metric.actual}%`
                        : metric.unit === 'currency'
                        ? `Rp ${Number(metric.actual).toLocaleString('id-ID')}`
                        : Number(metric.actual).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 text-right text-gray-500">
                      {metric.budget !== null
                        ? metric.unit === 'percent'
                          ? `${metric.budget}%`
                          : `Rp ${Number(metric.budget).toLocaleString('id-ID')}`
                        : '-'}
                    </td>
                    <td className="py-2.5 text-right">
                      {metric.variance !== null ? (
                        <span className={metric.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {metric.variance >= 0 ? '+' : ''}
                          {metric.unit === 'percent'
                            ? `${metric.variance}%`
                            : `Rp ${Number(metric.variance).toLocaleString('id-ID')}`}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2.5 text-right">
                      {metric.achievement !== null ? (
                        <span className={
                          metric.achievement >= 100 ? 'text-emerald-600 font-semibold' :
                          metric.achievement >= 90 ? 'text-amber-600 font-semibold' :
                          'text-red-600 font-semibold'
                        }>
                          {metric.achievement.toFixed(1)}%
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

