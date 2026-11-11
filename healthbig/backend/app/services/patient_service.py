import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.models.patient import (
    Patient,
    PatientHealthRecord,
    HospitalVisit,
    LaboratoryResult,
    Medication,
    PatientVital
)
from app.schemas.patient import PatientCreate, PatientUpdate
from app.ml.pipeline import ml_pipeline

class PatientService:
    @staticmethod
    def get_patients(
        db: Session,
        page: int = 1,
        page_size: int = 15,
        search: Optional[str] = None,
        gender: Optional[str] = None,
        risk_category: Optional[str] = None,
        diabetes_status: Optional[int] = None,
        min_age: Optional[int] = None,
        max_age: Optional[int] = None,
        sort_by: str = "id",
        sort_order: str = "asc"
    ) -> Dict[str, Any]:
        query = db.query(Patient)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Patient.patient_id.ilike(search_term),
                    Patient.first_name.ilike(search_term),
                    Patient.last_name.ilike(search_term)
                )
            )

        if gender:
            query = query.filter(Patient.gender == gender)

        if risk_category:
            query = query.filter(Patient.risk_category == risk_category)

        if diabetes_status is not None:
            query = query.filter(Patient.diabetes_status == diabetes_status)

        if min_age is not None:
            query = query.filter(Patient.age >= min_age)

        if max_age is not None:
            query = query.filter(Patient.age <= max_age)

        # Sorting
        sort_by_name = sort_by if isinstance(sort_by, str) else "id"
        sort_order_name = sort_order if isinstance(sort_order, str) else "asc"
        sort_column = getattr(Patient, sort_by_name, Patient.id)
        if sort_order_name.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        total = query.count()
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        offset = (page - 1) * page_size
        patients = query.offset(offset).limit(page_size).all()

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "patients": patients
        }

    @staticmethod
    def get_patient_by_id(db: Session, patient_id: str) -> Optional[Patient]:
        return db.query(Patient).filter(Patient.patient_id == patient_id).first()

    @staticmethod
    def create_patient(db: Session, data: PatientCreate) -> Patient:
        # Determine patient_id if not provided
        if not data.patient_id:
            max_p = db.query(Patient).order_by(desc(Patient.id)).first()
            next_num = (max_p.id + 10001) if max_p else 10001
            patient_id = f"PT-{next_num}"
        else:
            patient_id = data.patient_id

        # Predict initial risk using trained ML pipeline
        pred = ml_pipeline.predict_risk({
            "age": data.age,
            "bmi": data.bmi,
            "blood_glucose": data.blood_glucose,
            "blood_pressure_systolic": data.blood_pressure_systolic,
            "cholesterol": data.cholesterol,
            "smoking_status": data.smoking_status,
            "physical_activity": data.physical_activity,
            "heart_disease": data.heart_disease,
            "stroke": data.stroke
        })

        new_patient = Patient(
            patient_id=patient_id,
            first_name=data.first_name,
            last_name=data.last_name,
            age=data.age,
            gender=data.gender,
            bmi=data.bmi,
            blood_pressure_systolic=data.blood_pressure_systolic,
            blood_pressure_diastolic=data.blood_pressure_diastolic,
            blood_glucose=data.blood_glucose,
            cholesterol=data.cholesterol,
            smoking_status=data.smoking_status,
            physical_activity=data.physical_activity,
            diabetes_status=data.diabetes_status,
            heart_disease=data.heart_disease,
            stroke=data.stroke,
            general_health=data.general_health,
            risk_category=pred["predicted_risk_category"],
            risk_score=pred["risk_score"],
            is_synthetic=True,
            dataset_source=data.dataset_source or "User-Synthetic-Entry"
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)

        # Create initial health record
        record = PatientHealthRecord(
            patient_id=new_patient.patient_id,
            bmi=new_patient.bmi,
            systolic_bp=new_patient.blood_pressure_systolic,
            diastolic_bp=new_patient.blood_pressure_diastolic,
            fasting_glucose=new_patient.blood_glucose,
            notes="Initial intake clinical record"
        )
        db.add(record)
        db.commit()

        return new_patient

    @staticmethod
    def update_patient(db: Session, patient_id: str, data: PatientUpdate) -> Optional[Patient]:
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        if not patient:
            return None

        update_dict = data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(patient, key, value)

        patient.updated_at = datetime.datetime.utcnow()

        # Recalculate ML risk if relevant metrics changed
        pred = ml_pipeline.predict_risk({
            "age": patient.age,
            "bmi": patient.bmi,
            "blood_glucose": patient.blood_glucose,
            "blood_pressure_systolic": patient.blood_pressure_systolic,
            "cholesterol": patient.cholesterol,
            "smoking_status": patient.smoking_status,
            "physical_activity": patient.physical_activity,
            "heart_disease": patient.heart_disease,
            "stroke": patient.stroke
        })
        patient.risk_category = pred["predicted_risk_category"]
        patient.risk_score = pred["risk_score"]

        db.commit()
        db.refresh(patient)
        return patient

    @staticmethod
    def delete_patient(db: Session, patient_id: str) -> bool:
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        if not patient:
            return False
        db.delete(patient)
        db.commit()
        return True

    @staticmethod
    def get_patient_history(db: Session, patient_id: str) -> Dict[str, Any]:
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        if not patient:
            return {}

        records = db.query(PatientHealthRecord).filter(
            PatientHealthRecord.patient_id == patient_id
        ).order_by(desc(PatientHealthRecord.record_date)).all()

        visits = db.query(HospitalVisit).filter(
            HospitalVisit.patient_id == patient_id
        ).order_by(desc(HospitalVisit.admission_date)).all()

        labs = db.query(LaboratoryResult).filter(
            LaboratoryResult.patient_id == patient_id
        ).order_by(desc(LaboratoryResult.test_date)).all()

        meds = db.query(Medication).filter(
            Medication.patient_id == patient_id
        ).order_by(desc(Medication.start_date)).all()

        vitals = db.query(PatientVital).filter(
            PatientVital.patient_id == patient_id
        ).order_by(desc(PatientVital.timestamp)).limit(20).all()

        return {
            "patient": patient,
            "records": records,
            "visits": visits,
            "labs": labs,
            "medications": meds,
            "vitals": vitals
        }
