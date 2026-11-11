import React, { useState, useEffect } from 'react';
import {
  Activity,
  Heart,
  TrendingUp,
  Filter,
  Flame,
  Dna,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { DiseaseAnalytics } from '../types';

export const DiseaseAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DiseaseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDemographic, setSelectedDemographic] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getDiseaseAnalytics();
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
        <p className="text-sm font-medium text-slate-500">Compiling Epidemiological Disease Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chronic Disease & Metabolic Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-sectional epidemiological analysis of diabetes, hypertension, BMI, and lifestyle correlations
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Demographic Filter:</span>
          <select
            value={selectedDemographic}
            onChange={(e) => setSelectedDemographic(e.target.value)}
            className="font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="All">All Cohorts (CDC & Synthea)</option>
            <option value="Adults">Adult Cohort (35-65)</option>
            <option value="Seniors">Senior Cohort (65+)</option>
          </select>
        </div>
      </div>

      {/* Row 1: Diabetes Prevalence by Age & Gender */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Age Group */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Diabetes Prevalence by Age Group</h3>
              <p className="text-[11px] text-slate-400">Diabetic positive cases vs non-diabetic controls</p>
            </div>
          </div>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.diabetes_by_age} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="age_group" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="diabetic" fill="#ef4444" name="Diabetic Patients" radius={[4, 4, 0, 0]} />
                <Bar dataKey="non_diabetic" fill="#3b82f6" name="Non-Diabetic Controls" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Gender */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Diabetes Prevalence by Gender</h3>
              <p className="text-[11px] text-slate-400">Comparative gender stratification and percentage rate</p>
            </div>
          </div>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.diabetes_by_gender} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="gender" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="diabetic" fill="#0d9488" name="Diabetic Cases" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="#e2e8f0" name="Total Evaluated" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: BMI Distribution & Blood Glucose Levels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BMI Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Body Mass Index (BMI) Stratification</h3>
            <p className="text-[11px] text-slate-400">WHO Standard BMI clinical tiers</p>
          </div>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bmi_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" name="Patients" radius={[4, 4, 0, 0]}>
                  {data.bmi_distribution.map((entry, index) => (
                    <Cell key={`cell-bmi-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Glucose Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Capillary Blood Glucose Distribution</h3>
            <p className="text-[11px] text-slate-400">Fasting glycemic clinical ranges (mg/dL)</p>
          </div>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.glucose_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" name="Patients" radius={[4, 4, 0, 0]}>
                  {data.glucose_distribution.map((entry, index) => (
                    <Cell key={`cell-glu-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Blood Pressure & Cholesterol Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Pressure Stages */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Blood Pressure Classification (AHA/ACC)</h3>
            <p className="text-[11px] text-slate-400">Normal, Elevated, Stage 1 and Stage 2 Hypertension</p>
          </div>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.blood_pressure_distribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.blood_pressure_distribution.map((entry, index) => (
                    <Cell key={`cell-bp-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cholesterol Analysis */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Serum Cholesterol Tiers (NCEP ATP III)</h3>
            <p className="text-[11px] text-slate-400">Desirable (&lt;200), Borderline (200-239) and High Risk (&gt;=240)</p>
          </div>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.cholesterol_distribution}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.cholesterol_distribution.map((entry, index) => (
                    <Cell key={`cell-chol-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Lifestyle Correlations (Smoking & Physical Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smoking Correlation */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Smoking Status vs Diabetes Rate</h3>
            <p className="text-[11px] text-slate-400">Prevalence percentage across tobacco exposure tiers</p>
          </div>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.smoking_correlation} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="smoking_status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="percentage" fill="#f59e0b" name="Diabetes Prevalence (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Physical Activity Correlation */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Physical Activity vs Cardiometabolic Risk</h3>
            <p className="text-[11px] text-slate-400">Comparison of diabetes & heart disease rates in active vs sedentary</p>
          </div>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activity_correlation} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="diabetes_rate" fill="#2563eb" name="Diabetes Rate (%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="heart_disease_rate" fill="#ef4444" name="Heart Disease Rate (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

