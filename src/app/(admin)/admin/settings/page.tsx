'use client';

import { Settings, Building2, Save } from 'lucide-react';
import { BUSINESS_UNITS_ARRAY } from '@/lib/constants';

export default function SettingsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Konfigurasi sistem LGBIS</p>
        </div>
      </div>

      {/* Business Units */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Unit Bisnis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Nama</th>
                <th className="pb-2 font-medium">Kode</th>
                <th className="pb-2 font-medium">Divisi</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {BUSINESS_UNITS_ARRAY.map((unit) => (
                <tr key={unit.id} className="border-b border-gray-50">
                  <td className="py-2.5 font-medium text-gray-900">{unit.name}</td>
                  <td className="py-2.5 text-gray-600 font-mono text-xs">{unit.code}</td>
                  <td className="py-2.5 text-gray-600">{unit.division_id.replace('div-', '')}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Aktif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supabase Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Koneksi Database
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Supabase URL</label>
            <div className="input-field bg-gray-50 text-gray-600">https://your-project.supabase.co</div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Supabase Anon Key</label>
            <div className="input-field bg-gray-50 text-gray-600">••••••••••••••••</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Konfigurasi database diatur melalui environment variables (.env.local)
        </p>
      </div>

      {/* Parser Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Parser Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-save after parse</p>
              <p className="text-xs text-gray-500">Simpan otomatis jika parsing berhasil</p>
            </div>
            <div className="w-10 h-6 bg-gray-200 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Strict validation</p>
              <p className="text-xs text-gray-500">Tolak data jika ada metric yang gagal diparse</p>
            </div>
            <div className="w-10 h-6 bg-blue-600 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Notification on need_review</p>
              <p className="text-xs text-gray-500">Kirim notifikasi ketika data perlu review</p>
            </div>
            <div className="w-10 h-6 bg-blue-600 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
