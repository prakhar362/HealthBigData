from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.streaming.simulator import simulator
from app.models.patient import MonitoringAlert

router = APIRouter(prefix="/api/monitoring", tags=["Real-Time Monitoring"])

@router.get("/latest")
def get_latest_vitals(
    patient_id: Optional[str] = None,
    limit: int = Query(25, ge=1, le=100)
):
    """
    Returns latest live vital readings produced by backend simulator stream.
    """
    readings = simulator.get_latest_readings(patient_id=patient_id, limit=limit)
    return readings

@router.get("/alerts")
def get_monitoring_alerts(
    limit: int = Query(20, ge=1, le=100),
    unacknowledged_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Returns historical and live abnormal readings and alerts.
    """
    query = db.query(MonitoringAlert)
    if unacknowledged_only:
        query = query.filter(MonitoringAlert.is_acknowledged == False)
    alerts = query.order_by(desc(MonitoringAlert.timestamp)).limit(limit).all()
    return alerts

@router.post("/start")
def start_monitoring(patient_id: Optional[str] = None):
    """
    Starts simulated live vitals streaming every 2-3 seconds.
    """
    simulator.start(patient_id=patient_id)
    return {
        "status": "started",
        "message": f"Real-time vital simulator is active (streaming every {simulator.interval_seconds}s).",
        "active_patient_id": simulator.active_patient_id
    }

@router.post("/stop")
def stop_monitoring():
    """
    Stops the background vital simulator loop.
    """
    simulator.stop()
    return {"status": "stopped", "message": "Real-time vital simulator paused."}

@router.get("/status")
def get_monitoring_status():
    """
    Returns simulator engine running status, active target patient, and buffer counts.
    """
    return simulator.get_status()

@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    """
    Marks an alert as reviewed/acknowledged.
    """
    alert = db.query(MonitoringAlert).filter(MonitoringAlert.id == alert_id).first()
    if alert:
        alert.is_acknowledged = True
        db.commit()
        return {"status": "success", "message": f"Alert {alert_id} acknowledged."}
    return {"status": "error", "message": "Alert not found."}

