import os
import io
import json
import logging
import pandas as pd
from typing import Dict, Any, List
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.patient import UploadedDataset, Patient
from app.ml.pipeline import ml_pipeline

logger = logging.getLogger("healthbig.datasets")

class DatasetService:
    @staticmethod
    async def process_and_save_upload(
        file: UploadFile,
        dataset_type: str,
        db: Session,
        import_records: bool = False
    ) -> Dict[str, Any]:
        content = await file.read()
        file_size = len(content)
        file_name = file.filename or "uploaded_dataset"
        file_ext = os.path.splitext(file_name)[1].lower()

        # Parse CSV or JSON using Pandas
        try:
            if file_ext == ".json":
                df = pd.read_json(io.BytesIO(content))
                file_format = "JSON"
            else:
                df = pd.read_csv(io.BytesIO(content))
                file_format = "CSV"
        except Exception as e:
            raise ValueError(f"Could not parse file as {file_ext.upper()}: {str(e)}")

        record_count = len(df)
        column_count = len(df.columns)

        # Inferred column names and data types
        columns_info = [
            {"name": col, "dtype": str(df[col].dtype), "sample": str(df[col].dropna().iloc[0]) if len(df[col].dropna()) > 0 else "N/A"}
            for col in df.columns
        ]

        # Missing values analysis
        missing_dict = df.isnull().sum().to_dict()
        missing_clean = {k: int(v) for k, v in missing_dict.items()}

        # Duplicate records
        duplicate_count = int(df.duplicated().sum())

        # Sample preview (first 20 rows)
        preview_df = df.head(20).fillna("")
        sample_preview = preview_df.to_dict(orient="records")

        # Detect or refine dataset type
        cols_lower = [c.lower() for c in df.columns]
        if "diabetes_binary" in cols_lower or "highbp" in cols_lower:
            detected_type = "CDC Diabetes Health Indicators"
        elif "time_in_hospital" in cols_lower or "num_lab_procedures" in cols_lower:
            detected_type = "Diabetes 130-US Hospitals"
        elif "first_name" in cols_lower or "patient_id" in cols_lower:
            detected_type = "Synthea Healthcare Data"
        else:
            detected_type = dataset_type or "Custom Healthcare Dataset"

        # Persist dataset metadata to uploaded_datasets table
        dataset_obj = UploadedDataset(
            file_name=file_name,
            dataset_type=detected_type,
            file_format=file_format,
            file_size_bytes=file_size,
            record_count=record_count,
            column_count=column_count,
            columns=json.dumps(columns_info),
            missing_values=json.dumps(missing_clean),
            duplicate_count=duplicate_count,
            sample_preview=json.dumps(sample_preview)
        )
        db.add(dataset_obj)
        db.commit()
        db.refresh(dataset_obj)

        # Retrain ML model if dataset contains relevant predictive features
        if any(c in df.columns for c in ["age", "bmi", "blood_glucose", "blood_pressure_systolic"]):
            try:
                ml_pipeline.train_models(df)
            except Exception as ml_err:
                logger.warning(f"Could not auto-train ML on uploaded dataset: {ml_err}")

        return {
            "id": dataset_obj.id,
            "file_name": file_name,
            "dataset_type": detected_type,
            "file_format": file_format,
            "file_size_bytes": file_size,
            "record_count": record_count,
            "column_count": column_count,
            "columns": columns_info,
            "missing_values": missing_clean,
            "duplicate_count": duplicate_count,
            "sample_preview": sample_preview,
            "upload_date": dataset_obj.upload_date
        }

    @staticmethod
    def get_all_datasets(db: Session) -> List[Dict[str, Any]]:
        datasets = db.query(UploadedDataset).order_by(UploadedDataset.upload_date.desc()).all()
        results = []
        for ds in datasets:
            try:
                cols = json.loads(ds.columns)
            except Exception:
                cols = []
            try:
                missing = json.loads(ds.missing_values)
            except Exception:
                missing = {}
            try:
                preview = json.loads(ds.sample_preview)
            except Exception:
                preview = []

            results.append({
                "id": ds.id,
                "file_name": ds.file_name,
                "dataset_type": ds.dataset_type,
                "file_format": ds.file_format,
                "file_size_bytes": ds.file_size_bytes,
                "record_count": ds.record_count,
                "column_count": ds.column_count,
                "columns": cols,
                "missing_values": missing,
                "duplicate_count": ds.duplicate_count,
                "sample_preview": preview,
                "upload_date": ds.upload_date
            })
        return results

    @staticmethod
    def get_dataset_by_id(db: Session, ds_id: int) -> Dict[str, Any]:
        ds = db.query(UploadedDataset).filter(UploadedDataset.id == ds_id).first()
        if not ds:
            return {}
        return {
            "id": ds.id,
            "file_name": ds.file_name,
            "dataset_type": ds.dataset_type,
            "file_format": ds.file_format,
            "file_size_bytes": ds.file_size_bytes,
            "record_count": ds.record_count,
            "column_count": ds.column_count,
            "columns": json.loads(ds.columns),
            "missing_values": json.loads(ds.missing_values),
            "duplicate_count": ds.duplicate_count,
            "sample_preview": json.loads(ds.sample_preview),
            "upload_date": ds.upload_date
        }

