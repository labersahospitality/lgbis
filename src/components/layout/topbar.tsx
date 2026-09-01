'use client';

import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Topbar({ onMenuClick, title }: TopbarProps) {
  const { profile } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari..."
            className="bg-transparent border-none outline-none text-sm ml-2 w-48 placeholder:text-gray-400"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {profile && (
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{profile.full_name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
