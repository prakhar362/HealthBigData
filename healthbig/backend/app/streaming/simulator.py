import time
import random
import threading
import datetime
from collections import deque
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.patient import Patient, PatientVital, MonitoringAlert

# Configurable illustrative thresholds
DEFAULT_THRESHOLDS = {
    "heart_rate": {"normal_min": 60, "normal_max": 100, "critical_min": 48, "critical_max": 125},
    "systolic_bp": {"normal_min": 95, "normal_max": 120, "critical_min": 85, "critical_max": 155},
    "diastolic_bp": {"normal_min": 60, "normal_max": 80, "critical_min": 50, "critical_max": 95},
    "blood_glucose": {"normal_min": 70.0, "normal_max": 130.0, "critical_min": 60.0, "critical_max": 200.0},
    "body_temperature": {"normal_min": 97.5, "normal_max": 99.2, "critical_min": 95.0, "critical_max": 101.5},
    "oxygen_saturation": {"normal_min": 95.0, "normal_max": 100.0, "critical_min": 90.0, "critical_max": 100.0}
}

class PatientVitalSimulator:
    def __init__(self, interval_seconds: float = 2.5):
        self.interval_seconds = interval_seconds
        self.is_running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self.thresholds = DEFAULT_THRESHOLDS.copy()
        # In-memory buffer: patient_id -> deque of readings
        self.recent_readings: Dict[str, deque] = {}
        self.global_recent_readings = deque(maxlen=200)
        self.active_patient_id: Optional[str] = None
        self.patient_baselines: Dict[str, Dict[str, float]] = {}

    def start(self, patient_id: Optional[str] = None):
        with self._lock:
            if patient_id:
                self.active_patient_id = patient_id
            if not self.is_running:
                self.is_running = True
                self._thread = threading.Thread(target=self._run_loop, daemon=True)
                self._thread.start()

    def stop(self):
        with self._lock:
            self.is_running = False

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "interval_seconds": self.interval_seconds,
            "active_patient_id": self.active_patient_id,
            "total_buffered_readings": len(self.global_recent_readings),
            "thresholds": self.thresholds
        }

    def _ensure_baselines(self, db: Session):
        if not self.patient_baselines:
            patients = db.query(Patient).limit(30).all()
            for p in patients:
                self.patient_baselines[p.patient_id] = {
                    "bmi": p.bmi,
                    "systolic": float(p.blood_pressure_systolic),
                    "diastolic": float(p.blood_pressure_diastolic),
                    "glucose": float(p.blood_glucose),
                    "risk_category": p.risk_category
                }

    def _evaluate_reading(self, reading: Dict[str, Any]) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Classifies status: Normal, Warning, Critical
        Returns (status, list_of_triggered_alerts)
        """
        status = "Normal"
        alerts = []

        # Heart Rate
        hr = reading["heart_rate"]
        th_hr = self.thresholds["heart_rate"]
        if hr > th_hr["critical_max"] or hr < th_hr["critical_min"]:
            status = "Critical"
            alerts.append({
                "alert_type": "Critical Tachycardia" if hr > th_hr["critical_max"] else "Critical Bradycardia",
                "severity": "Critical",
                "vital_name": "Heart Rate",
                "vital_value": float(hr),
                "threshold_exceeded": f"> {th_hr['critical_max']} bpm" if hr > th_hr["critical_max"] else f"< {th_hr['critical_min']} bpm",
                "message": f"Cardiac frequency reached {hr} bpm."
            })
        elif hr > th_hr["normal_max"] or hr < th_hr["normal_min"]:
            if status != "Critical":
                status = "Warning"

        # Systolic BP
        sbp = reading["systolic_bp"]
        th_sbp = self.thresholds["systolic_bp"]
        if sbp >= th_sbp["critical_max"]:
            status = "Critical"
            alerts.append({
                "alert_type": "Hypertensive Crisis Alert",
                "severity": "Critical",
                "vital_name": "Systolic BP",
                "vital_value": float(sbp),
                "threshold_exceeded": f">= {th_sbp['critical_max']} mmHg",
                "message": f"Arterial systolic pressure escalated to {sbp} mmHg."
            })
        elif sbp > th_sbp["normal_max"]:
            if status != "Critical":
                status = "Warning"

        # Blood Glucose
        bg = reading["blood_glucose"]
        th_bg = self.thresholds["blood_glucose"]
        if bg >= th_bg["critical_max"]:
            status = "Critical"
            alerts.append({
                "alert_type": "Severe Hyperglycemia",
                "severity": "Critical",
                "vital_name": "Blood Glucose",
                "vital_value": float(bg),
                "threshold_exceeded": f">= {th_bg['critical_max']} mg/dL",
                "message": f"Capillary glucose acute elevation to {bg:.1f} mg/dL."
            })
        elif bg < th_bg["critical_min"]:
            status = "Critical"
            alerts.append({
                "alert_type": "Severe Hypoglycemia",
                "severity": "Critical",
                "vital_name": "Blood Glucose",
                "vital_value": float(bg),
                "threshold_exceeded": f"< {th_bg['critical_min']} mg/dL",
                "message": f"Acute glycemic drop to {bg:.1f} mg/dL requires fast-acting carbohydrate."
            })
        elif bg > th_bg["normal_max"]:
            if status != "Critical":
                status = "Warning"

        # Body Temperature
        temp = reading["body_temperature"]
        th_temp = self.thresholds["body_temperature"]
        if temp >= th_temp["critical_max"]:
            status = "Critical"
            alerts.append({
                "alert_type": "High Hyperpyrexia",
                "severity": "Critical",
                "vital_name": "Temperature",
                "vital_value": float(temp),
                "threshold_exceeded": f">= {th_temp['critical_max']} °F",
                "message": f"Body temperature spiked to {temp:.1f} °F."
            })
        elif temp > th_temp["normal_max"]:
            if status != "Critical":
                status = "Warning"

        return status, alerts

    def _run_loop(self):
        while self.is_running:
            try:
                db = SessionLocal()
                self._ensure_baselines(db)

                # Determine which patients to simulate
                if self.active_patient_id and self.active_patient_id in self.patient_baselines:
                    target_pids = [self.active_patient_id]
                else:
                    # Choose 1 to 3 random patients from baselines
                    pids = list(self.patient_baselines.keys())
                    target_pids = random.sample(pids, min(2, len(pids))) if pids else []

                now = datetime.datetime.utcnow()

                for pid in target_pids:
                    base = self.patient_baselines[pid]
                    # Random physiological fluctuation
                    is_spike = random.random() < 0.12 # 12% probability of abnormal reading event

                    base_hr = 85 if base["risk_category"] == "High Risk" else 74
                    base_temp = 98.6

                    if is_spike:
                        # Induce temporary acute event
                        event_type = random.choice(["arrhythmia", "bp_surge", "glucose_spike", "fever"])
                        if event_type == "arrhythmia":
                            hr = random.choice([int(random.uniform(122, 142)), int(random.uniform(42, 47))])
                            sbp = int(base["systolic"] + random.uniform(-5, 10))
                            glucose = round(base["glucose"] + random.uniform(-10, 10), 1)
                            temp = round(base_temp + random.uniform(-0.3, 0.4), 1)
                        elif event_type == "bp_surge":
                            hr = int(base_hr + random.uniform(5, 18))
                            sbp = int(base["systolic"] + random.uniform(22, 38))
                            glucose = round(base["glucose"] + random.uniform(-5, 15), 1)
                            temp = round(base_temp + random.uniform(-0.2, 0.4), 1)
                        elif event_type == "glucose_spike":
                            hr = int(base_hr + random.uniform(4, 12))
                            sbp = int(base["systolic"] + random.uniform(-5, 8))
                            glucose = round(base["glucose"] + random.uniform(35, 75), 1)
                            temp = round(base_temp + random.uniform(-0.2, 0.3), 1)
                        else:
                            hr = int(base_hr + random.uniform(12, 25))
                            sbp = int(base["systolic"] + random.uniform(-4, 10))
                            glucose = round(base["glucose"] + random.uniform(-5, 10), 1)
                            temp = round(base_temp + random.uniform(2.2, 3.8), 1)
                    else:
                        hr = int(np.clip(np.random.normal(base_hr, 4), 58, 98))
                        sbp = int(np.clip(np.random.normal(base["systolic"], 4), 95, 138))
                        glucose = round(float(np.clip(np.random.normal(base["glucose"], 5), 75, 135)), 1)
                        temp = round(float(np.random.normal(base_temp, 0.2)), 1)

                    dbp = int(sbp * 0.65 + random.uniform(-2, 3))
                    o2 = round(random.uniform(96.0, 99.5), 1) if not is_spike else round(random.uniform(91.0, 95.0), 1)

                    raw_reading = {
                        "patient_id": pid,
                        "heart_rate": hr,
                        "systolic_bp": sbp,
                        "diastolic_bp": dbp,
                        "blood_glucose": glucose,
                        "body_temperature": temp,
                        "oxygen_saturation": o2,
                        "timestamp": now.isoformat() + "Z"
                    }

                    status, alerts = self._evaluate_reading(raw_reading)
                    raw_reading["status"] = status

                    # Update in-memory buffers
                    with self._lock:
                        if pid not in self.recent_readings:
                            self.recent_readings[pid] = deque(maxlen=60)
                        self.recent_readings[pid].append(raw_reading)
                        self.global_recent_readings.append(raw_reading)

                    # Persist vitals to database
                    vital_obj = PatientVital(
                        patient_id=pid,
                        heart_rate=hr,
                        systolic_bp=sbp,
                        diastolic_bp=dbp,
                        blood_glucose=glucose,
                        body_temperature=temp,
                        oxygen_saturation=o2,
                        status=status,
                        timestamp=now
                    )
                    db.add(vital_obj)

                    # Persist any generated alerts
                    for alert_data in alerts:
                        alert_obj = MonitoringAlert(
                            patient_id=pid,
                            alert_type=alert_data["alert_type"],
                            severity=alert_data["severity"],
                            vital_name=alert_data["vital_name"],
                            vital_value=alert_data["vital_value"],
                            threshold_exceeded=alert_data["threshold_exceeded"],
                            message=alert_data["message"],
                            timestamp=now,
                            is_acknowledged=False
                        )
                        db.add(alert_obj)

                db.commit()
            except Exception as e:
                try:
                    db.rollback()
                except Exception:
                    pass
            finally:
                try:
                    db.close()
                except Exception:
                    pass

            time.sleep(self.interval_seconds)

    def get_latest_readings(self, patient_id: Optional[str] = None, limit: int = 30) -> List[Dict[str, Any]]:
        with self._lock:
            if patient_id and patient_id in self.recent_readings:
                items = list(self.recent_readings[patient_id])
                return items[-limit:]
            items = list(self.global_recent_readings)
            return items[-limit:]

simulator = PatientVitalSimulator(interval_seconds=2.5)
