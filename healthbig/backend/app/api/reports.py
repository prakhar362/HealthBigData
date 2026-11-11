from fastapi import APIRouter, Depends, Query, Response, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["Reports"])

AVAILABLE_REPORTS = [
    {
        "id": "patient",
        "title": "Patient Analytics Report",
        "description": "Full demographic breakdown, baseline vital metrics, and risk tier categorization.",
        "formats": ["csv", "pdf"]
    },
    {
        "id": "disease",
        "title": "Disease Analytics Report",
        "description": "Comprehensive diabetes prevalence analysis across age cohorts and lifestyle factors.",
        "formats": ["csv", "pdf"]
    },
    {
        "id": "risk",
        "title": "Patient Risk Report",
        "description": "Stratified risk classification summary, model confidence scores, and action guidance.",
        "formats": ["csv", "pdf"]
    },
    {
        "id": "hospital",
        "title": "Hospital Admissions Report",
        "description": "Inpatient admissions, length of stay distributions, departmental stats, and 30-day readmissions.",
        "formats": ["csv", "pdf"]
    },
    {
        "id": "quality",
        "title": "Data Quality Report",
        "description": "Completeness audit, missing value distributions, duplicate record counts, and schema verification.",
        "formats": ["csv", "pdf"]
    }
]

@router.get("")
def list_available_reports():
    """
    Returns list of exportable analytical reports and formats.
    """
    return AVAILABLE_REPORTS

@router.get("/download")
def download_report(
    report_type: str = Query(..., pattern="^(patient|disease|risk|hospital|quality)$"),
    format: str = Query("csv", pattern="^(csv|pdf)$"),
    db: Session = Depends(get_db)
):
    """
    Generates and downloads analytical report in CSV or PDF format.
    """
    if format == "csv":
        csv_data = ReportService.generate_csv_report(report_type, db)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=healthbig_{report_type}_report.csv"}
        )
    else:
        pdf_data = ReportService.generate_pdf_report(report_type, db)
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=healthbig_{report_type}_report.pdf"}
        )
