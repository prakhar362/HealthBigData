import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  BrainCircuit,
  HeartPulse,
  Building2,
  FileText,
  Database,
  Settings,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  alertsCount?: number;
  isMonitoringActive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ alertsCount = 0, isMonitoringActive = true }) => {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Patient Management', path: '/patients', icon: Users },
    { name: 'Disease Analytics', path: '/disease-analytics', icon: Activity },
    { name: 'Risk Prediction', path: '/risk-prediction', icon: BrainCircuit, badge: 'ML 3-Model' },
    { name: 'Real-Time Monitoring', path: '/monitoring', icon: HeartPulse, isLive: isMonitoringActive },
    { name: 'Hospital Analytics', path: '/hospital-analytics', icon: Building2 },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Data Management', path: '/data-management', icon: Database },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col shrink-0 text-slate-300 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl">
          <HeartPulse className="w-6 h-6 animate-pulse text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-white text-lg tracking-tight">HealthBig</span>
            <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Healthcare Big Data Analytics</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Analytics & Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
              {item.isLive && (
                <span className="flex items-center space-x-1 text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                  <span>LIVE</span>
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Academic Disclaimer & User Footprint */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 mb-3 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center space-x-1.5 text-blue-400 font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Mini-Project</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Healthcare Big Data Analytics, Patient Risk & Real-Time Monitoring
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
            HB
          </div>
          <div className="text-xs">
            <p className="font-medium text-slate-200">Clinical Analyst</p>
            <p className="text-[11px] text-slate-400">Decision Support System</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

