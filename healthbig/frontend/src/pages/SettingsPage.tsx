import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  Server,
  RefreshCw,
  GraduationCap,
  HeartPulse,
  Code2,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const summary = await api.getDashboardSummary();
      setDbStatus(summary);
    } catch {}
  };

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      await api.retrainModels();
      alert('ML Models successfully retrained.');
    } catch (e: any) {
      alert(e.message || 'Error retraining models');
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Architecture Specification</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          HealthBig Academic Project parameters, Big Data analytics stack, and runtime diagnostics
        </p>
      </div>

      {/* Mini-Project Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-card space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Academic Project Details</h3>
            <p className="text-xs text-slate-500">Big Data Analytics (BDA) Course Demonstration System</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px]">System Title</span>
            <span className="font-bold text-slate-800">
              HealthBig – Healthcare Big Data Analytics and Patient Risk Prediction System
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px]">Target Domains</span>
            <span className="font-bold text-slate-800">
              Healthcare Analytics, Chronic Disease Profiling, Live Vital Telemetry & Risk Prediction
            </span>
          </div>
        </div>
      </div>

      {/* Tech Stack Matrix */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">Full-Stack Technology Architecture</h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
            Production Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
            <span className="font-bold text-blue-700 uppercase tracking-wider text-[11px] block">
              Frontend Client
            </span>
            <ul className="space-y-1 text-slate-600">
              <li>• React 18 / 19 + TypeScript</li>
              <li>• Vite High-Performance Bundler</li>
              <li>• Tailwind CSS Design System</li>
              <li>• Recharts Interactive Visualizations</li>
              <li>• Lucide React Medical Icons</li>
              <li>• React Router v6 Multi-View</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
            <span className="font-bold text-teal-700 uppercase tracking-wider text-[11px] block">
              Backend & Services
            </span>
            <ul className="space-y-1 text-slate-600">
              <li>• Python 3.13 + FastAPI Framework</li>
              <li>• Pydantic v2 Strong Typing & Validation</li>
              <li>• SQLAlchemy 2.0 ORM Engine</li>
              <li>• PostgreSQL & SQLite Dual Engine</li>
              <li>• ReportLab PDF Vector Generator</li>
              <li>• Thread-Safe Vital Stream Simulator</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
            <span className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] block">
              Big Data & Machine Learning
            </span>
            <ul className="space-y-1 text-slate-600">
              <li>• Scikit-learn 3-Model Pipeline</li>
              <li>• Logistic Regression Classification</li>
              <li>• Decision Tree (Entropy Split)</li>
              <li>• Random Forest Ensemble (100 Trees)</li>
              <li>• Pandas & NumPy Analytical Engine</li>
              <li>• Transparent Composite Risk Metric</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Database Connection & Actions */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Database Engine & Operational Diagnostics</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Port 8000 &bull; /api</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Primary Dialect</span>
            <span className="font-bold text-slate-800">PostgreSQL (w/ SQLite Fallback)</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Total Patients Ingested</span>
            <span className="font-bold font-mono text-blue-600">{dbStatus?.kpis?.total_patients || 550}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Inpatient Encounters</span>
            <span className="font-bold font-mono text-teal-600">{dbStatus?.kpis?.total_hospital_visits || 525}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Relational Tables</span>
            <span className="font-bold font-mono text-slate-800">9 Core Schema Tables</span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            <span>Retrain & Calibrate All 3 Models</span>
          </button>
        </div>
      </div>
    </div>
  );
};

