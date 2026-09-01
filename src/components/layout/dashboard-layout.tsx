'use client';

import { useState } from 'react';
import Sidebar from './sidebar';
import Topbar from './topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
