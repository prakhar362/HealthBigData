from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.patient_service import PatientService
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse
)

router = APIRouter(prefix="/api/patients", tags=["Patients"])

@router.get("", response_model=PatientListResponse)
def get_patients(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    search: Optional[str] = None,
    gender: Optional[str] = None,
    risk_category: Optional[str] = None,
    diabetes_status: Optional[int] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    sort_by: str = "id",
    sort_order: str = "asc",
    db: Session = Depends(get_db)
):
    """
    Search, filter, paginate and sort patient records.
    """
    return PatientService.get_patients(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        gender=gender,
        risk_category=risk_category,
        diabetes_status=diabetes_status,
        min_age=min_age,
        max_age=max_age,
        sort_by=sort_by,
        sort_order=sort_order
    )

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient_by_id(patient_id: str, db: Session = Depends(get_db)):
    """
    Retrieve single patient profile by Patient ID.
    """
    patient = PatientService.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )
    return patient

@router.get("/{patient_id}/history")
def get_patient_history(patient_id: str, db: Session = Depends(get_db)):
    """
    Retrieve full longitudinal history: visits, lab tests, medications, vitals.
    """
    history = PatientService.get_patient_history(db, patient_id)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient history for '{patient_id}' not found."
        )
    return history

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    """
    Add a new synthetic patient record and automatically assess baseline risk.
    """
    return PatientService.create_patient(db, data)

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: str, data: PatientUpdate, db: Session = Depends(get_db)):
    """
    Update clinical markers for an existing patient.
    """
    updated = PatientService.update_patient(db, patient_id, data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )
    return updated

@router.delete("/{patient_id}", status_code=status.HTTP_200_OK)
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    """
    Delete patient and associated relational records.
    """
    success = PatientService.delete_patient(db, patient_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )
    return {"message": f"Patient '{patient_id}' deleted successfully."}
