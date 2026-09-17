'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  CheckCircle,
  Edit3,
  Lock,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import AddUserModal from '@/components/AddUserModal';
import EditUserModal from '@/components/EditUserModal';
import ResetPasswordModal from '@/components/ResetPasswordModal';

type ManagedUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  management: 'Management',
  admin_input: 'Admin Input',
  auditor: 'Auditor',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  management: 'bg-green-100 text-green-700',
  admin_input: 'bg-green-100 text-green-700',
  auditor: 'bg-gray-100 text-gray-700',
};

const EMPTY_ADD_FORM = {
  full_name: '',
  email: '',
  role: 'admin_input',
  password: '',
  active: true,
};

const EMPTY_EDIT_FORM = {
  id: '',
  full_name: '',
  role: 'admin_input',
  active: true,
};

const EMPTY_RESET_FORM = {
  userId: '',
  password: '',
  confirmPassword: '',
};

export default function UsersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [resetForm, setResetForm] = useState(EMPTY_RESET_FORM);

  const canManageUsers = profile?.role === 'super_admin';

  const fetchUsers = useCallback(async () => {
    if (!user || !canManageUsers) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memuat daftar user');
      }
      setUsers(data.users ?? []);
    } catch (requestError) {
      setUsers([]);
      setError(requestError instanceof Error ? requestError.message : 'Gagal memuat daftar user');
    } finally {
      setLoading(false);
    }
  }, [canManageUsers, user]);

  useEffect(() => {
    if (!authLoading) {
      fetchUsers();
    }
  }, [authLoading, fetchUsers]);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menambahkan user');
      }
      await fetchUsers();
      setShowAddModal(false);
      setAddForm(EMPTY_ADD_FORM);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Gagal menambahkan user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editForm.full_name,
          role: editForm.role,
          active: editForm.active,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengubah user');
      }
      await fetchUsers();
      setShowEditModal(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Gagal mengubah user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async (event: FormEvent) => {
    event.preventDefault();
    if (resetForm.password !== resetForm.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${resetForm.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetForm.password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mereset password');
      }
      await fetchUsers();
      setShowResetModal(false);
      setResetForm(EMPTY_RESET_FORM);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Gagal mereset password');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async (managedUser: ManagedUser) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${managedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !managedUser.active }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengubah status user');
      }
      await fetchUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Gagal mengubah status user');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (managedUser: ManagedUser) => {
    setEditForm({
      id: managedUser.id,
      full_name: managedUser.full_name,
      role: managedUser.role,
      active: managedUser.active,
    });
    setError(null);
    setShowEditModal(true);
  };

  const openResetModal = (managedUser: ManagedUser) => {
    setResetForm({ ...EMPTY_RESET_FORM, userId: managedUser.id });
    setError(null);
    setShowResetModal(true);
  };

  const updateAddForm = (field: string, value: unknown) => {
    setAddForm((current) => ({ ...current, [field]: value }));
  };

  const updateEditForm = (field: string, value: unknown) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const updateResetForm = (field: string, value: unknown) => {
    setResetForm((current) => ({ ...current, [field]: value }));
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-500">Memuat...</p>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Anda tidak memiliki akses untuk mengelola user.
      </div>
    );
  }

  const activeUsers = users.filter((managedUser) => managedUser.active).length;
  const adminInputUsers = users.filter((managedUser) => managedUser.role === 'admin_input').length;
  const managementUsers = users.filter((managedUser) => managedUser.role === 'management').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Kelola seluruh pengguna sistem</p>
        </div>
        <button onClick={() => { setError(null); setShowAddModal(true); }} className="btn-primary">
          <UserPlus className="h-4 w-4" />
          Tambah User
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid-kpi mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-2xl font-bold text-emerald-600">{activeUsers}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Admin Input</p>
          <p className="text-2xl font-bold text-labersa">{adminInputUsers}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Management</p>
          <p className="text-2xl font-bold text-purple-600">{managementUsers}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Nama</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500">Memuat daftar user...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                    <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    Belum ada user.
                  </td>
                </tr>
              ) : (
                users.map((managedUser) => (
                  <tr key={managedUser.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-sm font-semibold text-gold">
                          {managedUser.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{managedUser.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{managedUser.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[managedUser.role] || 'bg-gray-100 text-gray-700'}`}>
                        {ROLE_LABELS[managedUser.role] || managedUser.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleStatus(managedUser)}
                        disabled={actionLoading}
                        className={`inline-flex items-center gap-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${managedUser.active ? 'text-emerald-600' : 'text-red-500'}`}
                        title={managedUser.active ? 'Nonaktifkan user' : 'Aktifkan user'}
                      >
                        {managedUser.active ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {managedUser.active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(managedUser)}
                          disabled={actionLoading}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-labersa disabled:opacity-50"
                          title="Edit user"
                          aria-label={`Edit ${managedUser.full_name}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openResetModal(managedUser)}
                          disabled={actionLoading}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                          title="Reset password"
                          aria-label={`Reset password ${managedUser.full_name}`}
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddUserModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        form={addForm}
        onChange={updateAddForm}
        onSubmit={handleAdd}
        loading={actionLoading}
      />
      <EditUserModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        form={editForm}
        onChange={updateEditForm}
        onSubmit={handleUpdate}
        loading={actionLoading}
      />
      <ResetPasswordModal
        show={showResetModal}
        onClose={() => setShowResetModal(false)}
        form={resetForm}
        onChange={updateResetForm}
        onSubmit={handleReset}
        loading={actionLoading}
      />
    </div>
  );
}