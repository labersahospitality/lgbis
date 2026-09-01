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

    // Simulate parsing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Demo parser - extracts patterns from text
    const metrics = extractMetricsFromText(rawText, division as DivisionCode);

    const preview: ParsedPreview = {
      unit_name: selectedUnit?.name || '',
      unit_code: selectedUnit?.code || '',
      report_date: reportDate,
      metrics,
      warnings: metrics.length === 0 ? ['Tidak ada metric yang berhasil diparsing. Periksa format laporan.'] : [],
    };

    setParsed(preview);
    setParsing(false);
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);

    // Simulate save to Supabase
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSaving(false);
    setSaved(true);

    // Reset after 3 seconds
    setTimeout(() => {
      setSaved(false);
      setParsed(null);
      setRawText('');
    }, 3000);
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

// ============================================================
// PARSER HELPER - Modular, extensible per division
// ============================================================
function extractMetricsFromText(text: string, division: DivisionCode): ParsedMetric[] {
  const metrics: ParsedMetric[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/[,:]/g, '').trim();
    if (!normalized) continue;

    // Common patterns
    const patterns: Array<{ regex: RegExp; name: string; category: string; unit: 'currency' | 'percent' | 'number' }> = [
      // Hotel patterns
      { regex: /occupancy\s*[:.]?\s*(\d+\.?\d*)\s*%?/i, name: 'occupancy', category: 'room', unit: 'percent' },
      { regex: /room\s*sold\s*[:.]?\s*([\d.,]+)/i, name: 'room_sold', category: 'room', unit: 'number' },
      { regex: /available\s*room\s*[:.]?\s*([\d.,]+)/i, name: 'available_room', category: 'room', unit: 'number' },
      { regex: /(?:arr|average\s*room\s*rate)\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i, name: 'arr', category: 'room', unit: 'currency' },
      { regex: /room\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i, name: 'room_revenue', category: 'revenue', unit: 'currency' },
      { regex: /(?:f&?b|food\s*&?\s*beverage)\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i, name: 'fb_revenue', category: 'revenue', unit: 'currency' },
      { regex: /other\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i, name: 'other_revenue', category: 'revenue', unit: 'currency' },
      { regex: /total\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i, name: 'total_revenue', category: 'revenue', unit: 'currency' },

      // Waterpark patterns
      { regex: /visitor\s*[:.]?\s*([\d.,]+)/i, name: 'visitor', category: 'traffic', unit: 'number' },
      { regex: /pengunjung\s*[:.]?\s*([\d.,]+)/i, name: 'visitor', category: 'traffic', unit: 'number' },

      // Golf patterns
      { regex: /(?:total\s*)?player\s*[:.]?\s*([\d.,]+)/i, name: 'total_player', category: 'traffic', unit: 'number' },

      // Common patterns
      { regex: /budget\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i, name: 'budget', category: 'financial', unit: 'currency' },
      { regex: /revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i, name: 'revenue', category: 'revenue', unit: 'currency' },
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern.regex);
      if (match) {
        const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));

        if (!isNaN(value) && value > 0) {
          // Check if metric already exists
          const existing = metrics.find((m) => m.name === pattern.name);
          if (!existing) {
            metrics.push({
              name: pattern.name,
              category: pattern.category,
              actual: value,
              budget: null,
              variance: null,
              achievement: null,
              unit: pattern.unit,
            });
          }
        }
      }
    }
  }

  // Calculate variance and achievement where budget is available
  for (const metric of metrics) {
    if (metric.actual !== null && metric.budget !== null && metric.budget > 0) {
      metric.variance = metric.actual - metric.budget;
      metric.achievement = (metric.actual / metric.budget) * 100;
    }
  }

  return metrics;
}
