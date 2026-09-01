'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  budget?: string | null;
  achievement?: number | null;
  trend?: number | null;
  format?: 'currency' | 'percent' | 'number';
  subtitle?: string;
  className?: string;
  isDemo?: boolean;
}

export default function KPICard({
  title,
  value,
  budget,
  achievement,
  trend,
  subtitle,
  className,
  isDemo = false,
}: KPICardProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative',
      isDemo && 'border-2 border-dashed border-blue-200 bg-blue-50/30',
      className
    )}>
      {isDemo && (
        <span className="absolute top-2 right-2 text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
          DEMO
        </span>
      )}

      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>

      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}

      <div className="flex items-center gap-3 mt-3">
        {achievement !== null && achievement !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
            achievement >= 100 ? 'bg-emerald-100 text-emerald-700' :
            achievement >= 90 ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          )}>
            <span>{achievement.toFixed(1)}%</span>
          </div>
        )}

        {budget && (
          <span className="text-xs text-gray-400">
            Budget: {budget}
          </span>
        )}

        {trend !== null && trend !== undefined && (
          <span className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'
          )}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
