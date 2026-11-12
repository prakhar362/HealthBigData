# HealthBig – Healthcare Big Data Analytics and Patient Risk Prediction System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.5+-F7931E.svg?logo=scikit-learn)](https://scikit-learn.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-supported-336791.svg?logo=postgresql)](https://www.postgresql.org)

**HealthBig** is an academic Healthcare Big Data Analytics web application and clinical decision-support demonstration system. It is designed for university engineering mini-projects focusing on healthcare data processing, supervised patient risk prediction, chronic disease epidemiology, and simulated vital telemetry. It is not a production clinical system.

## What it does

- **Overview:** summarizes cohort and hospital metrics with interactive charts.
- **Patient management:** search, filter, paginate, add, edit, and remove patient records; inspect associated clinical history.
- **Health analytics:** explore diabetes, demographics, BMI, blood pressure, glucose, and hospital-admission trends.
- **Risk prediction:** compare Logistic Regression, Decision Tree, and Random Forest classifications, with model metrics and feature-importance information.
- **Live monitoring demo:** generates synthetic vital readings in the backend and displays readings and threshold alerts in the dashboard.
- **Data management and reports:** upload CSV or JSON files for a basic data-quality preview, and export analytical reports as CSV or PDF.

The application seeds an empty database with synthetic demo records and trains its classifiers when the backend starts. The monitoring simulator generates readings periodically in the running backend process; this is a demonstration, not a medical telemetry service.

## How it works

```text
Browser (React dashboard)
        | HTTP/JSON requests
        v
FastAPI REST API  <---->  SQLAlchemy  <---->  PostgreSQL or SQLite
        |
        +-- pandas / scikit-learn risk analysis
        +-- background synthetic-vitals simulator
        +-- CSV and PDF report generation
```

The frontend calls the backend's `/api/...` endpoints. FastAPI validates and routes requests to service and analytics code, SQLAlchemy reads and writes the relational data, and scikit-learn runs the risk-classification demo. The monitoring screen polls the API for simulator readings and alerts.

## Technology stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts, React Router |
| Backend/API | Python, FastAPI, Pydantic, Uvicorn |
| Data and analytics | SQLAlchemy, SQLite (local fallback), PostgreSQL, pandas, NumPy |
| Machine learning | scikit-learn, joblib |
| Reports | ReportLab (PDF), CSV |

Sample data files are under [`healthbig/backend/datasets`](healthbig/backend/datasets). The backend source is in [`healthbig/backend/app`](healthbig/backend/app), and the dashboard source is in [`healthbig/frontend/src`](healthbig/frontend/src).

## Run locally

Use the combined Windows startup instructions in [`steps.txt`](steps.txt). They install dependencies and start both the API and dashboard with the root-level `run_all.bat` script.

When running locally:

- Dashboard: <http://localhost:5173>
- API status: <http://localhost:8000/>
- Interactive API documentation: <http://localhost:8000/docs>

The backend uses SQLite if PostgreSQL is unavailable. For hosted deployment, configure PostgreSQL rather than relying on a local SQLite file.

---
## 🏥 System Architecture

```text
                                 +-------------------------------------------------------+
                                 |                 HEALTHBIG CLIENT UI                   |
                                 |      React 19 + TypeScript + Vite + Tailwind          |
                                 |    Recharts Interactive Visualizations + Lucide Icons |
                                 +---------------------------+---------------------------+
                                                             | REST APIs / JSON / Polling
                                                             v
                                 +-------------------------------------------------------+
                                 |                  FASTAPI BACKEND                      |
                                 |       Python + Pydantic v2                           |
                                 |       SQLAlchemy 2.0 ORM Engine + ReportLab PDF       |
                                 +----+----------------------+-----------------------+---+
                                      |                      |                       |
                                      v                      v                       v
                    +--------------------+ +--------------------+ +--------------------+
                    | RELATIONAL STORAGE | |  ML RISK PIPELINE  | | STREAMING TELEMETRY|
                    | PostgreSQL / SQLite| |  Scikit-learn Class| | Python Background  |
                    | Dual Engine Engine | |  LR, DT, RF Models | |  Vital Simulator   |
                    |  9 Core Tables     | |  F1 / Confusion Mtx| |  2.5s Packet Loop  |
                    +--------------------+ +--------------------+ +--------------------+
```

---

## 🌟 Key Application Modules

### 1. Executive Healthcare Overview Dashboard
- **8 Dynamic KPI Cards**: Total Patients, Diabetes Patients, High-Risk Patients, Medium-Risk Patients, Low-Risk Patients, Total Hospital Visits, Average BMI, Abnormal Vital Readings.
- **Interactive Visualizations**:
  - Patient distribution by age cohort.
  - Gender distribution.
  - Diabetes-positive vs. diabetes-negative ratio.
  - Disease distribution (Hypertension, Coronary Artery Disease, Stroke, Diabetes).
  - Monthly hospital admissions by acuity (Emergency, Urgent, Elective).
  - Patient risk stratification donut chart.
  - Longitudinal health trends (mean glucose and systolic blood pressure by age group).
- **Feeds**: Recent cohort intake records, real-time alert notifications, and Big Data storage diagnostics.

### 2. Patient Management & Longitudinal Clinical Chart
- **Search & Filter**: Search by Patient ID (e.g., `PT-10001`) or Patient Name; filter by age range, gender, diabetes status, and risk tier.
- **Pagination & Multi-Column Sorting**: Sort by ID, age, BMI, blood glucose, or calculated risk score.
- **Full CRUD Operations**:
  - Add synthetic patient records with automatic real-time ML risk stratification.
  - Edit patient biomarkers and clinical indicators.
  - Permanent record deletion with cascade integrity.
- **Longitudinal Clinical History Drawer**:
  - Inpatient encounter history (admission date, length of stay, diagnosis, cost).
  - Diagnostic laboratory test results (HbA1c, fasting glucose, reference ranges, abnormal flags).
  - Active medication prescriptions (dosage, frequency, status).
  - Historical vitals logs.

### 3. Disease Analytics
- Cross-sectional epidemiological analysis:
  - Diabetes prevalence by age group and gender.
  - Body Mass Index (BMI) stratification according to WHO clinical standards.
  - Fasting capillary blood glucose distribution.
  - Blood pressure classification (AHA/ACC stages: Normal, Elevated, Stage 1, Stage 2).
  - Serum cholesterol tiers (NCEP ATP III: Desirable, Borderline, High Risk).
  - Tobacco exposure correlation (smoking status vs. diabetes rate).
  - Physical activity impact on cardiometabolic outcomes.

### 4. Patient Risk Prediction Engine
- **Supervised ML Classification**:
  - Logistic Regression (with standard scaling)
  - Decision Tree Classifier
  - Random Forest Ensemble (100 estimators)
- **Flexible Ingest**: Select an existing patient from the database or manually enter synthetic patient biomarkers.
- **Explainable Inference**:
  - Predicted risk category: **Low Risk** (Green), **Medium Risk** (Amber), **High Risk** (Red).
  - Calculated risk score & confidence percentage.
  - Ranked contributing features with impact indicators (High, Moderate, Low) and physiological descriptions.
- **Transparent Target Definition**: Composite metabolic and cardiovascular risk index derived from fasting glycemic markers, systolic pressure, BMI, and documented vascular conditions.
- **Academic Model Benchmark Comparison**:
  - Model metrics table: Accuracy, Precision, Recall, Weighted F1-score.
  - Interactive 3x3 Confusion Matrix.
  - Random Forest feature importance bar chart.
  - Retrain pipeline button.

### 5. Real-Time Patient Monitoring
- **Backend-Driven Vital Simulator**: Python daemon emitting telemetry packets every 2.5 seconds.
- **Streaming Telemetry Metrics**: Patient ID, Heart rate, Systolic BP, Diastolic BP, Blood glucose, Body temperature, SpO2, and Timestamp.
- **Dynamic Live Waveform Chart**: Synchronized multi-parameter line graph updating as streaming packets arrive from the backend.
- **Configurable Illustrative Thresholds**:
  - Heart Rate: 60–100 bpm (Critical: <48 or >125 bpm)
  - Systolic BP: 95–120 mmHg (Critical: >=155 mmHg)
  - Blood Glucose: 70–130 mg/dL (Critical: <60 or >=200 mg/dL)
  - Temperature: 97.5–99.2 °F (Critical: >=101.5 °F)
- **Live Clinical Alerts**: Real-time abnormal threshold warnings with one-click acknowledgment.

### 6. Hospital Analytics & Inpatient Operations
- Modeled after the **Diabetes 130-US Hospitals** dataset.
- Total hospital admissions and average length of stay (LOS).
- Inpatient admission types breakdown (Emergency, Urgent, Elective, Routine).
- **30-Day Readmission Analysis**: Distribution of `NO`, `<30` days, and `>30` days.
- Inpatient admissions by clinical specialty department (Endocrinology, Cardiology, Nephrology, Internal Medicine).
- Top primary admission diagnoses ranking.
- Laboratory diagnostic utilization and abnormal result rates.
- Inpatient pharmaceutical prescription frequency.

### 7. Analytical Reports & Exports
- **5 Downloadable Reports**:
  1. Patient Analytics Report
  2. Disease Analytics Report
  3. Patient Risk Report
  4. Hospital Admissions Report
  5. Data Quality Report
- **Dual Export Formats**:
  - RFC 4180 compliant CSV exports.
  - High-resolution vector PDF reports compiled via Python ReportLab.

### 8. Big Data Ingestion & Quality Audit
- Upload and inspect healthcare datasets in CSV and JSON formats.
- **Automated Quality Audit**:
  - Total records count and feature column count.
  - Duplicate record detection.
  - Missing values profiling per column.
  - Inferred schema (column names, pandas data types, sample values).
  - Interactive 20-row sample data preview table with horizontal scrolling.
- **Dataset Integration Support**:
  - CDC Diabetes Health Indicators.
  - Diabetes 130-US Hospitals.
  - Synthea Synthetic Healthcare Data.
- One-click benchmark dataset sample ingestion.

### 9. System Settings & Diagnostics
- Runtime database engine status (PostgreSQL active / SQLite fallback).
- Active cohort count and table metrics.
- One-click ML model retraining.
- Architectural stack documentation.


## 🗄️ Database Schema & Relational Design

The application implements 9 relational tables:

1. `patients`: Core patient demographics, biometrics (BMI, blood pressure, fasting glucose, cholesterol), lifestyle indicators (smoking, physical activity), disease status, and risk tier.
2. `patient_health_records`: Longitudinal clinical records tracking biometric progression over time.
3. `hospital_visits`: Encounter events modeled after Diabetes 130-US Hospitals (admission date, length of stay, diagnosis, 30-day readmission status, department).
4. `laboratory_results`: Biochemical tests (HbA1c, Fasting Blood Glucose, lipid panel) with reference ranges and abnormal flags.
5. `medications`: Inpatient and outpatient pharmaceutical regimens (Metformin, Lisinopril, Insulin Glargine, etc.).
6. `patient_vitals`: Telemetry packet logs (Heart rate, Systolic BP, Diastolic BP, Glucose, Temperature, SpO2).
7. `risk_predictions`: Audit trail of all machine learning inference runs, probabilities, and contributing factors.
8. `monitoring_alerts`: Threshold notifications generated by the streaming simulator (Warning / Critical) with acknowledgment status.
9. `uploaded_datasets`: Catalog of all ingested CSV and JSON files, schemas, missing value counts, duplicate counts, and 20-row previews.

### PostgreSQL Configuration

To use a dedicated PostgreSQL instance:
1. Create a database:
   ```sql
   CREATE DATABASE healthbig_db;
   ```
2. Update `healthbig/backend/.env`:
   ```ini
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/healthbig_db
   ```
3. Restart the backend server. The SQLAlchemy ORM will automatically create all tables, indexes, and foreign keys.

---

## 📡 REST API Documentation

FastAPI provides an interactive OpenAPI / Swagger UI accessible at `http://localhost:8000/docs`.

### Key Endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Executive KPI cards, age/gender distributions, monthly admissions, recent alerts |
| `GET` | `/api/patients` | Search, filter by age/gender/risk, sort, and paginate patient records |
| `GET` | `/api/patients/{id}` | Detailed patient profile by Patient ID |
| `POST` | `/api/patients` | Add a synthetic patient with automatic ML risk calculation |
| `PUT` | `/api/patients/{id}` | Update patient biomarkers and recalibrate risk |
| `DELETE` | `/api/patients/{id}` | Delete patient record and related clinical history |
| `GET` | `/api/patients/{id}/history`| Inpatient encounters, lab tests, medications, and vitals history |
| `GET` | `/api/analytics/diabetes` | Cross-sectional diabetes prevalence, BMI, BP, glucose distributions |
| `GET` | `/api/analytics/demographics`| Population age and gender distributions |
| `GET` | `/api/analytics/hospital` | Admission types, length of stay, 30-day readmissions, medications |
| `POST` | `/api/prediction/patient-risk` | Evaluates patient risk using Logistic Regression, Decision Tree, or Random Forest |
| `GET` | `/api/prediction/model-metrics`| Comparative benchmark metrics (Accuracy, Precision, Recall, F1, Confusion Matrix) |
| `POST` | `/api/prediction/train` | Retrains and persists all 3 classification algorithms on the current database |
| `GET` | `/api/monitoring/latest` | Latest streaming vital telemetry packets from the simulator |
| `GET` | `/api/monitoring/alerts` | Live abnormal threshold telemetry warnings |
| `POST` | `/api/monitoring/start` | Starts the Python telemetry generator daemon |
| `POST` | `/api/monitoring/stop` | Pauses the telemetry generator daemon |
| `POST` | `/api/monitoring/alerts/{id}/acknowledge` | Acknowledges an active clinical alert |
| `POST` | `/api/datasets/upload` | Uploads and audits CSV or JSON healthcare datasets |
| `GET` | `/api/datasets` | Lists all ingested datasets and data quality audits |
| `GET` | `/api/reports` | Lists exportable analytical reports |
| `GET` | `/api/reports/download` | Downloads reports in CSV or PDF format |

---

## 🧠 Machine Learning Pipeline Specifications

1. **Feature Engineering**: Features include Age, BMI, Systolic Blood Pressure, Fasting Glucose, Total Cholesterol, Smoking Status (numeric encoding), Physical Activity, Heart Disease history, and Stroke history.
2. **Data Scaling**: `StandardScaler` fitted on training split and persisted to `scaler.joblib`.
3. **Algorithms Evaluated**:
   - **Logistic Regression**: High interpretability, linear decision boundary with balanced class weights.
   - **Decision Tree**: Non-linear tree splitting on feature variance.
   - **Random Forest**: Ensemble of 100 bagging trees providing robust generalization and feature importance rankings.
4. **Target Label Definition**: Composite metabolic and cardiovascular risk index (Class 0: Low Risk, Class 1: Medium Risk, Class 2: High Risk). Transparently derived without data leakage.
5. **Evaluation Output**: Accuracy, Precision, Recall, Weighted F1-score, and a complete 3x3 Confusion Matrix.

---
