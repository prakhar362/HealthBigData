from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns high-level KPI cards, demographic distributions,
    disease prevalence, monthly admissions, and recent alerts.
    """
    return AnalyticsService.get_dashboard_summary(db)

