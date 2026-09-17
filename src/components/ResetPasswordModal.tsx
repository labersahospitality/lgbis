'use client';

import { 
  XCircle,
} from 'lucide-react';

interface ResetPasswordModalProps {
  show: boolean;
  onClose: () => void;
  form: {
    userId: string;
    password: string;
    confirmPassword: string;
  };
  onChange: (field: string, value: unknown) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export default function ResetPasswordModal({
  show,
  onClose,
  form,
  onChange,
  onSubmit,
  loading,
}: ResetPasswordModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Reset Password</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => onChange('password', e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-labersa focus:border-labersa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-labersa focus:border-labersa"
            />
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
              {loading ? 'Mereset...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}