'use client';

interface AchievementChartProps {
  items: Array<{
    name: string;
    achievement: number | null;
  }>;
  title: string;
  isDemo?: boolean;
}

function getAchievementColor(value: number | null): string {
  if (value === null) return 'bg-gray-200';
  if (value >= 100) return 'bg-emerald-500';
  if (value >= 90) return 'bg-blue-500';
  if (value >= 75) return 'bg-amber-500';
  return 'bg-red-500';
}

function getAchievementTextColor(value: number | null): string {
  if (value === null) return 'text-gray-400';
  if (value >= 100) return 'text-emerald-600';
  if (value >= 90) return 'text-blue-600';
  if (value >= 75) return 'text-amber-600';
  return 'text-red-600';
}

export default function AchievementChart({ items, title, isDemo = false }: AchievementChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {isDemo && (
          <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">DEMO</span>
        )}
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.name}</span>
              <span className={`text-sm font-semibold ${getAchievementTextColor(item.achievement)}`}>
                {item.achievement !== null ? `${item.achievement.toFixed(1)}%` : '-'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${getAchievementColor(item.achievement)}`}
                style={{ width: `${Math.min(item.achievement ?? 0, 120)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
