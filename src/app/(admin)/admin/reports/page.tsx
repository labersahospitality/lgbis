'use client';

import { useState } from 'react';
import { formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Database, Download, Search, Filter } from 'lucide-react';

const DEMO_DATA = [
  { id: '1', unit: 'Labersa Hotel Pekanbaru', date: '2026-08-31', occupancy: 78.5, revenue: 3200000000, budget: 3500000000, achievement: 91.4 },
  { id: '2', unit: 'Labersa Hotel Toba', date: '2026-08-31', occupancy: 65.2, revenue: 2100000000, budget: 2200000000, achievement: 95.5 },
  { id: '3', unit: 'Labersa Hotel Samosir', date: '2026-08-31', occupancy: 58.3, revenue: 1500000000, budget: 1800000000, achievement: 83.3 },
  { id: '4', unit: 'Waterpark HTN', date: '2026-08-31', occupancy: null, revenue: 1250000000, budget: 1800000000, achievement: 69.4 },
  { id: '5', unit: 'Waterpark RIFAN', date: '2026-08-31', occupancy: null, revenue: 1050000000, budget: 1400000000, achievement: 75.0 },
  { id: '6', unit: 'Waterpark TOFAN', date: '2026-08-31', occupancy: null, revenue: 850000000, budget: 1000000000, achievement: 85.0 },
  { id: '7', unit: 'Waterpark SIFAN', date: '2026-08-31', occupancy: null, revenue: 625000000, budget: 800000000, achievement: 78.1 },
  { id: '8', unit: 'Labersa Golf', date: '2026-08-31', occupancy: null, revenue: 1875000000, budget: 1250000000, achievement: 150.0 },
];

export default function AdminReportsPage() {
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('2026-08-31');

  const filtered = DEMO_DATA.filter((d) =>
    d.unit.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Reports</h1>
          <p className="page-subtitle">Data laporan terstruktur dari database</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm ml-2 w-full"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-field w-auto"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium text-right">Occupancy</th>
                <th className="px-5 py-3 font-medium text-right">Revenue</th>
                <th className="px-5 py-3 font-medium text-right">Budget</th>
                <th className="px-5 py-3 font-medium text-right">Achievement</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{formatDateShort(item.date)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {item.occupancy !== null ? `${item.occupancy}%` : '-'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium">
                    Rp {(item.revenue / 1000000).toFixed(0)}M
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-500">
                    Rp {(item.budget / 1000000).toFixed(0)}M
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.achievement >= 100 ? 'bg-emerald-100 text-emerald-700' :
                      item.achievement >= 90 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.achievement.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
