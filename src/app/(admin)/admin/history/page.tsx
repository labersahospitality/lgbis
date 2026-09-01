'use client';

import { useState } from 'react';
import { formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { History, Eye, Search, Filter } from 'lucide-react';

const DEMO_HISTORY = [
  {
    id: '1',
    unit: 'Labersa Hotel Pekanbaru',
    date: '2026-08-31',
    inputDate: '2026-08-31 08:15',
    admin: 'Admin Utama',
    status: 'saved',
    source: 'WhatsApp',
    rawPreview: 'Labersa Hotel Pekanbaru\nDate: 31/08/2026\nOccupancy: 78%\n...',
  },
  {
    id: '2',
    unit: 'Labersa Hotel Toba',
    date: '2026-08-31',
    inputDate: '2026-08-31 08:32',
    admin: 'Admin Utama',
    status: 'saved',
    source: 'WhatsApp',
    rawPreview: 'Labersa Hotel Toba\nDate: 31/08/2026\nOccupancy: 65%\n...',
  },
  {
    id: '3',
    unit: 'Waterpark HTN',
    date: '2026-08-31',
    inputDate: '2026-08-31 09:01',
    admin: 'Admin WP',
    status: 'saved',
    source: 'WhatsApp',
    rawPreview: 'Waterpark HTN\nVisitor: 850\nRevenue: Rp 42.500.000\n...',
  },
  {
    id: '4',
    unit: 'Labersa Hotel Samosir',
    date: '2026-08-30',
    inputDate: '2026-08-30 10:45',
    admin: 'Admin Utama',
    status: 'need_review',
    source: 'WhatsApp',
    rawPreview: 'Labersa Hotel Samosir\nDate: 30/08/2026\nOccupancy: xx%\n...',
  },
  {
    id: '5',
    unit: 'Waterpark RIFAN',
    date: '2026-08-30',
    inputDate: '2026-08-30 11:20',
    admin: 'Admin WP',
    status: 'saved',
    source: 'WhatsApp',
    rawPreview: 'Waterpark RIFAN\nVisitor: 720\nRevenue: Rp 36.000.000\n...',
  },
  {
    id: '6',
    unit: 'Waterpark TOFAN',
    date: '2026-08-30',
    inputDate: '2026-08-30 14:30',
    admin: 'Admin WP',
    status: 'parsed',
    source: 'WhatsApp',
    rawPreview: 'Waterpark TOFAN\nVisitor: 580\n...',
  },
  {
    id: '7',
    unit: 'Waterpark SIFAN',
    date: '2026-08-30',
    inputDate: '2026-08-30 15:10',
    admin: 'Admin WP',
    status: 'error',
    source: 'WhatsApp',
    rawPreview: '[Format tidak dikenali]',
  },
  {
    id: '8',
    unit: 'Labersa Golf',
    date: '2026-08-30',
    inputDate: '2026-08-30 16:00',
    admin: 'Admin Golf',
    status: 'saved',
    source: 'WhatsApp',
    rawPreview: 'Labersa Golf\nPlayer: 45\nRevenue: Rp 67.500.000\n...',
  },
];

export default function HistoryPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<typeof DEMO_HISTORY[0] | null>(null);

  const filtered = DEMO_HISTORY.filter((item) => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchSearch = item.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.admin.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">History Input</h1>
          <p className="page-subtitle">Riwayat seluruh input laporan WhatsApp</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari unit atau admin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm ml-2 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 font-medium">Tanggal Input</th>
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium">Tanggal Laporan</th>
                <th className="px-5 py-3 font-medium">Admin</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600 text-xs">{item.inputDate}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{item.unit}</td>
                  <td className="px-5 py-3 text-gray-600">{formatDateShort(item.date)}</td>
                  <td className="px-5 py-3 text-gray-600">{item.admin}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{item.source}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Tidak ada data ditemukan</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Detail Laporan</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <span className="text-xs text-gray-500">Unit</span>
                  <p className="text-sm font-medium">{selectedItem.unit}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Tanggal Laporan</span>
                  <p className="text-sm font-medium">{formatDateShort(selectedItem.date)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Admin</span>
                  <p className="text-sm font-medium">{selectedItem.admin}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Status</span>
                  <p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
                      {getStatusLabel(selectedItem.status)}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500">Raw Text (WhatsApp)</span>
                <pre className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {selectedItem.rawPreview}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
