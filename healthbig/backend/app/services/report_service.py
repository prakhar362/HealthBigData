import io
import csv
import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.patient import (
    Patient,
    HospitalVisit,
    UploadedDataset,
    MonitoringAlert
)

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class ReportService:
    @staticmethod
    def generate_csv_report(report_type: str, db: Session) -> str:
        output = io.StringIO()
        writer = csv.writer(output)

        if report_type == "patient":
            writer.writerow([
                "Patient ID", "First Name", "Last Name", "Age", "Gender",
                "BMI", "Systolic BP", "Diastolic BP", "Glucose", "Cholesterol",
                "Smoking Status", "Physical Activity", "Diabetes Status", "Risk Category", "Risk Score"
            ])
            patients = db.query(Patient).all()
            for p in patients:
                writer.writerow([
                    p.patient_id, p.first_name, p.last_name, p.age, p.gender,
                    p.bmi, p.blood_pressure_systolic, p.blood_pressure_diastolic,
                    p.blood_glucose, p.cholesterol, p.smoking_status,
                    p.physical_activity, p.diabetes_status, p.risk_category, p.risk_score
                ])

        elif report_type == "hospital":
            writer.writerow([
                "Visit ID", "Patient ID", "Admission Date", "Discharge Date",
                "Admission Type", "Length of Stay (Days)", "Primary Diagnosis",
                "Readmission Status", "Total Cost ($)", "Department"
            ])
            visits = db.query(HospitalVisit).all()
            for v in visits:
                writer.writerow([
                    v.id, v.patient_id, v.admission_date.strftime("%Y-%m-%d"),
                    v.discharge_date.strftime("%Y-%m-%d") if v.discharge_date else "N/A",
                    v.admission_type, v.length_of_stay, v.primary_diagnosis,
                    v.readmitted, v.total_cost, v.department
                ])

        elif report_type == "disease":
            writer.writerow(["Metric", "Cohort Total", "Diabetes Positive", "Prevalence %"])
            total = db.query(Patient).count()
            diab = db.query(Patient).filter(Patient.diabetes_status == 1).count()
            rate = round((diab / total * 100), 1) if total > 0 else 0.0
            writer.writerow(["Overall Cohort", total, diab, f"{rate}%"])

            # By Gender
            for g in ["Male", "Female"]:
                sub = db.query(Patient).filter(Patient.gender == g)
                st = sub.count()
                sp = sub.filter(Patient.diabetes_status == 1).count()
                writer.writerow([f"Gender: {g}", st, sp, f"{round(sp/st*100, 1) if st>0 else 0}%"])

        elif report_type == "risk":
            writer.writerow(["Patient ID", "Age", "BMI", "Systolic BP", "Glucose", "Risk Category", "Risk Score", "Clinical Guidance"])
            patients = db.query(Patient).order_by(Patient.risk_score.desc()).limit(150).all()
            for p in patients:
                guidance = "Lifestyle Counseling" if p.risk_category == "Low Risk" else (
                    "Routine Glycemic Follow-up" if p.risk_category == "Medium Risk" else "Urgent Specialist Consultation"
                )
                writer.writerow([p.patient_id, p.age, p.bmi, p.blood_pressure_systolic, p.blood_glucose, p.risk_category, p.risk_score, guidance])

        else: # data quality
            writer.writerow(["Dataset ID", "File Name", "Type", "Format", "Record Count", "Columns", "Duplicates", "Upload Date"])
            datasets = db.query(UploadedDataset).all()
            for ds in datasets:
                writer.writerow([ds.id, ds.file_name, ds.dataset_type, ds.file_format, ds.record_count, ds.column_count, ds.duplicate_count, ds.upload_date.strftime("%Y-%m-%d")])

        return output.getvalue()

    @staticmethod
    def generate_pdf_report(report_type: str, db: Session) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=14
        )
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Italic'],
            fontSize=8,
            textColor=colors.HexColor('#94a3b8'),
            spaceBefore=14
        )

        title_map = {
            "patient": "Patient Cohort Analytics Report",
            "disease": "Disease & Diabetic Prevalence Report",
            "risk": "Stratified Patient Risk Assessment Report",
            "hospital": "Hospital Admissions & Utilization Report",
            "quality": "Dataset Quality & Audit Summary Report"
        }

        report_title = title_map.get(report_type, "HealthBig Analytics Report")
        elements.append(Paragraph(f"HealthBig – {report_title}", title_style))
        elements.append(Paragraph(f"Generated: {datetime.datetime.now().strftime('%B %d, %Y %H:%M:%S UTC')} | Big Data Healthcare Analytics", subtitle_style))
        elements.append(Spacer(1, 10))

        # Build table based on type
        if report_type == "patient":
            data = [["Patient ID", "Name", "Age", "Gender", "BMI", "Systolic", "Glucose", "Risk Tier"]]
            patients = db.query(Patient).limit(25).all()
            for p in patients:
                data.append([
                    p.patient_id, f"{p.first_name} {p.last_name}", str(p.age),
                    p.gender, f"{p.bmi:.1f}", str(p.blood_pressure_systolic),
                    f"{p.blood_glucose:.1f}", p.risk_category
                ])

        elif report_type == "hospital":
            data = [["Visit ID", "Patient ID", "Date", "Type", "LOS (Days)", "Diagnosis", "Readmit"]]
            visits = db.query(HospitalVisit).limit(25).all()
            for v in visits:
                data.append([
                    str(v.id), v.patient_id, v.admission_date.strftime("%Y-%m-%d"),
                    v.admission_type, str(v.length_of_stay),
                    v.primary_diagnosis[:24] + "...", v.readmitted
                ])

        elif report_type == "risk":
            data = [["Patient ID", "Age", "BMI", "Systolic", "Glucose", "Risk Score", "Category"]]
            patients = db.query(Patient).order_by(Patient.risk_score.desc()).limit(25).all()
            for p in patients:
                data.append([
                    p.patient_id, str(p.age), f"{p.bmi:.1f}",
                    str(p.blood_pressure_systolic), f"{p.blood_glucose:.1f}",
                    f"{p.risk_score:.3f}", p.risk_category
                ])

        else: # summary
            total = db.query(Patient).count()
            diab = db.query(Patient).filter(Patient.diabetes_status == 1).count()
            visits_cnt = db.query(HospitalVisit).count()
            alerts_cnt = db.query(MonitoringAlert).count()
            data = [
                ["Analytics Metric", "Value", "Notes"],
                ["Total Patients Logged", str(total), "Enrolled Cohort Records"],
                ["Diabetes Prevalence", f"{diab} ({round(diab/total*100, 1) if total>0 else 0}%)", "CDC / Synthea Distribution"],
                ["Total Hospital Admissions", str(visits_cnt), "Diabetes 130-US Encounter Model"],
                ["Total Monitoring Telemetry Alerts", str(alerts_cnt), "Abnormal Threshold Triggers"]
            ]

        t = Table(data, hAlign='LEFT')
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('TOPPADDING', (0, 1), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ]))
        elements.append(t)

        elements.append(Spacer(1, 15))
        elements.append(Paragraph(
            "DISCLAIMER: This document is an academic analytics report generated by HealthBig "
            "for Big Data demonstration purposes only. It does not provide medical diagnoses.",
            disclaimer_style
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

