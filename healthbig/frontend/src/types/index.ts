export interface Patient {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  bmi: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  blood_glucose: number;
  cholesterol: number;
  smoking_status: string;
  physical_activity: number;
  diabetes_status: number;
  heart_disease: number;
  stroke: number;
  general_health: number;
  risk_category: 'Low Risk' | 'Medium Risk' | 'High Risk';
  risk_score: number;
  is_synthetic: boolean;
  dataset_source: string;
  created_at: string;
  updated_at: string;
}

export interface PatientListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  patients: Patient[];
}

export interface PatientHistory {
  patient: Patient;
  records: Array<{
    id: number;
    patient_id: string;
    record_date: string;
    bmi: number;
    systolic_bp: number;
    diastolic_bp: number;
    fasting_glucose: number;
    notes?: string;
  }>;
  visits: Array<{
    id: number;
    patient_id: string;
    admission_date: string;
    discharge_date?: string;
    admission_type: string;
    length_of_stay: number;
    primary_diagnosis: string;
    readmitted: string;
    total_cost: number;
    department: string;
  }>;
  labs: Array<{
    id: number;
    patient_id: string;
    test_name: string;
    test_value: number;
    unit: string;
    reference_range: string;
    is_abnormal: boolean;
    test_date: string;
  }>;
  medications: Array<{
    id: number;
    patient_id: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    status: string;
  }>;
  vitals: Array<{
    heart_rate: number;
    systolic_bp: number;
    diastolic_bp: number;
    blood_glucose: number;
    body_temperature: number;
    oxygen_saturation: number;
    status: string;
    timestamp: string;
  }>;
}

export interface KpiSummary {
  total_patients: number;
  diabetes_patients: number;
  diabetes_percentage: number;
  high_risk_patients: number;
  medium_risk_patients: number;
  low_risk_patients: number;
  total_hospital_visits: number;
  average_bmi: number;
  abnormal_vital_readings: number;
}

export interface DashboardSummary {
  kpis: KpiSummary;
  age_distribution: Array<{ group: string; count: number }>;
  gender_distribution: Array<{ gender: string; count: number; percentage: number }>;
  diabetes_ratio: Array<{ status: string; count: number; percentage: number }>;
  disease_distribution: Array<{ disease: string; count: number; color: string }>;
  monthly_admissions: Array<{ month: string; admissions: number; emergency: number; elective: number; urgent: number }>;
  risk_distribution: Array<{ risk: string; count: number; color: string }>;
  patient_health_trends: Array<{ category: string; avg_glucose: number; avg_systolic: number; avg_bmi: number }>;
  recent_patients: Patient[];
  recent_alerts: MonitoringAlert[];
  latest_activity: Array<{ time: string; action: string; type: string }>;
  dataset_statistics: {
    primary_source?: string;
    total_records: number;
    total_visits?: number;
    total_vitals_logged?: number;
    active_alerts_count?: number;
  };
}

export interface DiseaseAnalytics {
  diabetes_by_age: Array<{ age_group: string; total: number; diabetic: number; non_diabetic: number; prevalence_rate: number }>;
  diabetes_by_gender: Array<{ gender: string; total: number; diabetic: number; non_diabetic: number; prevalence_rate: number }>;
  bmi_distribution: Array<{ category: string; count: number; color: string }>;
  glucose_distribution: Array<{ range: string; count: number; color: string }>;
  blood_pressure_distribution: Array<{ category: string; count: number; color: string }>;
  cholesterol_distribution: Array<{ tier: string; count: number; color: string }>;
  smoking_correlation: Array<{ smoking_status: string; total: number; diabetic: number; percentage: number }>;
  activity_correlation: Array<{ status: string; total: number; diabetes_rate: number; heart_disease_rate: number }>;
}

export interface HospitalAnalytics {
  total_admissions: number;
  average_length_of_stay: number;
  admission_types: Array<{ type: string; count: number; percentage: number }>;
  readmission_statistics: Array<{ category: string; key: string; count: number; color: string }>;
  department_distribution: Array<{ department: string; visits: number; avg_stay: number }>;
  top_diagnoses: Array<{ diagnosis: string; cases: number }>;
  laboratory_statistics: {
    total_tests_conducted: number;
    abnormal_results_count: number;
    abnormal_percentage: number;
    average_hba1c: number;
    average_fasting_glucose: number;
  };
  medication_analysis: Array<{ medication: string; prescriptions: number }>;
}

export interface ContributingFactor {
  feature: string;
  impact: 'High' | 'Moderate' | 'Low';
  value: any;
  description: string;
}

export interface RiskPredictionResult {
  predicted_risk_category: 'Low Risk' | 'Medium Risk' | 'High Risk';
  risk_score: number;
  confidence_percentage: number;
  model_used: string;
  target_definition: string;
  contributing_factors: ContributingFactor[];
  clinical_disclaimer: string;
}

export interface ModelMetric {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  class_names: string[];
}

export interface ModelMetricsSummary {
  target_label: string;
  target_description: string;
  models: ModelMetric[];
  best_model: string;
  feature_names: string[];
  feature_importances: Record<string, number>;
}

export interface LiveVitalReading {
  patient_id: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  blood_glucose: number;
  body_temperature: number;
  oxygen_saturation: number;
  status: 'Normal' | 'Warning' | 'Critical';
  timestamp: string;
}

export interface MonitoringAlert {
  id: number;
  patient_id: string;
  alert_type: string;
  severity: 'Warning' | 'Critical';
  vital_name: string;
  vital_value: number;
  threshold_exceeded: string;
  message: string;
  timestamp: string;
  is_acknowledged: boolean;
}

export interface UploadedDatasetItem {
  id: number;
  file_name: string;
  dataset_type: string;
  file_format: string;
  file_size_bytes: number;
  record_count: number;
  column_count: number;
  columns: Array<{ name: string; dtype: string; sample: string }>;
  missing_values: Record<string, number>;
  duplicate_count: number;
  sample_preview: any[];
  upload_date: string;
}

export interface ReportItem {
  id: string;
  title: string;
  description: string;
  formats: string[];
}

