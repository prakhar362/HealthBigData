import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Award,
  BarChart3,
  HelpCircle,
  UserCheck,
  Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import {
  RiskPredictionResult,
  ModelMetricsSummary,
  Patient
} from '../types';

export const RiskPredictionPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [modelName, setModelName] = useState<string>('Random Forest');

  // Input Features
  const [age, setAge] = useState<number>(54);
  const [bmi, setBmi] = useState<number>(29.5);
  const [bloodGlucose, setBloodGlucose] = useState<number>(142.0);
  const [systolicBp, setSystolicBp] = useState<number>(138);
  const [cholesterol, setCholesterol] = useState<number>(225);
  const [smokingStatus, setSmokingStatus] = useState<string>('Former smoker');
  const [physicalActivity, setPhysicalActivity] = useState<number>(0);
  const [heartDisease, setHeartDisease] = useState<number>(1);
  const [stroke, setStroke] = useState<number>(0);

  // Results & Metrics
  const [prediction, setPrediction] = useState<RiskPredictionResult | null>(null);
  const [metrics, setMetrics] = useState<ModelMetricsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    // Load patient cohort for dropdown
    api.getPatients({ page: 1, page_size: 50 }).then((res) => {
      setPatients(res.patients);
    }).catch(() => {});

    // Load model metrics
    api.getModelMetrics().then((res) => {
      setMetrics(res);
      if (res.best_model) setModelName(res.best_model);
    }).catch(() => {});
  }, []);

  const handlePatientSelect = (pid: string) => {
    setSelectedPatientId(pid);
    const p = patients.find((x) => x.patient_id === pid);
    if (p) {
      setAge(p.age);
      setBmi(p.bmi);
      setBloodGlucose(p.blood_glucose);
      setSystolicBp(p.blood_pressure_systolic);
      setCholesterol(p.cholesterol);
      setSmokingStatus(p.smoking_status);
      setPhysicalActivity(p.physical_activity);
      setHeartDisease(p.heart_disease);
      setStroke(p.stroke);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.predictRisk({
        patient_id: selectedPatientId || undefined,
        age,
        bmi,
        blood_glucose: bloodGlucose,
        blood_pressure_systolic: systolicBp,
        cholesterol,
        smoking_status: smokingStatus,
        physical_activity: physicalActivity,
        heart_disease: heartDisease,
        stroke,
        model_name: modelName
      });
      setPrediction(res);
    } catch (err: any) {
      alert(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      await api.retrainModels();
      const updated = await api.getModelMetrics();
      setMetrics(updated);
      alert('Classification models retrained and calibrated successfully on cohort data.');
    } catch (err: any) {
      alert(err.message || 'Retraining failed');
    } finally {
      setRetraining(false);
    }
  };

  // Convert feature importances for chart
  const importanceChartData = metrics?.feature_importances
    ? Object.entries(metrics.feature_importances).map(([k, v]) => ({
        feature: k.replace('_', ' ').toUpperCase(),
        importance: Math.round(v * 100)
      })).sort((a, b) => b.importance - a.importance)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Risk Prediction Engine</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
              Scikit-learn Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervised multi-class classification for cardiometabolic risk stratification with explainable feature contributions
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'Calibrating...' : 'Retrain Pipeline'}</span>
        </button>
      </div>

      {/* Academic Disclaimer Banner */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Academic Decision-Support Demonstration: </span>
          <span>
            This machine learning risk module is developed strictly for Big Data Analytics research and engineering coursework.
            Predictions represent synthetic probabilistic risk scores and must NOT be used for clinical diagnosis or prescription without licensed physician evaluation.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Patient Selection & Feature Input (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-card">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-800">Biomarker & Clinical Inputs</h3>
            <p className="text-[11px] text-slate-400">Select an existing cohort patient or input synthetic values</p>
          </div>

          <form onSubmit={handlePredict} className="space-y-4 text-xs">
            {/* Quick Cohort Select */}
            <div>
              <label className="block text-slate-600 font-medium mb-1 flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Preload Existing Cohort Patient (Optional)</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="">-- Manual / Synthetic Clinical Entry --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.patient_id}>
                    {p.patient_id} – {p.first_name} {p.last_name} ({p.age}y, {p.gender}, {p.risk_category})
                  </option>
                ))}
              </select>
            </div>

            {/* Algorithm Selector */}
            <div>
              <label className="block text-slate-600 font-medium mb-1 flex items-center space-x-1">
                <BrainCircuit className="w-3.5 h-3.5 text-teal-600" />
                <span>Classification Model</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Logistic Regression', 'Decision Tree', 'Random Forest'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModelName(m)}
                    className={`py-2 px-2 rounded-lg border text-center transition-all ${
                      modelName === m
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric Features */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Age (Years)</label>
                <input
                  type="number"
                  min={18}
                  max={110}
                  required
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">BMI (kg/m²)</label>
                <input
                  type="number"
                  step="0.1"
                  min={12}
                  max={65}
                  required
                  value={bmi}
                  onChange={(e) => setBmi(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Fasting Glucose (mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  min={50}
                  max={450}
                  required
                  value={bloodGlucose}
                  onChange={(e) => setBloodGlucose(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  min={80}
                  max={230}
                  required
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Total Cholesterol (mg/dL)</label>
                <input
                  type="number"
                  min={90}
                  max={450}
                  required
                  value={cholesterol}
                  onChange={(e) => setCholesterol(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Smoking Status</label>
                <select
                  value={smokingStatus}
                  onChange={(e) => setSmokingStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="Non-smoker">Non-smoker</option>
                  <option value="Former smoker">Former smoker</option>
                  <option value="Current smoker">Current smoker</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Physical Activity</label>
                <select
                  value={physicalActivity}
                  onChange={(e) => setPhysicalActivity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>Active (&gt;= 150m/wk)</option>
                  <option value={0}>Sedentary (&lt; 150m/wk)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Heart Disease History</label>
                <select
                  value={heartDisease}
                  onChange={(e) => setHeartDisease(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>Negative</option>
                  <option value={1}>Positive History</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-all mt-4"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Evaluating Classifier...' : `Execute ${modelName} Inference`}</span>
            </button>
          </form>
        </div>

        {/* Right Output: Prediction Output & Feature Importances (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prediction Result Card */}
          {prediction ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-card space-y-5 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Inference Evaluation Result</h3>
                  <p className="text-[11px] text-slate-400">Classified by: {prediction.model_used}</p>
                </div>
                <span className="text-xs font-mono text-slate-400">Confidence: {prediction.confidence_percentage}%</span>
              </div>

              {/* Big Result Badge */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                prediction.predicted_risk_category === 'High Risk'
                  ? 'bg-red-50/70 border-red-200 text-red-900'
                  : prediction.predicted_risk_category === 'Medium Risk'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md ${
                    prediction.predicted_risk_category === 'High Risk'
                      ? 'bg-red-600'
                      : prediction.predicted_risk_category === 'Medium Risk'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}>
                    {prediction.predicted_risk_category === 'High Risk' ? 'HR' : prediction.predicted_risk_category === 'Medium Risk' ? 'MR' : 'LR'}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold tracking-tight">{prediction.predicted_risk_category}</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Calculated Composite Risk Score: <span className="font-mono font-bold">{prediction.risk_score}</span> / 1.000
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">Certainty</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{prediction.confidence_percentage}%</span>
                </div>
              </div>

              {/* Contributing Features */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Key Contributing Biomarkers & Risk Modifiers
                </h4>
                <div className="space-y-2">
                  {prediction.contributing_factors.map((factor, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{factor.feature}</span>
                          <span className="font-mono text-slate-500">({factor.value})</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{factor.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        factor.impact === 'High'
                          ? 'bg-red-100 text-red-700'
                          : factor.impact === 'Moderate'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {factor.impact} Impact
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-card text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Awaiting Clinical Inference Execution</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select a patient from the dropdown or adjust the biomarker indicators on the left, then click "Execute Inference" to view the predicted risk tier, model confidence, and contributing risk features.
              </p>
            </div>
          )}

          {/* Model Evaluation Metrics Section */}
          {metrics && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Model Evaluation & Benchmark Comparison</h3>
                  <p className="text-[11px] text-slate-400">Trained on CDC Diabetes & Healthcare Cohort (Stratified Split)</p>
                </div>
                <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Best Model: {metrics.best_model}</span>
                </div>
              </div>

              {/* Metrics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <th className="py-2 px-3 font-semibold">Model Architecture</th>
                      <th className="py-2 px-3 font-semibold">Accuracy</th>
                      <th className="py-2 px-3 font-semibold">Precision</th>
                      <th className="py-2 px-3 font-semibold">Recall</th>
                      <th className="py-2 px-3 font-semibold">F1-Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics.models.map((m) => (
                      <tr key={m.model_name} className={m.model_name === metrics.best_model ? 'bg-blue-50/40 font-semibold text-blue-900' : 'text-slate-700'}>
                        <td className="py-2 px-3 flex items-center space-x-1.5">
                          {m.model_name === metrics.best_model && (
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                          )}
                          <span>{m.model_name}</span>
                        </td>
                        <td className="py-2 px-3 font-mono">{(m.accuracy * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 font-mono">{(m.precision * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 font-mono">{(m.recall * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 font-mono text-blue-600">{(m.f1_score * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confusion Matrix Visualizer */}
              {metrics.models.find(m => m.model_name === modelName) && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">
                    Confusion Matrix: {modelName}
                  </h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs overflow-x-auto">
                    <div className="text-[10px] text-slate-400 mb-1 text-center font-semibold">Predicted Class &rarr;</div>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono">
                      <div className="text-slate-400 text-[10px] text-right pr-2">Actual &darr;</div>
                      <div className="font-bold text-emerald-700 text-[11px]">Low</div>
                      <div className="font-bold text-amber-700 text-[11px]">Med</div>
                      <div className="font-bold text-red-700 text-[11px]">High</div>

                      {metrics.models.find(m => m.model_name === modelName)?.confusion_matrix.map((row, rIdx) => (
                        <React.Fragment key={rIdx}>
                          <div className="font-bold text-slate-700 text-[10px] text-right pr-2 py-1">
                            {rIdx === 0 ? 'Low' : rIdx === 1 ? 'Med' : 'High'}
                          </div>
                          {row.map((val, cIdx) => (
                            <div
                              key={cIdx}
                              className={`py-1 rounded font-bold ${
                                rIdx === cIdx
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-600'
                              }`}
                            >
                              {val}
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Feature Importance Bar Chart */}
              {importanceChartData.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">
                    Feature Importance Weights (Random Forest)
                  </h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={importanceChartData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                        <YAxis dataKey="feature" type="category" tick={{ fontSize: 9 }} width={80} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                        <Bar dataKey="importance" fill="#0d9488" radius={[0, 4, 4, 0]} name="Weight %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

