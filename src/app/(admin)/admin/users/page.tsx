'use client';

import { useState } from 'react';
import { Users, UserPlus, Edit3, Trash2, Shield } from 'lucide-react';

const DEMO_USERS = [
  { id: '1', name: 'Super Admin', email: 'admin@labersa.com', role: 'super_admin', active: true },
  { id: '2', name: 'Manajer Utama', email: 'management@labersa.com', role: 'management', active: true },
  { id: '3', name: 'Admin Utama', email: 'admininput@labersa.com', role: 'admin_input', active: true },
  { id: '4', name: 'Auditor', email: 'auditor@labersa.com', role: 'auditor', active: true },
  { id: '5', name: 'Admin WP', email: 'wp@labersa.com', role: 'admin_input', active: true },
  { id: '6', name: 'Admin Golf', email: 'golf@labersa.com', role: 'admin_input', active: false },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  management: 'Management',
  admin_input: 'Admin Input',
  auditor: 'Auditor',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  management: 'bg-blue-100 text-blue-700',
  admin_input: 'bg-green-100 text-green-700',
  auditor: 'bg-gray-100 text-gray-700',
};

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Kelola seluruh pengguna sistem</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Tambah User
        </button>
      </div>

      {/* Stats */}
      <div className="grid-kpi mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{DEMO_USERS.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-2xl font-bold text-emerald-600">{DEMO_USERS.filter((u) => u.active).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Admin Input</p>
          <p className="text-2xl font-bold text-blue-600">{DEMO_USERS.filter((u) => u.role === 'admin_input').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Management</p>
          <p className="text-2xl font-bold text-purple-600">{DEMO_USERS.filter((u) => u.role === 'management').length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 font-medium">Nama</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_USERS.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{user.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.active ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {user.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
