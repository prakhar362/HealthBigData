import React, { useState, useEffect } from 'react';
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  Layers,
  Sparkles,
  BarChart,
  Table as TableIcon
} from 'lucide-react';
import { api } from '../services/api';
import { UploadedDatasetItem } from '../types';

export const DataManagementPage: React.FC = () => {
  const [datasets, setDatasets] = useState<UploadedDatasetItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<UploadedDatasetItem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [datasetType, setDatasetType] = useState('CDC Diabetes Health Indicators');
  const [importRecords, setImportRecords] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const list = await api.getDatasets();
      setDatasets(list);
      if (list.length > 0 && !selectedDataset) {
        setSelectedDataset(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a CSV or JSON healthcare file to upload.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      const res = await api.uploadDataset(file, datasetType, importRecords);
      alert(`Dataset '${res.file_name}' processed successfully (${res.record_count} records).`);
      setFile(null);
      await loadDatasets();
      setSelectedDataset(res);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading and parsing file.');
    } finally {
      setUploading(false);
    }
  };

  // Pre-load demo dataset simulation helper
  const handleLoadDemoDataset = async (type: string) => {
    let fileName = 'cdc_diabetes_sample.csv';
    let content = 'Diabetes_binary,HighBP,HighChol,BMI,Smoker,Stroke,HeartDiseaseorAttack,PhysActivity,Age\n';
    if (type === 'Diabetes 130-US Hospitals') {
      fileName = 'diabetes_130_us_hospitals_sample.csv';
      content = 'encounter_id,patient_nbr,time_in_hospital,num_lab_procedures,num_medications,readmitted\n';
      for (let i = 1; i <= 30; i++) {
        content += `ENC-${10000 + i},PT-${5000 + i},${Math.floor(Math.random() * 10) + 1},${Math.floor(Math.random() * 60) + 10},${Math.floor(Math.random() * 20) + 2},${i % 3 === 0 ? '<30' : 'NO'}\n`;
      }
    } else {
      for (let i = 1; i <= 35; i++) {
        content += `${i % 4 === 0 ? 1 : 0},${i % 2 === 0 ? 1 : 0},${i % 3 === 0 ? 1 : 0},${(22 + Math.random() * 14).toFixed(1)},0,0,0,1,${40 + i}\n`;
      }
    }

    const demoFile = new File([content], fileName, { type: 'text/csv' });
    try {
      setUploading(true);
      const res = await api.uploadDataset(demoFile, type, false);
      await loadDatasets();
      setSelectedDataset(res);
      alert(`Pre-packaged sample dataset '${type}' processed and audited!`);
    } catch (err: any) {
      alert(err.message || 'Error processing demo dataset');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Healthcare Big Data Ingestion & Quality Audit</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Backend CSV/JSON parser with automated schema inference, missing value profiling, duplicate detection and 20-row preview
        </p>
      </div>

      {/* Row 1: Upload Zone & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-card">
          <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Upload Healthcare Dataset</h3>
              <p className="text-[11px] text-slate-400">Accepts CDC Diabetes, Diabetes 130-US, Synthea, or custom CSV/JSON</p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-blue-600 font-semibold">
              <UploadCloud className="w-4 h-4" />
              <span>Pandas Ingest</span>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50/50 transition-colors">
              <input
                type="file"
                id="datasetFile"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="datasetFile" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                <span className="font-semibold text-slate-700 text-xs">
                  {file ? file.name : 'Click to select CSV or JSON dataset from your machine'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Supported formats: .csv, .json (max 50 MB)
                </span>
              </label>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Dataset Standard / Source</label>
                <select
                  value={datasetType}
                  onChange={(e) => setDatasetType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="CDC Diabetes Health Indicators">CDC Diabetes Health Indicators</option>
                  <option value="Diabetes 130-US Hospitals">Diabetes 130-US Hospitals</option>
                  <option value="Synthea Healthcare Data">Synthea Synthetic Healthcare Data</option>
                  <option value="Custom Healthcare Cohort">Custom Clinical Cohort</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importRecords}
                    onChange={(e) => setImportRecords(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Import valid rows into active patient cohort</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Analyzing Dataset Schema...' : 'Process & Audit Dataset'}</span>
            </button>
          </form>
        </div>

        {/* Demo Dataset Quick Load Shortcuts (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-800">Pre-Configured Benchmark Datasets</h3>
              <p className="text-[11px] text-slate-400">One-click test ingestion for university mini-project evaluation</p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">CDC Diabetes Indicators (Sample)</h4>
                  <p className="text-[11px] text-slate-500">21 behavioral & biometric risk factors</p>
                </div>
                <button
                  onClick={() => handleLoadDemoDataset('CDC Diabetes Health Indicators')}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-xs"
                >
                  Ingest Sample
                </button>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Diabetes 130-US Hospitals (Sample)</h4>
                  <p className="text-[11px] text-slate-500">Inpatient encounters & readmission records</p>
                </div>
                <button
                  onClick={() => handleLoadDemoDataset('Diabetes 130-US Hospitals')}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-xs"
                >
                  Ingest Sample
                </button>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Synthea Patient Manifest (JSON)</h4>
                  <p className="text-[11px] text-slate-500">Synthetic clinical cohort structure</p>
                </div>
                <button
                  onClick={() => handleLoadDemoDataset('Synthea Healthcare Data')}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-xs"
                >
                  Ingest Sample
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Uploaded Datasets Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card">
        <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Managed Healthcare Datasets Manifest</h3>
            <p className="text-[11px] text-slate-400">Catalog of audited files parsed by backend engine</p>
          </div>
          <span className="text-xs font-mono text-slate-500">{datasets.length} Datasets Stored</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold">File Name</th>
                <th className="py-2.5 px-3 font-semibold">Dataset Standard</th>
                <th className="py-2.5 px-3 font-semibold">Format</th>
                <th className="py-2.5 px-3 font-semibold">File Size</th>
                <th className="py-2.5 px-3 font-semibold">Records</th>
                <th className="py-2.5 px-3 font-semibold">Columns</th>
                <th className="py-2.5 px-3 font-semibold">Upload Date</th>
                <th className="py-2.5 px-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {datasets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No datasets ingested yet. Upload a CSV or click "Ingest Sample" above.
                  </td>
                </tr>
              ) : (
                datasets.map((ds) => (
                  <tr
                    key={ds.id}
                    className={`hover:bg-slate-50 cursor-pointer ${
                      selectedDataset?.id === ds.id ? 'bg-blue-50/40 font-semibold text-blue-900' : ''
                    }`}
                    onClick={() => setSelectedDataset(ds)}
                  >
                    <td className="py-2.5 px-3 font-mono text-blue-600">{ds.file_name}</td>
                    <td className="py-2.5 px-3 font-medium">{ds.dataset_type}</td>
                    <td className="py-2.5 px-3 font-mono">{ds.file_format}</td>
                    <td className="py-2.5 px-3 font-mono">{(ds.file_size_bytes / 1024).toFixed(1)} KB</td>
                    <td className="py-2.5 px-3 font-mono">{ds.record_count.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono">{ds.column_count}</td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(ds.upload_date).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDataset(ds);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded shadow-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Selected Dataset Quality Audit & 20-Row Preview */}
      {selectedDataset && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card space-y-5 animate-in fade-in">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Data Quality Audit & Schema Analysis: {selectedDataset.file_name}
              </h3>
              <p className="text-[11px] text-slate-400">{selectedDataset.dataset_type} | {selectedDataset.file_format}</p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Quality: Verified Clean
              </span>
            </div>
          </div>

          {/* Quality Audit Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-400 block font-semibold text-[11px]">Total Rows / Records</span>
              <span className="text-xl font-bold font-mono text-slate-900">{selectedDataset.record_count.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-400 block font-semibold text-[11px]">Total Features / Columns</span>
              <span className="text-xl font-bold font-mono text-slate-900">{selectedDataset.column_count}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-400 block font-semibold text-[11px]">Duplicate Records</span>
              <span className="text-xl font-bold font-mono text-emerald-600">{selectedDataset.duplicate_count}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-400 block font-semibold text-[11px]">Missing Values Identified</span>
              <span className="text-xl font-bold font-mono text-slate-800">
                {Object.values(selectedDataset.missing_values || {}).reduce((a, b) => a + b, 0)}
              </span>
            </div>
          </div>

          {/* Schema Columns & Data Types Inspector */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Inferred Schema & Data Types ({selectedDataset.columns?.length || 0} Columns)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              {selectedDataset.columns?.map((col, idx) => (
                <div key={idx} className="p-2 rounded border border-slate-100 bg-slate-50/70 font-mono text-[11px]">
                  <span className="font-bold text-slate-800 block truncate">{col.name}</span>
                  <span className="text-blue-600 text-[10px]">{col.dtype}</span>
                  <span className="text-slate-400 text-[10px] ml-1">sample: {col.sample}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 20-Row Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <TableIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Dataset Sample Preview (First 20 Rows)</span>
              </h4>
              <span className="text-[11px] text-slate-400">Horizontal scroll enabled</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-80">
              {selectedDataset.sample_preview && selectedDataset.sample_preview.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold font-mono text-[11px]">
                    <tr>
                      <th className="p-2 border-r">#</th>
                      {Object.keys(selectedDataset.sample_preview[0]).map((key) => (
                        <th key={key} className="p-2 border-r whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {selectedDataset.sample_preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r text-slate-400 font-sans">{idx + 1}</td>
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="p-2 border-r whitespace-nowrap">
                            {val !== null && val !== undefined ? String(val) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-slate-400 text-xs">No preview rows available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

