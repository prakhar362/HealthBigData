import React, { useEffect, useState } from 'react';
import {
  Users,
  Activity,
  AlertTriangle,
  Building2,
  Heart,
  Scale,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { DashboardSummary } from '../types';
import { KpiCard } from '../components/KpiCard';
import { Link } from 'react-router-dom';

const GENDER_COLORS = ['#2563eb', '#ec4899', '#94a3b8'];
const DIABETES_COLORS = ['#ef4444', '#10b981'];
const RISK_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const summary = await api.getDashboardSummary();
      setData(summary);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard overview data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading Healthcare Big Data Analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-red-200 shadow-card">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Connection Failed</h3>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Healthcare Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort demographics, disease prevalence, patient risk stratification & admissions telemetry
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/risk-prediction"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <span>Run Risk Inference</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/reports"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <span>Export Reports</span>
          </Link>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Patients"
          value={kpis.total_patients.toLocaleString()}
          subtitle="Enrolled cohort database"
          icon={Users}
          color="blue"
          trend={{ value: "+100%", isPositive: true }}
        />
        <KpiCard
          title="Diabetes Patients"
          value={kpis.diabetes_patients.toLocaleString()}
          subtitle={`${kpis.diabetes_percentage}% prevalence rate`}
          icon={Activity}
          color="amber"
          trend={{ value: `${kpis.diabetes_percentage}%`, isPositive: false }}
        />
        <KpiCard
          title="High-Risk Patients"
          value={kpis.high_risk_patients.toLocaleString()}
          subtitle="Prioritized clinical monitoring"
          icon={ShieldAlert}
          color="red"
          trend={{ value: `${((kpis.high_risk_patients / kpis.total_patients) * 100).toFixed(1)}%`, isPositive: false }}
        />
        <KpiCard
          title="Medium-Risk Patients"
          value={kpis.medium_risk_patients.toLocaleString()}
          subtitle="Borderline metabolic markers"
          icon={TrendingUp}
          color="amber"
        />
        <KpiCard
          title="Low-Risk Patients"
          value={kpis.low_risk_patients.toLocaleString()}
          subtitle="Stable physiological baseline"
          icon={Heart}
          color="green"
        />
        <KpiCard
          title="Hospital Visits"
          value={kpis.total_hospital_visits.toLocaleString()}
          subtitle="Inpatient admission events"
          icon={Building2}
          color="teal"
        />
        <KpiCard
          title="Average BMI"
          value={kpis.average_bmi.toFixed(1)}
          subtitle="Cohort mean body mass index"
          icon={Scale}
          color="purple"
        />
        <KpiCard
          title="Abnormal Vital Telemetry"
          value={kpis.abnormal_vital_readings.toLocaleString()}
          subtitle="Warning / Critical telemetry"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Primary Analytics Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Pie */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Patient Risk Stratification</h3>
              <p className="text-[11px] text-slate-400">ML Model Classification Tier</p>
            </div>
          </div>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.risk_distribution}
                  dataKey="count"
                  nameKey="risk"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {data.risk_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || RISK_COLORS[index % RISK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diabetes Positive vs Negative */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Diabetes Prevalence Ratio</h3>
              <p className="text-[11px] text-slate-400">Confirmed Diagnostic Cohort</p>
            </div>
          </div>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.diabetes_ratio}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.diabetes_ratio.map((_, index) => (
                    <Cell key={`cell-d-${index}`} fill={DIABETES_COLORS[index % DIABETES_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Distribution Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Patient Distribution by Age</h3>
              <p className="text-[11px] text-slate-400">Demographic Cohort Bins</p>
            </div>
          </div>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.age_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="group" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Hospital Admissions */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Hospital Admissions by Acuity</h3>
              <p className="text-[11px] text-slate-400">Emergency, Elective & Urgent admissions trend</p>
            </div>
            <Link to="/hospital-analytics" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1">
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_admissions} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="emergency" stackId="a" fill="#ef4444" name="Emergency" />
                <Bar dataKey="urgent" stackId="a" fill="#f59e0b" name="Urgent" />
                <Bar dataKey="elective" stackId="a" fill="#3b82f6" name="Elective" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Health Trends Line Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Glycemic & Blood Pressure Trends by Age</h3>
              <p className="text-[11px] text-slate-400">Mean blood glucose (mg/dL) & systolic BP (mmHg)</p>
            </div>
            <Link to="/disease-analytics" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1">
              <span>Analytics</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.patient_health_trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="avg_glucose" stroke="#2563eb" strokeWidth={2.5} name="Avg Glucose (mg/dL)" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="avg_systolic" stroke="#0d9488" strokeWidth={2.5} name="Avg Systolic BP (mmHg)" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="avg_bmi" stroke="#f59e0b" strokeWidth={2} name="Avg BMI" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Patients & Recent Alerts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Patient Records</h3>
              <p className="text-[11px] text-slate-400">Newly admitted and profiled cohort members</p>
            </div>
            <Link to="/patients" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1">
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-semibold">Patient ID</th>
                  <th className="py-2.5 px-3 font-semibold">Name</th>
                  <th className="py-2.5 px-3 font-semibold">Age / Sex</th>
                  <th className="py-2.5 px-3 font-semibold">BMI</th>
                  <th className="py-2.5 px-3 font-semibold">BP / Glucose</th>
                  <th className="py-2.5 px-3 font-semibold">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.recent_patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-blue-600">{p.patient_id}</td>
                    <td className="py-2.5 px-3 font-medium">{p.first_name} {p.last_name}</td>
                    <td className="py-2.5 px-3">{p.age} y / {p.gender}</td>
                    <td className="py-2.5 px-3 font-medium">{p.bmi.toFixed(1)}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-slate-600">{p.blood_pressure_systolic}/{p.blood_pressure_diastolic}</span>
                      <span className="text-slate-400 ml-1.5 font-mono text-[11px]">({p.blood_glucose.toFixed(0)} mg/dL)</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.risk_category === 'High Risk'
                          ? 'bg-red-100 text-red-700'
                          : p.risk_category === 'Medium Risk'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.risk_category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts Feed & Dataset Meta */}
        <div className="space-y-6">
          {/* Recent Alerts Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Critical Clinical Alerts</h3>
                <p className="text-[11px] text-slate-400">Live abnormal telemetry triggers</p>
              </div>
              <Link to="/monitoring" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                Live Feed
              </Link>
            </div>

            <div className="space-y-2.5">
              {data.recent_alerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded-lg border text-xs ${
                    alert.severity === 'Critical'
                      ? 'bg-red-50/60 border-red-200 text-red-900'
                      : 'bg-amber-50/60 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>{alert.patient_id}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dataset Statistics Card */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-elevated border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
              <FileCheck2 className="w-4 h-4" />
              <span>Big Data Engine Specs</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Active Cohort Records</span>
                <span className="font-mono font-bold text-white">{data.dataset_statistics.total_records}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Hospital Visits Logged</span>
                <span className="font-mono font-bold text-white">{data.dataset_statistics.total_visits || kpis.total_hospital_visits}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Telemetry Stream Rate</span>
                <span className="font-mono text-emerald-400 font-semibold">2.5s / event</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Data Architecture</span>
                <span className="text-blue-400 font-medium">PostgreSQL / SQLite Dual</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

