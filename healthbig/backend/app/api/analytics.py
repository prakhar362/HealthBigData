from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/diabetes")
def get_diabetes_analytics(db: Session = Depends(get_db)):
    """
    Detailed disease analytics: prevalence by demographics, BMI distributions,
    glycemic analysis, blood pressure, cholesterol, smoking & activity correlations.
    """
    return AnalyticsService.get_disease_analytics(db)

@router.get("/demographics")
def get_demographics_analytics(db: Session = Depends(get_db)):
    """
    Returns demographic population distributions and age-stratified health metrics.
    """
    summary = AnalyticsService.get_dashboard_summary(db)
    return {
        "age_distribution": summary.get("age_distribution", []),
        "gender_distribution": summary.get("gender_distribution", []),
        "risk_distribution": summary.get("risk_distribution", []),
        "patient_health_trends": summary.get("patient_health_trends", [])
    }

@router.get("/hospital")
def get_hospital_analytics(db: Session = Depends(get_db)):
    """
    Hospital inpatient metrics: admissions, stay duration, readmissions,
    diagnostic departments, lab procedure statistics, and medications.
    """
    return AnalyticsService.get_hospital_analytics(db)

