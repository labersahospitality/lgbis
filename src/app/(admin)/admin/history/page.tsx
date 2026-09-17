'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { History, Eye, Search, Filter } from 'lucide-react';

interface ImportHistory {
  id: string;
  inputDate: string;
  unit: string;
  date: string;
  admin: string;
  status: string;
  source: string;
  rawText: string;
}

export default function HistoryPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<ImportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<ImportHistory | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { data, error: dbError } = await supabase
        .from('report_imports')
        .select(
          'id, report_date, status, raw_text, created_at, ' +
            'business_units!inner(name), users!report_imports_created_by_fkey(full_name, email)',
        )
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      const rows: ImportHistory[] = (data || []).map((r) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = r as any;
        const unitName = raw.business_units?.name ?? '';
        const user = raw.users ?? {};
        return {
          id: raw.id,
          inputDate: raw.created_at,
          unit: unitName,
          date: raw.report_date,
          admin: user.full_name || user.email || 'Admin',
          status: raw.status,
          source: 'WhatsApp',
          rawText: raw.raw_text || '',
        };
      });

      setItems(rows);
    } catch (err) {
      console.error('[History] Error loading history:', err);
      setError('Gagal memuat riwayat input dari database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = items.filter((item) => {
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
                  ? 'bg-labersa text-white'
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
          {loading ? (
            <div className="p-8 text-center">
              <div className="h-4 bg-gray-200 rounded w-40 mx-auto mb-3 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-64 mx-auto animate-pulse" />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {items.length === 0
                  ? 'Belum ada riwayat input yang tersimpan.'
                  : 'Tidak ada data ditemukan'}
              </p>
            </div>
          ) : (
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
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      {new Date(item.inputDate).toLocaleString('id-ID', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
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
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-labersa transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
                <pre className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                  {selectedItem.rawText || 'Raw text tidak tersedia.'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
