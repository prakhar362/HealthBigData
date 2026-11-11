from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Patient Schemas
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    bmi: float = Field(..., ge=10.0, le=70.0)
    blood_pressure_systolic: int = Field(..., ge=70, le=240)
    blood_pressure_diastolic: int = Field(..., ge=40, le=140)
    blood_glucose: float = Field(..., ge=40.0, le=500.0)
    cholesterol: int = Field(..., ge=80, le=500)
    smoking_status: str = Field(default="Non-smoker")
    physical_activity: int = Field(default=1, ge=0, le=1)
    diabetes_status: int = Field(default=0, ge=0, le=1)
    heart_disease: int = Field(default=0, ge=0, le=1)
    stroke: int = Field(default=0, ge=0, le=1)
    general_health: int = Field(default=3, ge=1, le=5)

class PatientCreate(PatientBase):
    patient_id: Optional[str] = None
    dataset_source: Optional[str] = "Synthetic-Entry"

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    bmi: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    blood_glucose: Optional[float] = None
    cholesterol: Optional[int] = None
    smoking_status: Optional[str] = None
    physical_activity: Optional[int] = None
    diabetes_status: Optional[int] = None
    heart_disease: Optional[int] = None
    stroke: Optional[int] = None
    general_health: Optional[int] = None

class PatientResponse(PatientBase):
    id: int
    patient_id: str
    risk_category: str
    risk_score: float
    is_synthetic: bool
    dataset_source: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PatientListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    patients: List[PatientResponse]

# Health Records
class HealthRecordResponse(BaseModel):
    id: int
    patient_id: str
    record_date: datetime
    bmi: float
    systolic_bp: int
    diastolic_bp: int
    fasting_glucose: float
    hba1c: Optional[float] = None
    cholesterol_total: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# Hospital Visit
class HospitalVisitResponse(BaseModel):
    id: int
    patient_id: str
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    admission_type: str
    length_of_stay: int
    primary_diagnosis: str
    readmitted: str
    total_cost: float
    department: str

    class Config:
        from_attributes = True

# Laboratory Result
class LaboratoryResultResponse(BaseModel):
    id: int
    patient_id: str
    test_name: str
    test_value: float
    unit: str
    reference_range: str
    is_abnormal: bool
    test_date: datetime

    class Config:
        from_attributes = True

# Medication
class MedicationResponse(BaseModel):
    id: int
    patient_id: str
    medication_name: str
    dosage: str
    frequency: str
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True

# Patient Vital
class PatientVitalSchema(BaseModel):
    patient_id: str
    heart_rate: int
    systolic_bp: int
    diastolic_bp: int
    blood_glucose: float
    body_temperature: float
    oxygen_saturation: Optional[float] = 98.0
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True

# Risk Prediction
class RiskPredictionRequest(BaseModel):
    patient_id: Optional[str] = None
    age: int = Field(..., ge=1, le=120)
    bmi: float = Field(..., ge=10.0, le=70.0)
    blood_glucose: float = Field(..., ge=40.0, le=500.0)
    blood_pressure_systolic: int = Field(..., ge=70, le=240)
    cholesterol: int = Field(..., ge=80, le=500)
    smoking_status: str = Field(default="Non-smoker")
    physical_activity: int = Field(default=1, ge=0, le=1)
    heart_disease: int = Field(default=0, ge=0, le=1)
    stroke: int = Field(default=0, ge=0, le=1)
    model_name: Optional[str] = "Random Forest"

class ContributingFactor(BaseModel):
    feature: str
    impact: str # High, Moderate, Low
    value: Any
    description: str

class RiskPredictionResponse(BaseModel):
    predicted_risk_category: str # Low Risk, Medium Risk, High Risk
    risk_score: float # 0.0 - 1.0
    confidence_percentage: float
    model_used: str
    target_definition: str
    contributing_factors: List[ContributingFactor]
    clinical_disclaimer: str

class ModelEvaluationMetric(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    class_names: List[str]

class ModelMetricsResponse(BaseModel):
    target_label: str
    target_description: str
    models: List[ModelEvaluationMetric]
    best_model: str
    feature_names: List[str]
    feature_importances: Dict[str, float]

# Monitoring Alerts
class MonitoringAlertSchema(BaseModel):
    id: int
    patient_id: str
    alert_type: str
    severity: str # Warning, Critical
    vital_name: str
    vital_value: float
    threshold_exceeded: str
    message: str
    timestamp: datetime
    is_acknowledged: bool

    class Config:
        from_attributes = True

# Uploaded Datasets
class UploadedDatasetResponse(BaseModel):
    id: int
    file_name: str
    dataset_type: str
    file_format: str
    file_size_bytes: int
    record_count: int
    column_count: int
    columns: List[Dict[str, str]]
    missing_values: Dict[str, int]
    duplicate_count: int
    sample_preview: List[Dict[str, Any]]
    upload_date: datetime

    class Config:
        from_attributes = True

# Dashboard Summary
class KpiSummary(BaseModel):
    total_patients: int
    diabetes_patients: int
    diabetes_percentage: float
    high_risk_patients: int
    medium_risk_patients: int
    low_risk_patients: int
    total_hospital_visits: int
    average_bmi: float
    abnormal_vital_readings: int

class DashboardSummaryResponse(BaseModel):
    kpis: KpiSummary
    age_distribution: List[Dict[str, Any]]
    gender_distribution: List[Dict[str, Any]]
    diabetes_ratio: List[Dict[str, Any]]
    disease_distribution: List[Dict[str, Any]]
    monthly_admissions: List[Dict[str, Any]]
    risk_distribution: List[Dict[str, Any]]
    patient_health_trends: List[Dict[str, Any]]
    recent_patients: List[PatientResponse]
    recent_alerts: List[MonitoringAlertSchema]
    latest_activity: List[Dict[str, Any]]
    dataset_statistics: Dict[str, Any]

