'use client';

import { Building2 } from 'lucide-react';
import { DIVISIONS, BUSINESS_UNITS_ARRAY } from '@/lib/constants';

export default function UnitsPage() {
  const divisions = Object.values(DIVISIONS);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Unit Management</h1>
          <p className="page-subtitle">Kelola seluruh unit bisnis Labersa Group</p>
        </div>
      </div>

      {divisions.map((div) => {
        const units = BUSINESS_UNITS_ARRAY.filter((u) => u.division_id === div.id);

        return (
          <div key={div.id} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {div.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => (
                <div key={unit.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{unit.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{unit.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Aktif
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
