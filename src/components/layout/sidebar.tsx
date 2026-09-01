'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAVIGATION } from '@/lib/constants';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  Hotel,
  Waves,
  Flag,
  BarChart3,
  FileText,
  TrendingUp,
  ClipboardEdit,
  History,
  Database,
  Users,
  Building2,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useState } from 'react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Hotel,
  Waves,
  Flag,
  BarChart3,
  FileText,
  TrendingUp,
  ClipboardEdit,
  History,
  Database,
  Users,
  Building2,
  Settings,
  Shield,
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut, hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const getNavItems = () => {
    if (!profile) return [];

    switch (profile.role) {
      case 'super_admin':
        return [
          ...NAVIGATION.management.map((item) => ({ ...item, section: 'Management' })),
          { divider: true, label: 'Admin Panel' },
          ...NAVIGATION.admin.map((item) => ({ ...item, section: 'Admin' })),
          { divider: true, label: 'Sistem' },
          ...NAVIGATION.superAdmin.map((item) => ({ ...item, section: 'System' })),
        ];
      case 'management':
        return [
          ...NAVIGATION.management.map((item) => ({ ...item, section: 'Management' })),
        ];
      case 'admin_input':
        return [
          ...NAVIGATION.admin.map((item) => ({ ...item, section: 'Admin' })),
          ...NAVIGATION.superAdmin.filter((item) => item.href === '/admin/users').map((item) => ({ ...item, section: 'Admin' })),
        ];
      case 'auditor':
        return [
          ...NAVIGATION.management.map((item) => ({ ...item, section: 'Management' })),
          { divider: true, label: 'Audit' },
          ...NAVIGATION.admin.map((item) => ({ ...item, section: 'Audit' })),
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-slate-900 text-white transition-all duration-300 flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700/50">
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-blue-400 tracking-wider">LABERSA GROUP</span>
              <span className="text-[10px] text-slate-400">BUSINESS INTELLIGENCE</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, i) => {
            if ('divider' in item) {
              if (collapsed) return <div key={i} className="my-3 border-t border-slate-700/50" />;
              return (
                <div key={i} className="pt-4 pb-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3">
                    {item.label}
                  </span>
                </div>
              );
            }

            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || (item.href !== '/management' && item.href !== '/admin/input' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                )}
                title={collapsed ? item.label : undefined}
              >
                {Icon && <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400')} />}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="border-t border-slate-700/50 p-3">
          {!collapsed && profile && (
            <div className="mb-2 px-3">
              <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{profile.role.replace('_', ' ').toUpperCase()}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
