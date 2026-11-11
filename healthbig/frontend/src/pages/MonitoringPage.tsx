import React, { useState, useEffect, useRef } from 'react';
import {
  HeartPulse,
  Play,
  Square,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { api } from '../services/api';
import { LiveVitalReading, MonitoringAlert, Patient } from '../types';

export const MonitoringPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [readings, setReadings] = useState<LiveVitalReading[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [showThresholds, setShowThresholds] = useState(false);
  const pollTimerRef = useRef<any>(null);

  useEffect(() => {
    // Fetch patients list
    api.getPatients({ page: 1, page_size: 30 }).then((res) => {
      setPatients(res.patients);
    }).catch(() => {});

    // Check status
    api.getMonitoringStatus().then((st) => {
      setIsRunning(st.is_running);
    }).catch(() => {});

    // Initial load
    fetchTelemetry();

    // Start polling loop every 2.5s
    pollTimerRef.current = setInterval(() => {
      fetchTelemetry();
    }, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [selectedPatientId]);

  const fetchTelemetry = async () => {
    try {
      const latest = await api.getLatestVitals(selectedPatientId || undefined, 25);
      if (latest && latest.length > 0) {
        setReadings(latest);
      }
      const activeAlerts = await api.getMonitoringAlerts(15, false);
      setAlerts(activeAlerts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMonitoring = async () => {
    try {
      if (isRunning) {
        await api.stopMonitoring();
        setIsRunning(false);
      } else {
        await api.startMonitoring(selectedPatientId || undefined);
        setIsRunning(true);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating simulator state');
    }
  };

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: true } : a));
    } catch {}
  };

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  // Chart data formatting (time ticks)
  const chartData = readings.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    heart_rate: r.heart_rate,
    systolic_bp: r.systolic_bp,
    blood_glucose: r.blood_glucose,
    temp: r.body_temperature
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Engine Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Real-Time Patient Monitoring Telemetry</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${
              isRunning
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'bg-slate-100 border-slate-300 text-slate-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-teal-500 animate-ping' : 'bg-slate-400'}`} />
              <span>{isRunning ? 'SIMULATOR ACTIVE (2.5s)' : 'SIMULATOR PAUSED'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Backend Python vital streaming telemetry with automated abnormal threshold alerting
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowThresholds(!showThresholds)}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Thresholds</span>
          </button>

          <button
            onClick={handleToggleMonitoring}
            className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm flex items-center space-x-2 transition-all text-white ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Patient Selector Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex items-center justify-between">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-700">Target Telemetry Bed / Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="">All Hospital Wards (Multi-Patient Random Telemetry)</option>
            {patients.map((p) => (
              <option key={p.id} value={p.patient_id}>
                Bed {p.patient_id} – {p.first_name} {p.last_name} ({p.risk_category})
              </option>
            ))}
          </select>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Last Telemetry Sync: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Thresholds Drawer */}
      {showThresholds && (
        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 text-xs shadow-elevated space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-teal-400" />
              <span>Configurable Illustrative Physiological Thresholds</span>
            </span>
            <span className="text-[10px] text-slate-400">Decision-Support Rules</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div className="p-2 rounded bg-slate-800/80">
              <span className="text-slate-400 block font-semibold">Heart Rate</span>
              <span className="text-emerald-400">Normal: 60 - 100 bpm</span>
              <span className="text-red-400 block">Critical: &lt; 48 or &gt; 125</span>
            </div>
            <div className="p-2 rounded bg-slate-800/80">
              <span className="text-slate-400 block font-semibold">Systolic BP</span>
              <span className="text-emerald-400">Normal: 95 - 120 mmHg</span>
              <span className="text-red-400 block">Critical: &gt;= 155 mmHg</span>
            </div>
            <div className="p-2 rounded bg-slate-800/80">
              <span className="text-slate-400 block font-semibold">Blood Glucose</span>
              <span className="text-emerald-400">Normal: 70 - 130 mg/dL</span>
              <span className="text-red-400 block">Critical: &lt; 60 or &gt;= 200</span>
            </div>
            <div className="p-2 rounded bg-slate-800/80">
              <span className="text-slate-400 block font-semibold">Body Temperature</span>
              <span className="text-emerald-400">Normal: 97.5 - 99.2 °F</span>
              <span className="text-red-400 block">Critical: &gt;= 101.5 °F</span>
            </div>
          </div>
        </div>
      )}

      {/* Current Real-Time Gauges */}
      {latestReading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Heart Rate */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-card">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Heart Rate</span>
              <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-slate-800">{latestReading.heart_rate}</span>
              <span className="text-xs text-slate-400">bpm</span>
            </div>
            <div className="mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                latestReading.heart_rate > 100 || latestReading.heart_rate < 60
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {latestReading.heart_rate > 100 ? 'Tachycardia' : latestReading.heart_rate < 60 ? 'Bradycardia' : 'Normal Sinus'}
              </span>
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-card">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Blood Pressure</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-slate-800">
                {latestReading.systolic_bp}/{latestReading.diastolic_bp}
              </span>
              <span className="text-xs text-slate-400">mmHg</span>
            </div>
            <div className="mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                latestReading.systolic_bp >= 140
                  ? 'bg-red-100 text-red-700'
                  : latestReading.systolic_bp >= 125
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {latestReading.systolic_bp >= 140 ? 'Hypertensive' : latestReading.systolic_bp >= 125 ? 'Elevated' : 'Optimal'}
              </span>
            </div>
          </div>

          {/* Blood Glucose */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-card">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Blood Glucose</span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-slate-800">{latestReading.blood_glucose.toFixed(0)}</span>
              <span className="text-xs text-slate-400">mg/dL</span>
            </div>
            <div className="mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                latestReading.blood_glucose >= 180
                  ? 'bg-red-100 text-red-700'
                  : latestReading.blood_glucose >= 130
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {latestReading.blood_glucose >= 180 ? 'Hyperglycemic' : latestReading.blood_glucose >= 130 ? 'Pre-prandial High' : 'Euglycemic'}
              </span>
            </div>
          </div>

          {/* Body Temperature */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-card">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Temperature</span>
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-slate-800">{latestReading.body_temperature.toFixed(1)}</span>
              <span className="text-xs text-slate-400">°F</span>
            </div>
            <div className="mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                latestReading.body_temperature >= 100.4
                  ? 'bg-red-100 text-red-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {latestReading.body_temperature >= 100.4 ? 'Febrile / Fever' : 'Normothermia'}
              </span>
            </div>
          </div>

          {/* O2 Saturation */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-card">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Oxygen Sat (SpO2)</span>
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-slate-800">{latestReading.oxygen_saturation?.toFixed(0) || 98}</span>
              <span className="text-xs text-slate-400">%</span>
            </div>
            <div className="mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                Adequate Oxygenation
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
          Gathering initial real-time telemetry packets from backend...
        </div>
      )}

      {/* Live Chart Stream */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Streaming Telemetry Multi-Parameter Graph</h3>
            <p className="text-[11px] text-slate-400">Real-time synchronized waveforms (Heart Rate, Systolic BP, Glucose)</p>
          </div>
          <span className="text-xs font-mono text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-200">
            {readings.length} Packets Buffered
          </span>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="heart_rate" stroke="#ef4444" strokeWidth={2} name="Heart Rate (bpm)" isAnimationActive={false} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="systolic_bp" stroke="#2563eb" strokeWidth={2} name="Systolic BP (mmHg)" isAnimationActive={false} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="blood_glucose" stroke="#0d9488" strokeWidth={2} name="Glucose (mg/dL)" isAnimationActive={false} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: Active Alerts & Telemetry Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Alerts (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-card">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Abnormal Telemetry Alerts</h3>
              <p className="text-[11px] text-slate-400">Automatic rule trigger notifications</p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
              {alerts.filter(a => !a.is_acknowledged).length} Pending
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                No abnormal alert events triggered yet.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs flex items-start justify-between space-x-2 ${
                    alert.severity === 'Critical'
                      ? 'bg-red-50/70 border-red-200 text-red-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
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
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-0.5">
                      <span>Threshold: {alert.threshold_exceeded}</span>
                      <span>•</span>
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {!alert.is_acknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded shadow-xs shrink-0"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Telemetry Log Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-card">
          <div className="pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-bold text-slate-800">Historical Telemetry Packets</h3>
            <p className="text-[11px] text-slate-400">Streamed packets stored in backend relational table</p>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 font-semibold">Time</th>
                  <th className="py-2 px-3 font-semibold">Patient</th>
                  <th className="py-2 px-3 font-semibold">HR</th>
                  <th className="py-2 px-3 font-semibold">BP</th>
                  <th className="py-2 px-3 font-semibold">Glucose</th>
                  <th className="py-2 px-3 font-semibold">Temp</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {readings.slice().reverse().map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 text-slate-400">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 font-bold text-blue-600">{r.patient_id}</td>
                    <td className="py-2 px-3">{r.heart_rate} bpm</td>
                    <td className="py-2 px-3">{r.systolic_bp}/{r.diastolic_bp}</td>
                    <td className="py-2 px-3">{r.blood_glucose.toFixed(0)} mg/dL</td>
                    <td className="py-2 px-3">{r.body_temperature.toFixed(1)} °F</td>
                    <td className="py-2 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'Critical'
                          ? 'bg-red-100 text-red-700'
                          : r.status === 'Warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

