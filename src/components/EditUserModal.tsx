'use client';

import { 
  XCircle,
} from 'lucide-react';

interface EditUserModalProps {
  show: boolean;
  onClose: () => void;
  form: {
    id: string;
    full_name: string;
    role: string;
    active: boolean;
  };
  onChange: (field: string, value: unknown) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export default function EditUserModal({
  show,
  onClose,
  form,
  onChange,
  onSubmit,
  loading,
}: EditUserModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Edit User</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => onChange('full_name', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-labersa focus:border-labersa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={form.role}
              onChange={(e) => onChange('role', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-labersa focus:border-labersa"
            >
              <option value="super_admin">Super Admin</option>
              <option value="management">Management</option>
              <option value="admin_input">Admin Input</option>
              <option value="auditor">Auditor</option>
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => onChange('active', e.target.checked)}
                className="h-4 w-4 text-labersa"
              />
              Aktif
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-labersa text-white rounded-lg hover:bg-labersa/90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Mengupdate...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}