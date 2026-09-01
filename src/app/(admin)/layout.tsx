'use client';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'management') {
        router.push('/management');
      }
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminGuard>{children}</AdminGuard>
    </AuthProvider>
  );
}
