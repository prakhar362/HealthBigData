import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database.session import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(32), unique=True, index=True, nullable=False)
    first_name = Column(String(64), nullable=False)
    last_name = Column(String(64), nullable=False)
    age = Column(Integer, nullable=False, index=True)
    gender = Column(String(16), nullable=False, index=True) # Male, Female, Other
    bmi = Column(Float, nullable=False)
    blood_pressure_systolic = Column(Integer, nullable=False)
    blood_pressure_diastolic = Column(Integer, nullable=False)
    blood_glucose = Column(Float, nullable=False)
    cholesterol = Column(Integer, nullable=False) # e.g. total cholesterol mg/dL
    smoking_status = Column(String(32), nullable=False) # Non-smoker, Former smoker, Current smoker
    physical_activity = Column(Integer, default=1) # 1 = Active, 0 = Inactive
    diabetes_status = Column(Integer, default=0, index=True) # 0 = No, 1 = Yes
    heart_disease = Column(Integer, default=0) # 0 = No, 1 = Yes
    stroke = Column(Integer, default=0) # 0 = No, 1 = Yes
    general_health = Column(Integer, default=3) # 1 (Excellent) to 5 (Poor)
    risk_category = Column(String(16), default="Low Risk", index=True) # Low Risk, Medium Risk, High Risk
    risk_score = Column(Float, default=0.15)
    is_synthetic = Column(Boolean, default=True)
    dataset_source = Column(String(64), default="Synthea-Demo")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    health_records = relationship("PatientHealthRecord", back_populates="patient", cascade="all, delete-orphan")
    hospital_visits = relationship("HospitalVisit", back_populates="patient", cascade="all, delete-orphan")
    laboratory_results = relationship("LaboratoryResult", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    vitals = relationship("PatientVital", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("MonitoringAlert", back_populates="patient", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_patient_age_gender", "age", "gender"),
        Index("ix_patient_risk_diabetes", "risk_category", "diabetes_status"),
    )


class PatientHealthRecord(Base):
    __tablename__ = "patient_health_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(32), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    bmi = Column(Float, nullable=False)
    systolic_bp = Column(Integer, nullable=False)
    diastolic_bp = Column(Integer, nullable=False)
    fasting_glucose = Column(Float, nullable=False)
    hba1c = Column(Float, nullable=True)
    cholesterol_total = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="health_records")


class HospitalVisit(Base):
    __tablename__ = "hospital_visits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(32), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    admission_date = Column(DateTime, nullable=False, index=True)
    discharge_date = Column(DateTime, nullable=True)
    admission_type = Column(String(64), nullable=False) # Emergency, Urgent, Elective, Routine
    length_of_stay = Column(Integer, default=1) # Days
    primary_diagnosis = Column(String(128), nullable=False)
    readmitted = Column(String(32), default="NO") # NO, <30, >30
    total_cost = Column(Float, default=1200.0)
    department = Column(String(64), default="Endocrinology")

    patient = relationship("Patient", back_populates="hospital_visits")


class LaboratoryResult(Base):
    __tablename__ = "laboratory_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(32), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    test_name = Column(String(64), nullable=False)
    test_value = Column(Float, nullable=False)
    unit = Column(String(32), nullable=False)
    reference_range = Column(String(64), nullable=False)
    is_abnormal = Column(Boolean, default=False, index=True)
    test_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    patient = relationship("Patient", back_populates="laboratory_results")


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(32), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    medication_name = Column(String(128), nullable=False)
    dosage = Column(String(64), nullable=False)
    frequency = Column(String(64), nullable=False)
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(32), default="Active") # Active, Discontinued

    patient = relationship("Patient", back_populates="medications")


class PatientVital(Base):
    __tablename__ = "patient_vitals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(32), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    heart_rate = Column(Integer, nullable=False)
    systolic_bp = Column(Integer, nullable=False)
    diastolic_bp = Column(Integer, nullable=False)
    blood_glucose = Column(Float, nullable=False)
    body_temperature = Column(Float, nullable=False)
    oxygen_saturation = Column(Float, default=98.0)
    status = Column(String(32), default="Normal") # Normal, Warning, Critical
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    patient = relationship("Patient", back_populates="vitals")


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(32), nullable=True, index=True)
    model_used = Column(String(64), nullable=False) # Logistic Regression, Decision Tree, Random Forest
    predicted_category = Column(String(16), nullable=False) # Low Risk, Medium Risk, High Risk
    probability_score = Column(Float, nullable=False)
    input_features = Column(Text, nullable=False) # JSON
    contributing_factors = Column(Text, nullable=False) # JSON
    prediction_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class MonitoringAlert(Base):
    __tablename__ = "monitoring_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(32), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(64), nullable=False)
    severity = Column(String(16), nullable=False, index=True) # Warning, Critical
    vital_name = Column(String(32), nullable=False)
    vital_value = Column(Float, nullable=False)
    threshold_exceeded = Column(String(64), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    is_acknowledged = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="alerts")


class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    file_name = Column(String(256), nullable=False)
    dataset_type = Column(String(64), nullable=False) # CDC Diabetes, Diabetes 130-US Hospitals, Synthea, Custom
    file_format = Column(String(16), nullable=False) # CSV, JSON
    file_size_bytes = Column(Integer, nullable=False)
    record_count = Column(Integer, nullable=False)
    column_count = Column(Integer, nullable=False)
    columns = Column(Text, nullable=False) # JSON string of columns & inferred types
    missing_values = Column(Text, nullable=False) # JSON dict of missing counts
    duplicate_count = Column(Integer, default=0)
    sample_preview = Column(Text, nullable=False) # JSON list of first 20 rows
    upload_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)

