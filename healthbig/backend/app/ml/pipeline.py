import os
import json
import logging
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

logger = logging.getLogger("healthbig.ml")

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "trained_models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_COLS = [
    "age",
    "bmi",
    "blood_pressure_systolic",
    "blood_glucose",
    "cholesterol",
    "smoking_numeric",
    "physical_activity",
    "heart_disease",
    "stroke"
]

RISK_CLASSES = ["Low Risk", "Medium Risk", "High Risk"]

TARGET_DEFINITION = (
    "Comprehensive Metabolic & Cardiovascular Risk Level (Low, Medium, High), "
    "quantified from clinical glycemic metrics, arterial pressure, body mass index, "
    "and documented vascular risk factors. Academic decision-support demonstration."
)

CLINICAL_DISCLAIMER = (
    "NOTICE: This risk prediction tool is an educational and academic decision-support "
    "demonstration created for Big Data Analytics research. It does NOT constitute medical "
    "advice, clinical diagnosis, or prescriptive clinical guidance. Consult a licensed "
    "healthcare provider for clinical evaluation."
)

class HealthcareMLPipeline:
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.metrics = {}
        self.best_model_name = "Random Forest"
        self.feature_names = FEATURE_COLS
        self.feature_importances = {}
        self.is_trained = False

    def _encode_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        df_clean = df.copy()
        
        # Ensure smoking numeric mapping
        if "smoking_numeric" not in df_clean.columns:
            if "smoking_status" in df_clean.columns:
                smoking_map = {
                    "Non-smoker": 0,
                    "Never": 0,
                    "Former smoker": 1,
                    "Former": 1,
                    "Current smoker": 2,
                    "Current": 2,
                    "Everyday": 2,
                    "Someday": 1
                }
                df_clean["smoking_numeric"] = df_clean["smoking_status"].map(smoking_map).fillna(0).astype(int)
            else:
                df_clean["smoking_numeric"] = 0

        # Fill any missing values
        for col in FEATURE_COLS:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce")
                median_val = df_clean[col].median()
                df_clean[col] = df_clean[col].fillna(median_val if not pd.isna(median_val) else 0)
            else:
                df_clean[col] = 0

        return df_clean

    def _derive_target_if_missing(self, df: pd.DataFrame) -> pd.Series:
        """
        Derives an academic target risk tier (0=Low, 1=Medium, 2=High)
        based on established composite risk scores without clinical diagnostic claims.
        """
        if "risk_label" in df.columns:
            # If explicit label exists
            mapping = {"Low Risk": 0, "Medium Risk": 1, "High Risk": 2, 0: 0, 1: 1, 2: 2}
            return df["risk_label"].map(mapping).fillna(0).astype(int)

        # Composite metabolic index
        glucose_points = np.where(df["blood_glucose"] >= 140, 2, np.where(df["blood_glucose"] >= 100, 1, 0))
        bp_points = np.where(df["blood_pressure_systolic"] >= 140, 2, np.where(df["blood_pressure_systolic"] >= 125, 1, 0))
        bmi_points = np.where(df["bmi"] >= 30.0, 2, np.where(df["bmi"] >= 25.0, 1, 0))
        age_points = np.where(df["age"] >= 60, 2, np.where(df["age"] >= 45, 1, 0))
        disease_points = (df["heart_disease"] * 2) + (df["stroke"] * 2)
        smoking_points = df["smoking_numeric"]
        activity_discount = np.where(df["physical_activity"] == 1, -1, 1)

        raw_score = (
            glucose_points + bp_points + bmi_points + age_points + 
            disease_points + smoking_points + activity_discount
        )

        # Categorize into Low (0), Medium (1), High (2)
        target = np.where(raw_score <= 3, 0, np.where(raw_score <= 6, 1, 2))
        return pd.Series(target, index=df.index, dtype=int)

    def train_models(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Full Scikit-learn training pipeline:
        1. Encodes features
        2. Derives transparent academic target
        3. Scales features
        4. Trains Logistic Regression, Decision Tree, Random Forest
        5. Computes Accuracy, Precision, Recall, F1, Confusion Matrix
        6. Saves best model and artifacts
        """
        logger.info(f"Initiating ML pipeline on dataset with {len(df)} records.")
        df_encoded = self._encode_dataframe(df)
        X = df_encoded[FEATURE_COLS].values
        y = self._derive_target_if_missing(df_encoded).values

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )

        # Fit Scaler
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # 1. Logistic Regression
        lr = LogisticRegression(max_iter=1000, random_state=42)
        lr.fit(X_train_scaled, y_train)

        # 2. Decision Tree
        dt = DecisionTreeClassifier(max_depth=6, min_samples_split=8, random_state=42)
        dt.fit(X_train, y_train)

        # 3. Random Forest
        rf = RandomForestClassifier(n_estimators=100, max_depth=8, min_samples_split=6, random_state=42)
        rf.fit(X_train, y_train)

        models = {
            "Logistic Regression": (lr, True),
            "Decision Tree": (dt, False),
            "Random Forest": (rf, False)
        }

        self.models = {k: v[0] for k, v in models.items()}
        self.metrics = {}
        best_f1 = -1.0

        for name, (model, requires_scale) in models.items():
            test_x = X_test_scaled if requires_scale else X_test
            y_pred = model.predict(test_x)

            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
            rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
            f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
            cm = confusion_matrix(y_test, y_pred).tolist()

            self.metrics[name] = {
                "model_name": name,
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "confusion_matrix": cm,
                "class_names": RISK_CLASSES
            }

            if f1 > best_f1:
                best_f1 = f1
                self.best_model_name = name

        # Calculate feature importances from Random Forest
        importances = rf.feature_importances_
        self.feature_importances = {
            col: round(float(imp), 4)
            for col, imp in zip(FEATURE_COLS, importances)
        }

        self.is_trained = True
        self.save_artifacts()

        logger.info(f"Model training complete. Best model: {self.best_model_name} (F1: {best_f1:.4f})")
        return self.get_evaluation_summary()

    def predict_risk(self, patient_data: Dict[str, Any], model_name: str = "Random Forest") -> Dict[str, Any]:
        """
        Runs inference on single patient data with contributing factors.
        """
        if not self.is_trained:
            self.load_artifacts()

        model_key = model_name if model_name in self.models else self.best_model_name
        model = self.models.get(model_key)
        if not model:
            # Fallback
            model = list(self.models.values())[0] if self.models else None

        # Build feature vector
        smoking_val = patient_data.get("smoking_status", "Non-smoker")
        smoking_map = {"Non-smoker": 0, "Former smoker": 1, "Current smoker": 2}
        smoking_num = smoking_map.get(smoking_val, 0)

        raw_features = [
            float(patient_data.get("age", 45)),
            float(patient_data.get("bmi", 26.5)),
            float(patient_data.get("blood_pressure_systolic", 120)),
            float(patient_data.get("blood_glucose", 100.0)),
            float(patient_data.get("cholesterol", 190)),
            float(smoking_num),
            float(patient_data.get("physical_activity", 1)),
            float(patient_data.get("heart_disease", 0)),
            float(patient_data.get("stroke", 0)),
        ]

        feat_array = np.array([raw_features])
        if model_key == "Logistic Regression":
            feat_array = self.scaler.transform(feat_array)

        # Probabilities
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(feat_array)[0]
            pred_class_idx = int(np.argmax(probs))
            confidence = float(np.max(probs))
            risk_score = float((probs[1] * 0.5) + (probs[2] * 1.0))
        else:
            pred_class_idx = int(model.predict(feat_array)[0])
            confidence = 0.85
            risk_score = float(pred_class_idx / 2.0)

        predicted_category = RISK_CLASSES[min(pred_class_idx, len(RISK_CLASSES) - 1)]

        # Determine contributing factors
        contributing_factors = []
        bg = patient_data.get("blood_glucose", 100)
        if bg >= 140:
            contributing_factors.append({
                "feature": "Blood Glucose",
                "impact": "High",
                "value": f"{bg} mg/dL",
                "description": "Significantly elevated glycemic marker indicative of hyperglycemia"
            })
        elif bg >= 110:
            contributing_factors.append({
                "feature": "Blood Glucose",
                "impact": "Moderate",
                "value": f"{bg} mg/dL",
                "description": "Impaired fasting glucose in pre-diabetic threshold"
            })

        systolic = patient_data.get("blood_pressure_systolic", 120)
        if systolic >= 140:
            contributing_factors.append({
                "feature": "Systolic Blood Pressure",
                "impact": "High",
                "value": f"{systolic} mmHg",
                "description": "Stage 2 Hypertension range increasing arterial strain"
            })
        elif systolic >= 130:
            contributing_factors.append({
                "feature": "Systolic Blood Pressure",
                "impact": "Moderate",
                "value": f"{systolic} mmHg",
                "description": "Stage 1 Hypertension marker"
            })

        bmi = patient_data.get("bmi", 25)
        if bmi >= 30:
            contributing_factors.append({
                "feature": "BMI",
                "impact": "High",
                "value": f"{bmi:.1f}",
                "description": "Obesity category correlated with insulin resistance"
            })
        elif bmi >= 25:
            contributing_factors.append({
                "feature": "BMI",
                "impact": "Moderate",
                "value": f"{bmi:.1f}",
                "description": "Overweight classification elevating cardiometabolic load"
            })

        if patient_data.get("heart_disease", 0) == 1:
            contributing_factors.append({
                "feature": "Cardiovascular History",
                "impact": "High",
                "value": "Positive",
                "description": "Documented prior coronary heart disease condition"
            })

        if smoking_val == "Current smoker":
            contributing_factors.append({
                "feature": "Smoking Status",
                "impact": "Moderate",
                "value": "Current Smoker",
                "description": "Active tobacco exposure promotes endothelial inflammation"
            })

        if patient_data.get("physical_activity", 1) == 0:
            contributing_factors.append({
                "feature": "Physical Inactivity",
                "impact": "Moderate",
                "value": "Sedentary",
                "description": "Sedentary lifestyle reduces metabolic clearance rate"
            })

        if not contributing_factors:
            contributing_factors.append({
                "feature": "Metabolic Panel",
                "impact": "Low",
                "value": "Optimal",
                "description": "Vital readings and lifestyle markers fall within favorable ranges"
            })

        return {
            "predicted_risk_category": predicted_category,
            "risk_score": round(risk_score, 4),
            "confidence_percentage": round(confidence * 100, 1),
            "model_used": model_key,
            "target_definition": TARGET_DEFINITION,
            "contributing_factors": contributing_factors,
            "clinical_disclaimer": CLINICAL_DISCLAIMER
        }

    def get_evaluation_summary(self) -> Dict[str, Any]:
        return {
            "target_label": "Metabolic & Cardiometabolic Patient Risk Category",
            "target_description": TARGET_DEFINITION,
            "models": list(self.metrics.values()),
            "best_model": self.best_model_name,
            "feature_names": self.feature_names,
            "feature_importances": self.feature_importances
        }

    def save_artifacts(self):
        try:
            joblib.dump(self.models, os.path.join(MODEL_DIR, "classifiers.joblib"))
            joblib.dump(self.scaler, os.path.join(MODEL_DIR, "scaler.joblib"))
            meta = {
                "metrics": self.metrics,
                "best_model_name": self.best_model_name,
                "feature_names": self.feature_names,
                "feature_importances": self.feature_importances
            }
            with open(os.path.join(MODEL_DIR, "model_meta.json"), "w") as f:
                json.dump(meta, f, indent=2)
            logger.info("Successfully persisted ML models to disk.")
        except Exception as e:
            logger.error(f"Error saving ML models: {e}")

    def load_artifacts(self) -> bool:
        try:
            model_file = os.path.join(MODEL_DIR, "classifiers.joblib")
            scaler_file = os.path.join(MODEL_DIR, "scaler.joblib")
            meta_file = os.path.join(MODEL_DIR, "model_meta.json")

            if os.path.exists(model_file) and os.path.exists(scaler_file) and os.path.exists(meta_file):
                self.models = joblib.load(model_file)
                self.scaler = joblib.load(scaler_file)
                with open(meta_file, "r") as f:
                    meta = json.load(f)
                self.metrics = meta.get("metrics", {})
                self.best_model_name = meta.get("best_model_name", "Random Forest")
                self.feature_names = meta.get("feature_names", FEATURE_COLS)
                self.feature_importances = meta.get("feature_importances", {})
                self.is_trained = True
                logger.info("Loaded pre-trained ML models from disk.")
                return True
        except Exception as e:
            logger.error(f"Failed to load ML artifacts: {e}")
        return False

# Global pipeline instance
ml_pipeline = HealthcareMLPipeline()

