import random
import datetime
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.models.patient import (
    Patient,
    PatientHealthRecord,
    HospitalVisit,
    LaboratoryResult,
    Medication,
    PatientVital,
    MonitoringAlert
)
from app.ml.pipeline import ml_pipeline, FEATURE_COLS

FIRST_NAMES_MALE = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph",
    "Thomas", "Charles", "Christopher", "Daniel", "Matthew", "Anthony", "Mark",
    "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
    "George", "Edward", "Ronald", "Timothy", "Jason", "Jeffrey", "Ryan", "Jacob"
]

FIRST_NAMES_FEMALE = [
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan",
    "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret", "Sandra",
    "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Carol", "Amanda", "Dorothy",
    "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Kathleen"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker"
]

DIAGNOSES = [
    "Type 2 Diabetes Mellitus with Complications",
    "Essential Hypertension",
    "Coronary Artery Disease",
    "Chronic Kidney Disease Stage 3",
    "Hyperlipidemia and Metabolic Syndrome",
    "Acute Diabetic Ketoacidosis",
    "Congestive Heart Failure",
    "Cerebrovascular Disease",
    "Peripheral Vascular Disease"
]

DEPARTMENTS = ["Endocrinology", "Cardiology", "Internal Medicine", "Emergency Medicine", "Nephrology"]

MEDICATIONS_LIST = [
    ("Metformin HCl", "1000 mg", "Twice daily with meals"),
    ("Lisinopril", "20 mg", "Once daily in morning"),
    ("Atorvastatin Calcium", "40 mg", "Once daily at bedtime"),
    ("Insulin Glargine", "24 Units", "Once daily subcutaneous"),
    ("Empagliflozin", "10 mg", "Once daily in morning"),
    ("Amlodipine Besylate", "5 mg", "Once daily"),
    ("Aspirin Low Dose", "81 mg", "Once daily"),
    ("Losartan Potassium", "50 mg", "Once daily"),
    ("Glipizide", "5 mg", "Once daily before breakfast")
]

def generate_synthetic_healthcare_dataset(num_records: int = 600) -> pd.DataFrame:
    """
    Generates synthetic healthcare cohort modeled after CDC Diabetes Health Indicators
    and Synthea patient distribution with true multi-factor medical correlations.
    """
    random.seed(42)
    np.random.seed(42)

    records = []
    base_date = datetime.datetime.now() - datetime.timedelta(days=365)

    for i in range(1, num_records + 1):
        p_id = f"PT-{10000 + i}"
        gender = "Male" if random.random() < 0.49 else "Female"
        first_name = random.choice(FIRST_NAMES_MALE) if gender == "Male" else random.choice(FIRST_NAMES_FEMALE)
        last_name = random.choice(LAST_NAMES)

        # Age distribution: skewed toward adult/middle/older ages typical in diabetes analytics
        age = int(np.clip(np.random.normal(54, 14), 22, 88))

        # Risk archetype assignment for coherent correlations
        archetype = np.random.choice(["healthy", "moderate", "high_risk"], p=[0.42, 0.35, 0.23])

        if archetype == "healthy":
            bmi = round(float(np.random.normal(23.5, 2.8)), 1)
            systolic = int(np.random.normal(118, 8))
            diastolic = int(np.random.normal(76, 6))
            blood_glucose = round(float(np.random.normal(92, 11)), 1)
            cholesterol = int(np.random.normal(175, 20))
            smoking = np.random.choice(["Non-smoker", "Former smoker"], p=[0.85, 0.15])
            physical_activity = 1 if random.random() < 0.85 else 0
            diabetes_status = 0
            heart_disease = 0
            stroke = 0
            general_health = random.choice([1, 2, 3])
            risk_category = "Low Risk"
            risk_score = round(random.uniform(0.05, 0.28), 3)

        elif archetype == "moderate":
            bmi = round(float(np.random.normal(28.2, 3.2)), 1)
            systolic = int(np.random.normal(132, 10))
            diastolic = int(np.random.normal(84, 7))
            blood_glucose = round(float(np.random.normal(118, 18)), 1)
            cholesterol = int(np.random.normal(215, 25))
            smoking = np.random.choice(["Non-smoker", "Former smoker", "Current smoker"], p=[0.55, 0.30, 0.15])
            physical_activity = 1 if random.random() < 0.50 else 0
            diabetes_status = 1 if random.random() < 0.28 else 0
            heart_disease = 1 if random.random() < 0.12 else 0
            stroke = 0
            general_health = random.choice([2, 3, 4])
            risk_category = "Medium Risk"
            risk_score = round(random.uniform(0.38, 0.65), 3)

        else: # high_risk
            bmi = round(float(np.random.normal(34.5, 4.5)), 1)
            systolic = int(np.random.normal(148, 14))
            diastolic = int(np.random.normal(92, 9))
            blood_glucose = round(float(np.random.normal(172, 35)), 1)
            cholesterol = int(np.random.normal(245, 30))
            smoking = np.random.choice(["Non-smoker", "Former smoker", "Current smoker"], p=[0.30, 0.35, 0.35])
            physical_activity = 1 if random.random() < 0.25 else 0
            diabetes_status = 1 if random.random() < 0.82 else 0
            heart_disease = 1 if random.random() < 0.42 else 0
            stroke = 1 if random.random() < 0.22 else 0
            general_health = random.choice([4, 5])
            risk_category = "High Risk"
            risk_score = round(random.uniform(0.72, 0.96), 3)

        # Clamping realistic physiological limits
        bmi = max(16.0, min(56.0, bmi))
        systolic = max(90, min(200, systolic))
        diastolic = max(55, min(120, diastolic))
        blood_glucose = max(65.0, min(360.0, blood_glucose))
        cholesterol = max(120, min(380, cholesterol))

        records.append({
            "patient_id": p_id,
            "first_name": first_name,
            "last_name": last_name,
            "age": age,
            "gender": gender,
            "bmi": bmi,
            "blood_pressure_systolic": systolic,
            "blood_pressure_diastolic": diastolic,
            "blood_glucose": blood_glucose,
            "cholesterol": cholesterol,
            "smoking_status": smoking,
            "physical_activity": physical_activity,
            "diabetes_status": diabetes_status,
            "heart_disease": heart_disease,
            "stroke": stroke,
            "general_health": general_health,
            "risk_category": risk_category,
            "risk_score": risk_score,
            "is_synthetic": True,
            "dataset_source": "Synthea-CDC Demo Cohort",
            "created_at": base_date + datetime.timedelta(days=random.randint(1, 300))
        })

    return pd.DataFrame(records)

def seed_database_and_train_ml(db: Session, force_seed: bool = False):
    """
    Checks if database has patient records; if empty or force_seed=True,
    generates synthetic cohort, populates all 8 relational tables,
    and trains/evaluates the ML classifiers.
    """
    existing_count = db.query(Patient).count()
    if existing_count > 0 and not force_seed:
        # Check if ML models are trained
        if not ml_pipeline.is_trained:
            if not ml_pipeline.load_artifacts():
                # Load existing patients into DataFrame and train
                patients = db.query(Patient).all()
                df = pd.DataFrame([{
                    "age": p.age,
                    "bmi": p.bmi,
                    "blood_pressure_systolic": p.blood_pressure_systolic,
                    "blood_glucose": p.blood_glucose,
                    "cholesterol": p.cholesterol,
                    "smoking_status": p.smoking_status,
                    "physical_activity": p.physical_activity,
                    "heart_disease": p.heart_disease,
                    "stroke": p.stroke,
                    "risk_label": p.risk_category
                } for p in patients])
                ml_pipeline.train_models(df)
        return

    # Generate demographic and health dataset
    df_patients = generate_synthetic_healthcare_dataset(550)

    # Train ML models first
    ml_pipeline.train_models(df_patients)

    # Insert Patients
    now = datetime.datetime.utcnow()
    patient_models = []
    for _, row in df_patients.iterrows():
        p = Patient(
            patient_id=row["patient_id"],
            first_name=row["first_name"],
            last_name=row["last_name"],
            age=int(row["age"]),
            gender=row["gender"],
            bmi=float(row["bmi"]),
            blood_pressure_systolic=int(row["blood_pressure_systolic"]),
            blood_pressure_diastolic=int(row["blood_pressure_diastolic"]),
            blood_glucose=float(row["blood_glucose"]),
            cholesterol=int(row["cholesterol"]),
            smoking_status=row["smoking_status"],
            physical_activity=int(row["physical_activity"]),
            diabetes_status=int(row["diabetes_status"]),
            heart_disease=int(row["heart_disease"]),
            stroke=int(row["stroke"]),
            general_health=int(row["general_health"]),
            risk_category=row["risk_category"],
            risk_score=float(row["risk_score"]),
            is_synthetic=True,
            dataset_source=row["dataset_source"],
            created_at=row["created_at"]
        )
        patient_models.append(p)

    db.add_all(patient_models)
    db.commit()

    # Populate relational tables for a rich analytics experience
    # 1. Hospital Visits (Diabetes 130-US Hospitals style)
    visits = []
    labs = []
    meds = []
    vitals = []
    alerts = []

    for p in patient_models[:200]: # visits for subset of cohort
        # Number of visits depends on risk & diabetes status
        visit_count = 1 if p.risk_category == "Low Risk" and random.random() < 0.25 else (
            random.randint(1, 3) if p.risk_category == "Medium Risk" else random.randint(2, 5)
        )
        for v_idx in range(visit_count):
            admission_dt = p.created_at + datetime.timedelta(days=random.randint(10, 180))
            los = random.randint(1, 14)
            readmit = "NO" if p.risk_category != "High Risk" else random.choice(["NO", "<30", ">30"])
            diag = random.choice(DIAGNOSES) if p.diabetes_status == 1 else "Essential Hypertension"
            visits.append(HospitalVisit(
                patient_id=p.patient_id,
                admission_date=admission_dt,
                discharge_date=admission_dt + datetime.timedelta(days=los),
                admission_type=random.choice(["Emergency", "Urgent", "Elective", "Routine"]),
                length_of_stay=los,
                primary_diagnosis=diag,
                readmitted=readmit,
                total_cost=round(float(los * random.uniform(850, 2200)), 2),
                department=random.choice(DEPARTMENTS)
            ))

    # 2. Laboratory Results
    for p in patient_models[:300]:
        hba1c_val = round(float(np.random.normal(8.4, 1.2) if p.diabetes_status == 1 else np.random.normal(5.4, 0.4)), 1)
        labs.append(LaboratoryResult(
            patient_id=p.patient_id,
            test_name="HbA1c Glycated Hemoglobin",
            test_value=hba1c_val,
            unit="%",
            reference_range="4.0 - 5.6 %",
            is_abnormal=hba1c_val > 5.7,
            test_date=p.created_at + datetime.timedelta(days=15)
        ))
        labs.append(LaboratoryResult(
            patient_id=p.patient_id,
            test_name="Fasting Plasma Glucose",
            test_value=p.blood_glucose,
            unit="mg/dL",
            reference_range="70 - 99 mg/dL",
            is_abnormal=p.blood_glucose >= 100.0,
            test_date=p.created_at + datetime.timedelta(days=15)
        ))

    # 3. Medications
    for p in patient_models:
        if p.diabetes_status == 1 or p.risk_category in ("Medium Risk", "High Risk"):
            med_sample = random.sample(MEDICATIONS_LIST, k=random.randint(1, 3))
            for med_name, dos, freq in med_sample:
                meds.append(Medication(
                    patient_id=p.patient_id,
                    medication_name=med_name,
                    dosage=dos,
                    frequency=freq,
                    start_date=p.created_at,
                    status="Active"
                ))

    # 4. Patient Vitals (Simulated historical vitals)
    for p in patient_models[:50]:
        for tick in range(10):
            v_time = now - datetime.timedelta(minutes=(10 - tick) * 5)
            hr = int(np.random.normal(78, 9))
            sbp = p.blood_pressure_systolic + random.randint(-6, 8)
            dbp = p.blood_pressure_diastolic + random.randint(-4, 6)
            glucose = round(p.blood_glucose + random.uniform(-10, 15), 1)
            temp = round(float(np.random.normal(98.6, 0.4)), 1)
            v_status = "Normal"
            if hr > 115 or sbp >= 160 or glucose > 220:
                v_status = "Critical"
            elif hr > 100 or sbp >= 140 or glucose > 140:
                v_status = "Warning"

            vitals.append(PatientVital(
                patient_id=p.patient_id,
                heart_rate=hr,
                systolic_bp=sbp,
                diastolic_bp=dbp,
                blood_glucose=glucose,
                body_temperature=temp,
                oxygen_saturation=round(random.uniform(95.0, 99.5), 1),
                status=v_status,
                timestamp=v_time
            ))

    # 5. Monitoring Alerts
    for p in patient_models[:30]:
        if p.risk_category == "High Risk":
            alerts.append(MonitoringAlert(
                patient_id=p.patient_id,
                alert_type="Hypertensive Crisis Warning",
                severity="Critical",
                vital_name="Systolic BP",
                vital_value=float(p.blood_pressure_systolic + 15),
                threshold_exceeded="> 160 mmHg",
                message=f"Acute blood pressure spike of {p.blood_pressure_systolic + 15} mmHg detected.",
                timestamp=now - datetime.timedelta(minutes=random.randint(5, 120)),
                is_acknowledged=False
            ))
            alerts.append(MonitoringAlert(
                patient_id=p.patient_id,
                alert_type="Hyperglycemia Alert",
                severity="Warning",
                vital_name="Blood Glucose",
                vital_value=float(p.blood_glucose + 25),
                threshold_exceeded="> 180 mg/dL",
                message=f"Postprandial glycemic surge detected ({p.blood_glucose + 25:.1f} mg/dL).",
                timestamp=now - datetime.timedelta(minutes=random.randint(15, 300)),
                is_acknowledged=True
            ))

    db.add_all(visits)
    db.add_all(labs)
    db.add_all(meds)
    db.add_all(vitals)
    db.add_all(alerts)
    db.commit()

