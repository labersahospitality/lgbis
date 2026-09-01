'use client';

import { useState } from 'react';
import { formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { FileText, Download, Filter } from 'lucide-react';

const DEMO_REPORTS = [
  { id: '1', unit: 'Labersa Hotel Pekanbaru', date: '2026-08-31', status: 'saved', admin: 'Admin Utama', source: 'WhatsApp' },
  { id: '2', unit: 'Labersa Hotel Toba', date: '2026-08-31', status: 'saved', admin: 'Admin Utama', source: 'WhatsApp' },
  { id: '3', unit: 'Waterpark HTN', date: '2026-08-31', status: 'saved', admin: 'Admin WP', source: 'WhatsApp' },
  { id: '4', unit: 'Labersa Hotel Samosir', date: '2026-08-30', status: 'need_review', admin: 'Admin Utama', source: 'WhatsApp' },
  { id: '5', unit: 'Waterpark RIFAN', date: '2026-08-30', status: 'saved', admin: 'Admin WP', source: 'WhatsApp' },
  { id: '6', unit: 'Waterpark TOFAN', date: '2026-08-30', status: 'parsed', admin: 'Admin WP', source: 'WhatsApp' },
  { id: '7', unit: 'Waterpark SIFAN', date: '2026-08-30', status: 'error', admin: 'Admin WP', source: 'WhatsApp' },
  { id: '8', unit: 'Labersa Golf', date: '2026-08-30', status: 'saved', admin: 'Admin Golf', source: 'WhatsApp' },
];

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReports = statusFilter === 'all'
    ? DEMO_REPORTS
    : DEMO_REPORTS.filter((r) => r.status === statusFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan</h1>
          <p className="page-subtitle">Daftar seluruh laporan yang telah diinput</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        {['all', 'saved', 'parsed', 'need_review', 'error'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'Semua' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">Tanggal Laporan</th>
              <th className="px-5 py-3 font-medium">Admin</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{report.unit}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{formatDateShort(report.date)}</td>
                <td className="px-5 py-3.5 text-gray-600">{report.admin}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {getStatusLabel(report.status)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{report.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
