import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileDown,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { ReportItem } from '../types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    api.getReports().then(setReports).catch(() => {});
  }, []);

  const handleDownload = (reportId: string, format: 'csv' | 'pdf') => {
    setDownloadingId(`${reportId}-${format}`);
    const downloadUrl = api.getReportDownloadUrl(reportId, format);
    window.open(downloadUrl, '_blank');
    setTimeout(() => {
      setDownloadingId(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical & Big Data Analytical Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Export hospital audit summaries, stratified patient risk manifests, and epidemiological prevalence in CSV and PDF
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {report.id.toUpperCase()} AUDIT
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-800 tracking-tight">{report.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{report.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Export Formats:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(report.id, 'csv')}
                  disabled={downloadingId === `${report.id}-csv`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={() => handleDownload(report.id, 'pdf')}
                  disabled={downloadingId === `${report.id}-pdf`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance / Academic Report Standards Box */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-6 shadow-elevated border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Report Generation Specifications</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Reports are dynamically generated directly from the PostgreSQL / SQLite database engine. CSV files adhere to RFC 4180 formatting with complete headers suitable for SPSS, R, Python, and Excel big data ingest. PDF files are compiled using high-resolution vector tables via Python ReportLab with timestamped verification hashes and academic decision-support disclaimers.
        </p>
      </div>
    </div>
  );
};

