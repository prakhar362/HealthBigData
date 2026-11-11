from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.ml.pipeline import ml_pipeline
from app.schemas.patient import (
    RiskPredictionRequest,
    RiskPredictionResponse,
    ModelMetricsResponse
)
from app.models.patient import RiskPrediction, Patient
import json
import datetime

router = APIRouter(prefix="/api/prediction", tags=["Machine Learning Prediction"])

@router.post("/patient-risk", response_model=RiskPredictionResponse)
def predict_patient_risk(data: RiskPredictionRequest, db: Session = Depends(get_db)):
    """
    Evaluates patient risk using the specified Scikit-learn model
    (Logistic Regression, Decision Tree, Random Forest) and records prediction audit.
    """
    # If patient_id was supplied, we can auto-fill missing attributes if necessary
    patient_dict = data.dict()
    if data.patient_id:
        p = db.query(Patient).filter(Patient.patient_id == data.patient_id).first()
        if p and not data.age:
            patient_dict["age"] = p.age
            patient_dict["bmi"] = p.bmi
            patient_dict["blood_glucose"] = p.blood_glucose
            patient_dict["blood_pressure_systolic"] = p.blood_pressure_systolic
            patient_dict["cholesterol"] = p.cholesterol

    result = ml_pipeline.predict_risk(patient_dict, model_name=data.model_name or "Random Forest")

    # Save prediction audit log to database
    try:
        prediction_record = RiskPrediction(
            patient_id=data.patient_id,
            model_used=result["model_used"],
            predicted_category=result["predicted_risk_category"],
            probability_score=result["risk_score"],
            input_features=json.dumps(patient_dict),
            contributing_factors=json.dumps(result["contributing_factors"]),
            prediction_date=datetime.datetime.utcnow()
        )
        db.add(prediction_record)
        db.commit()
    except Exception as e:
        db.rollback()

    return result

@router.get("/model-metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    """
    Returns comparative evaluation metrics (accuracy, precision, recall, F1,
    confusion matrix) for Logistic Regression, Decision Tree, and Random Forest.
    """
    if not ml_pipeline.is_trained:
        ml_pipeline.load_artifacts()

    return ml_pipeline.get_evaluation_summary()

@router.post("/train")
def retrain_models(db: Session = Depends(get_db)):
    """
    Triggers retraining of all 3 classification algorithms on current database cohort.
    """
    import pandas as pd
    patients = db.query(Patient).all()
    if not patients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot train ML models: database has no patient records."
        )

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

    metrics = ml_pipeline.train_models(df)
    return {"message": "Models successfully retrained and persisted.", "summary": metrics}

