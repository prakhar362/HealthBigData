import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'teal' | 'green' | 'amber' | 'red' | 'purple';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200/60',
      accent: 'border-t-blue-600'
    },
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-200/60',
      accent: 'border-t-teal-600'
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200/60',
      accent: 'border-t-emerald-600'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200/60',
      accent: 'border-t-amber-600'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200/60',
      accent: 'border-t-red-600'
    },
    purple: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200/60',
      accent: 'border-t-indigo-600'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-card hover:shadow-elevated transition-shadow duration-200 border-t-4 ${scheme.accent} flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={`w-9 h-9 rounded-lg ${scheme.bg} ${scheme.text} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center text-xs">
          <span className={`font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trend.value}
          </span>
          <span className="text-slate-400 ml-1.5 text-[11px]">vs population baseline</span>
        </div>
      )}
    </div>
  );
};

