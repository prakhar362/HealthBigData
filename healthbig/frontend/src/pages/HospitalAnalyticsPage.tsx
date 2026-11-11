import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  RotateCcw,
  Pill,
  Activity,
  FileText,
  TrendingDown,
  Layers
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { HospitalAnalytics } from '../types';
import { KpiCard } from '../components/KpiCard';

const ADMISSION_COLORS = ['#ef4444', '#f59e0b', '#2563eb', '#10b981'];

export const HospitalAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<HospitalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHospitalData();
  }, []);

  const loadHospitalData = async () => {
    try {
      setLoading(true);
      const res = await api.getHospitalAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Aggregating Hospital Utilization & Inpatient Metrics...</p>
      </div>
    );
  }

  const readmit30 = data.readmission_statistics.find(x => x.key === '<30')?.count || 0;
  const readmitRate = ((readmit30 / data.total_admissions) * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Inpatient & Clinical Operations Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Modeled after the Diabetes 130-US Hospitals dataset: admissions, length of stay, 30-day readmissions & pharmacy utilization
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Inpatient Admissions"
          value={data.total_admissions.toLocaleString()}
          subtitle="Encounter events logged"
          icon={Building2}
          color="blue"
        />
        <KpiCard
          title="Average Length of Stay (LOS)"
          value={`${data.average_length_of_stay.toFixed(1)} Days`}
          subtitle="Mean inpatient duration"
          icon={Clock}
          color="teal"
        />
        <KpiCard
          title="30-Day Readmission Rate"
          value={`${readmitRate}%`}
          subtitle={`${readmit30} rapid readmissions`}
          icon={RotateCcw}
          color="red"
        />
        <KpiCard
          title="Diagnostic Tests Performed"
          value={data.laboratory_statistics.total_tests_conducted.toLocaleString()}
          subtitle={`${data.laboratory_statistics.abnormal_percentage}% abnormal results`}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Row 1: Admission Types & 30-Day Readmissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admission Types */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Inpatient Admission Types</h3>
            <p className="text-[11px] text-slate-400">Acuity breakdown (Emergency, Urgent, Elective, Routine)</p>
          </div>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.admission_types}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {data.admission_types.map((_, index) => (
                    <Cell key={`cell-at-${index}`} fill={ADMISSION_COLORS[index % ADMISSION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Readmission Statistics */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Hospital Readmission Status</h3>
            <p className="text-[11px] text-slate-400">Readmitted within &lt;30 days, &gt;30 days or No Readmission</p>
          </div>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.readmission_statistics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" name="Encounters" radius={[4, 4, 0, 0]}>
                  {data.readmission_statistics.map((entry, index) => (
                    <Cell key={`cell-readmit-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Department Utilization & Top Clinical Diagnoses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Volume */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Admissions by Specialty Department</h3>
            <p className="text-[11px] text-slate-400">Total inpatient volume and average stay duration</p>
          </div>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.department_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="visits" fill="#2563eb" name="Inpatient Admissions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Diagnoses Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-800">Primary Admission Diagnoses</h3>
              <p className="text-[11px] text-slate-400">Leading clinical conditions requiring hospitalization</p>
            </div>

            <div className="space-y-2.5">
              {data.top_diagnoses.map((diag, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{diag.diagnosis}</span>
                  </div>
                  <span className="font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {diag.cases} Cases
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Laboratory & Inpatient Medications Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Laboratory Statistics Panel */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Clinical Laboratory Diagnostics Summary</h3>
            <p className="text-[11px] text-slate-400">Biochemical marker screening statistics</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
              <span className="text-slate-500 block">Total Tests Logged</span>
              <span className="text-xl font-bold font-mono text-blue-700">
                {data.laboratory_statistics.total_tests_conducted}
              </span>
            </div>
            <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg">
              <span className="text-slate-500 block">Abnormal Test Rate</span>
              <span className="text-xl font-bold font-mono text-red-700">
                {data.laboratory_statistics.abnormal_percentage}%
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block">Cohort Mean HbA1c</span>
              <span className="text-xl font-bold font-mono text-slate-800">
                {data.laboratory_statistics.average_hba1c}%
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block">Cohort Mean Fasting Glucose</span>
              <span className="text-xl font-bold font-mono text-slate-800">
                {data.laboratory_statistics.average_fasting_glucose} mg/dL
              </span>
            </div>
          </div>
        </div>

        {/* Top Medications Prescribed */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Top Inpatient Pharmaceuticals Prescribed</h3>
            <p className="text-[11px] text-slate-400">Antidiabetic, antihypertensive and cardioprotective agents</p>
          </div>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.medication_analysis} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="medication" type="category" tick={{ fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="prescriptions" fill="#0d9488" radius={[0, 4, 4, 0]} name="Prescriptions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

