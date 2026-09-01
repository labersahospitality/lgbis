'use client';

import { Shield, Search } from 'lucide-react';

const DEMO_LOGS = [
  { id: '1', user: 'Admin Utama', action: 'INSERT', table: 'daily_reports', record: 'Report #1024', time: '2026-08-31 08:15:22' },
  { id: '2', user: 'Admin Utama', action: 'INSERT', table: 'report_metrics', record: '8 metrics', time: '2026-08-31 08:15:23' },
  { id: '3', user: 'Admin WP', action: 'INSERT', table: 'report_imports', record: 'Import #521', time: '2026-08-31 09:01:10' },
  { id: '4', user: 'Super Admin', action: 'UPDATE', table: 'users', record: 'Admin Golf', time: '2026-08-31 09:30:00' },
  { id: '5', user: 'Admin Utama', action: 'UPDATE', table: 'report_metrics', record: 'Metric #2048', time: '2026-08-31 10:45:33' },
  { id: '6', user: 'Super Admin', action: 'INSERT', table: 'budgets', record: 'Budget Aug 2026', time: '2026-08-31 11:00:00' },
];

export default function AuditPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Riwayat seluruh aktivitas sistem</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari log..."
            className="bg-transparent border-none outline-none text-sm ml-2 w-full"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 font-medium">Waktu</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Table</th>
              <th className="px-5 py-3 font-medium">Record</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_LOGS.map((log) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-500 text-xs font-mono">{log.time}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{log.user}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    log.action === 'INSERT' ? 'bg-emerald-100 text-emerald-700' :
                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600 font-mono text-xs">{log.table}</td>
                <td className="px-5 py-3 text-gray-600">{log.record}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
