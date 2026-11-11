import React, { useState, useEffect } from 'react';
import { Search, Bell, Calendar, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { MonitoringAlert } from '../types';

interface NavbarProps {
  onSearch?: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      );
    };
    updateTime();

    // Fetch alerts every 6 seconds
    const fetchAlerts = () => {
      api.getMonitoringAlerts(8, true)
        .then(setAlerts)
        .catch(() => {});
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm);
  };

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-20 sticky top-0 shadow-subtle">
      {/* Search Input */}
      <div className="flex-1 max-w-lg">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            placeholder="Search patient ID, name, diagnosis, biomarker..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-5">
        {/* System & DB Status Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Healthy</span>
          <span className="text-emerald-400">|</span>
          <span className="text-emerald-600 font-mono text-[11px]">DB Connected</span>
        </div>

        {/* Current Date */}
        <div className="hidden lg:flex items-center space-x-2 text-slate-500 text-xs font-medium">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{currentDate}</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative transition-colors"
            title="Real-Time Clinical Alerts"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown */}
          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-elevated border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-slate-800 text-sm">Real-Time Alerts</span>
                  <span className="text-xs bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full">
                    {alerts.length} New
                  </span>
                </div>
                <button
                  onClick={() => setShowAlertsDropdown(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                    No active abnormal telemetry warnings.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-start justify-between space-x-2 ${
                        alert.severity === 'Critical'
                          ? 'bg-red-50/60 border-red-200 text-red-900'
                          : 'bg-amber-50/60 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5 font-bold">
                          {alert.severity === 'Critical' ? (
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                          <span>{alert.patient_id} – {alert.alert_type}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{alert.message}</p>
                        <p className="text-[10px] text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-2 py-1 text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded shrink-0 shadow-xs"
                      >
                        Ack
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center">
            DA
          </div>
          <div className="hidden sm:block text-left text-xs">
            <p className="font-semibold text-slate-800">Dr. S. Analytics</p>
            <p className="text-[11px] text-slate-400">Chief Data Officer</p>
          </div>
        </div>
      </div>
    </header>
  );
};

