from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/api/datasets", tags=["Data Management"])

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = Form("CDC Diabetes"),
    import_records: bool = Form(False),
    db: Session = Depends(get_db)
):
    """
    Accepts CSV or JSON healthcare dataset, inspects schema,
    audits missing values/duplicates, generates preview, and saves record.
    """
    if not (file.filename.endswith(".csv") or file.filename.endswith(".json")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a .csv or .json healthcare file."
        )

    try:
        result = await DatasetService.process_and_save_upload(
            file=file,
            dataset_type=dataset_type,
            db=db,
            import_records=import_records
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Data processing error: {str(e)}"
        )

@router.get("")
def get_datasets(db: Session = Depends(get_db)):
    """
    List all uploaded healthcare datasets and quality metrics.
    """
    return DatasetService.get_all_datasets(db)

@router.get("/{dataset_id}")
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """
    Get full metadata and 20-row preview for specific dataset.
    """
    ds = DatasetService.get_dataset_by_id(db, dataset_id)
    if not ds:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found."
        )
    return ds

