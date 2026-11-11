import {
  Patient,
  PatientListResponse,
  PatientHistory,
  DashboardSummary,
  DiseaseAnalytics,
  HospitalAnalytics,
  RiskPredictionResult,
  ModelMetricsSummary,
  LiveVitalReading,
  MonitoringAlert,
  UploadedDatasetItem,
  ReportItem
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) errMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
    } catch {
      // fallback
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboardSummary: () => fetchJson<DashboardSummary>('/api/dashboard/summary'),

  // Patients
  getPatients: (params: {
    page?: number;
    page_size?: number;
    search?: string;
    gender?: string;
    risk_category?: string;
    diabetes_status?: number;
    min_age?: number;
    max_age?: number;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.search) query.append('search', params.search);
    if (params.gender) query.append('gender', params.gender);
    if (params.risk_category) query.append('risk_category', params.risk_category);
    if (params.diabetes_status !== undefined) query.append('diabetes_status', params.diabetes_status.toString());
    if (params.min_age !== undefined) query.append('min_age', params.min_age.toString());
    if (params.max_age !== undefined) query.append('max_age', params.max_age.toString());
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);
    return fetchJson<PatientListResponse>(`/api/patients?${query.toString()}`);
  },

  getPatientById: (id: string) => fetchJson<Patient>(`/api/patients/${id}`),
  getPatientHistory: (id: string) => fetchJson<PatientHistory>(`/api/patients/${id}/history`),

  createPatient: (data: Partial<Patient>) =>
    fetchJson<Patient>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updatePatient: (id: string, data: Partial<Patient>) =>
    fetchJson<Patient>(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deletePatient: (id: string) =>
    fetchJson<{ message: string }>(`/api/patients/${id}`, {
      method: 'DELETE'
    }),

  // Analytics
  getDiseaseAnalytics: () => fetchJson<DiseaseAnalytics>('/api/analytics/diabetes'),
  getDemographics: () => fetchJson<any>('/api/analytics/demographics'),
  getHospitalAnalytics: () => fetchJson<HospitalAnalytics>('/api/analytics/hospital'),

  // Prediction
  predictRisk: (data: {
    patient_id?: string;
    age: number;
    bmi: number;
    blood_glucose: number;
    blood_pressure_systolic: number;
    cholesterol: number;
    smoking_status: string;
    physical_activity: number;
    heart_disease: number;
    stroke: number;
    model_name?: string;
  }) =>
    fetchJson<RiskPredictionResult>('/api/prediction/patient-risk', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getModelMetrics: () => fetchJson<ModelMetricsSummary>('/api/prediction/model-metrics'),
  retrainModels: () => fetchJson<any>('/api/prediction/train', { method: 'POST' }),

  // Real-Time Monitoring
  getLatestVitals: (patientId?: string, limit: number = 30) => {
    const q = new URLSearchParams();
    if (patientId) q.append('patient_id', patientId);
    q.append('limit', limit.toString());
    return fetchJson<LiveVitalReading[]>(`/api/monitoring/latest?${q.toString()}`);
  },

  getMonitoringAlerts: (limit: number = 25, unacknowledgedOnly: boolean = false) => {
    const q = new URLSearchParams({
      limit: limit.toString(),
      unacknowledged_only: unacknowledgedOnly.toString()
    });
    return fetchJson<MonitoringAlert[]>(`/api/monitoring/alerts?${q.toString()}`);
  },

  startMonitoring: (patientId?: string) => {
    const url = patientId ? `/api/monitoring/start?patient_id=${patientId}` : '/api/monitoring/start';
    return fetchJson<any>(url, { method: 'POST' });
  },

  stopMonitoring: () => fetchJson<any>('/api/monitoring/stop', { method: 'POST' }),
  getMonitoringStatus: () => fetchJson<any>('/api/monitoring/status'),
  acknowledgeAlert: (alertId: number) =>
    fetchJson<any>(`/api/monitoring/alerts/${alertId}/acknowledge`, { method: 'POST' }),

  // Datasets
  getDatasets: () => fetchJson<UploadedDatasetItem[]>('/api/datasets'),
  getDatasetById: (id: number) => fetchJson<UploadedDatasetItem>(`/api/datasets/${id}`),

  uploadDataset: async (file: File, datasetType: string, importRecords: boolean = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_type', datasetType);
    formData.append('import_records', importRecords.toString());

    const res = await fetch(`${API_BASE}/api/datasets/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // Reports
  getReports: () => fetchJson<ReportItem[]>('/api/reports'),
  getReportDownloadUrl: (type: string, format: string) =>
    `${API_BASE}/api/reports/download?report_type=${type}&format=${format}`
};

