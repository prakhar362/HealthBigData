import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Activity,
  Calendar,
  Pill,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Patient, PatientListResponse, PatientHistory } from '../types';
import { Modal } from '../components/Modal';

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [diabetesFilter, setDiabetesFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: 45,
    gender: 'Male',
    bmi: 26.5,
    blood_pressure_systolic: 125,
    blood_pressure_diastolic: 80,
    blood_glucose: 105.0,
    cholesterol: 195,
    smoking_status: 'Non-smoker',
    physical_activity: 1,
    diabetes_status: 0,
    heart_disease: 0,
    stroke: 0,
    general_health: 3
  });

  useEffect(() => {
    fetchPatients();
  }, [page, pageSize, search, genderFilter, riskFilter, diabetesFilter, sortBy, sortOrder]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.getPatients({
        page,
        page_size: pageSize,
        search: search || undefined,
        gender: genderFilter || undefined,
        risk_category: riskFilter || undefined,
        diabetes_status: diabetesFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setPatients(res.patients);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      first_name: '',
      last_name: '',
      age: 50,
      gender: 'Male',
      bmi: 27.0,
      blood_pressure_systolic: 130,
      blood_pressure_diastolic: 85,
      blood_glucose: 110.0,
      cholesterol: 205,
      smoking_status: 'Non-smoker',
      physical_activity: 1,
      diabetes_status: 0,
      heart_disease: 0,
      stroke: 0,
      general_health: 3
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      age: patient.age,
      gender: patient.gender,
      bmi: patient.bmi,
      blood_pressure_systolic: patient.blood_pressure_systolic,
      blood_pressure_diastolic: patient.blood_pressure_diastolic,
      blood_glucose: patient.blood_glucose,
      cholesterol: patient.cholesterol,
      smoking_status: patient.smoking_status,
      physical_activity: patient.physical_activity,
      diabetes_status: patient.diabetes_status,
      heart_disease: patient.heart_disease,
      stroke: patient.stroke,
      general_health: patient.general_health
    });
    setIsEditOpen(true);
  };

  const handleOpenHistory = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const history = await api.getPatientHistory(patient.patient_id);
      setPatientHistory(history);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPatient(formData);
      setIsAddOpen(false);
      fetchPatients();
    } catch (err: any) {
      alert(err.message || 'Error creating patient');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await api.updatePatient(selectedPatient.patient_id, formData);
      setIsEditOpen(false);
      fetchPatients();
    } catch (err: any) {
      alert(err.message || 'Error updating patient');
    }
  };

  const handleDelete = async (patientId: string) => {
    if (window.confirm(`Are you sure you want to permanently delete record for ${patientId}?`)) {
      try {
        await api.deletePatient(patientId);
        fetchPatients();
      } catch (err: any) {
        alert(err.message || 'Error deleting patient');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Cohort Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Query, inspect, add and update synthetic patient profiles with longitudinal medical history
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Synthetic Patient</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Patient ID (e.g. PT-10001) or Name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="Low Risk">Low Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="High Risk">High Risk</option>
          </select>

          {/* Diabetes Filter */}
          <select
            value={diabetesFilter === undefined ? '' : diabetesFilter.toString()}
            onChange={(e) => {
              setDiabetesFilter(e.target.value === '' ? undefined : parseInt(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Diabetes Status</option>
            <option value="1">Diabetes Positive</option>
            <option value="0">Diabetes Negative</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [col, order] = e.target.value.split('-');
              setSortBy(col);
              setSortOrder(order);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="id-asc">Sort: ID (Asc)</option>
            <option value="id-desc">Sort: ID (Desc)</option>
            <option value="age-desc">Sort: Age (High to Low)</option>
            <option value="age-asc">Sort: Age (Low to High)</option>
            <option value="bmi-desc">Sort: BMI (High to Low)</option>
            <option value="blood_glucose-desc">Sort: Glucose (High to Low)</option>
            <option value="risk_score-desc">Sort: Risk Score (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-3.5 font-semibold">Patient ID</th>
                <th className="py-3 px-3.5 font-semibold">Patient Name</th>
                <th className="py-3 px-3.5 font-semibold">Age / Sex</th>
                <th className="py-3 px-3.5 font-semibold">BMI</th>
                <th className="py-3 px-3.5 font-semibold">BP (mmHg)</th>
                <th className="py-3 px-3.5 font-semibold">Glucose</th>
                <th className="py-3 px-3.5 font-semibold">Cholesterol</th>
                <th className="py-3 px-3.5 font-semibold">Smoking</th>
                <th className="py-3 px-3.5 font-semibold">Diabetes</th>
                <th className="py-3 px-3.5 font-semibold">Risk Category</th>
                <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Querying patient cohort records...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No patients match the search or filter criteria.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-semibold text-blue-600">{p.patient_id}</td>
                    <td className="py-3 px-3.5 font-medium text-slate-900">{p.first_name} {p.last_name}</td>
                    <td className="py-3 px-3.5">{p.age} y / {p.gender}</td>
                    <td className="py-3 px-3.5 font-mono">{p.bmi.toFixed(1)}</td>
                    <td className="py-3 px-3.5 font-mono">{p.blood_pressure_systolic}/{p.blood_pressure_diastolic}</td>
                    <td className="py-3 px-3.5 font-mono">
                      <span className={p.blood_glucose >= 140 ? 'text-red-600 font-bold' : ''}>
                        {p.blood_glucose.toFixed(0)} mg/dL
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono">{p.cholesterol} mg/dL</td>
                    <td className="py-3 px-3.5 text-slate-600">{p.smoking_status}</td>
                    <td className="py-3 px-3.5">
                      {p.diabetes_status === 1 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                          Positive
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          Negative
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.risk_category === 'High Risk'
                          ? 'bg-red-100 text-red-700'
                          : p.risk_category === 'Medium Risk'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.risk_category}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenHistory(p)}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View Longitudinal History"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.patient_id)}
                        className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold">{Math.min(total, (page - 1) * pageSize + 1)}</span> to{' '}
            <span className="font-semibold">{Math.min(total, page * pageSize)}</span> of{' '}
            <span className="font-semibold">{total}</span> patients
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-800">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Synthetic Patient Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Synthetic Patient Record"
        subtitle="Generates verified patient entry with automated ML risk stratification"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-medium mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="e.g. Marcus"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="e.g. Vance"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Age</label>
              <input
                type="number"
                min={1}
                max={120}
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">BMI (Body Mass Index)</label>
              <input
                type="number"
                step="0.1"
                min={10}
                max={70}
                required
                value={formData.bmi}
                onChange={(e) => setFormData({ ...formData, bmi: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Blood Glucose (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                min={40}
                max={500}
                required
                value={formData.blood_glucose}
                onChange={(e) => setFormData({ ...formData, blood_glucose: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Systolic BP (mmHg)</label>
              <input
                type="number"
                min={70}
                max={240}
                required
                value={formData.blood_pressure_systolic}
                onChange={(e) => setFormData({ ...formData, blood_pressure_systolic: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Diastolic BP (mmHg)</label>
              <input
                type="number"
                min={40}
                max={140}
                required
                value={formData.blood_pressure_diastolic}
                onChange={(e) => setFormData({ ...formData, blood_pressure_diastolic: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Total Cholesterol (mg/dL)</label>
              <input
                type="number"
                min={80}
                max={500}
                required
                value={formData.cholesterol}
                onChange={(e) => setFormData({ ...formData, cholesterol: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Smoking Status</label>
              <select
                value={formData.smoking_status}
                onChange={(e) => setFormData({ ...formData, smoking_status: e.target.value })}
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
                  value={formData.physical_activity}
                  onChange={(e) => setFormData({ ...formData, physical_activity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>Physically Active (&gt;= 150 min/wk)</option>
                  <option value={0}>Sedentary</option>
                </select>
              </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Diabetes Status</label>
              <select
                value={formData.diabetes_status}
                onChange={(e) => setFormData({ ...formData, diabetes_status: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value={0}>Negative / Non-diabetic</option>
                <option value={1}>Positive / Type 2 Diagnosed</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
            >
              Save & Stratify Risk
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Patient: ${selectedPatient?.patient_id}`}
        subtitle="Update clinical metrics; automatic ML recalculation will update risk tier."
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-medium mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">BMI</label>
              <input
                type="number"
                step="0.1"
                value={formData.bmi}
                onChange={(e) => setFormData({ ...formData, bmi: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Systolic BP</label>
              <input
                type="number"
                value={formData.blood_pressure_systolic}
                onChange={(e) => setFormData({ ...formData, blood_pressure_systolic: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Blood Glucose (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                value={formData.blood_glucose}
                onChange={(e) => setFormData({ ...formData, blood_glucose: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
            >
              Update Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Longitudinal Patient Profile & History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Longitudinal Health Record: ${selectedPatient?.first_name} ${selectedPatient?.last_name} (${selectedPatient?.patient_id})`}
        subtitle="Complete inpatient visits, laboratory test results, active medications & vital history"
        maxWidth="4xl"
      >
        {historyLoading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading complete patient clinical chart...
          </div>
        ) : !patientHistory ? (
          <div className="py-6 text-center text-xs text-slate-400">No history found for patient.</div>
        ) : (
          <div className="space-y-6 text-xs">
            {/* Clinical Overview Header Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Demographics</span>
                <span className="font-bold text-slate-800">{selectedPatient?.age} yrs, {selectedPatient?.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Baseline Glycemia / BMI</span>
                <span className="font-bold text-slate-800">{selectedPatient?.blood_glucose} mg/dL | {selectedPatient?.bmi.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Blood Pressure</span>
                <span className="font-bold text-slate-800">{selectedPatient?.blood_pressure_systolic}/{selectedPatient?.blood_pressure_diastolic} mmHg</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Risk Category</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedPatient?.risk_category === 'High Risk'
                    ? 'bg-red-100 text-red-700'
                    : selectedPatient?.risk_category === 'Medium Risk'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedPatient?.risk_category} ({((selectedPatient?.risk_score || 0) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Inpatient Encounters Table */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Hospital Encounters & Admissions ({patientHistory.visits.length})</span>
              </h4>
              {patientHistory.visits.length === 0 ? (
                <p className="text-slate-400 italic">No recorded inpatient visits.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-2">Admission Date</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Length of Stay</th>
                        <th className="p-2">Primary Diagnosis</th>
                        <th className="p-2">Readmit Status</th>
                        <th className="p-2">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientHistory.visits.map((v) => (
                        <tr key={v.id}>
                          <td className="p-2">{new Date(v.admission_date).toLocaleDateString()}</td>
                          <td className="p-2 font-medium">{v.admission_type}</td>
                          <td className="p-2">{v.length_of_stay} days</td>
                          <td className="p-2 text-slate-800 font-medium">{v.primary_diagnosis}</td>
                          <td className="p-2">
                            <span className={v.readmitted === '<30' ? 'text-red-600 font-bold' : ''}>
                              {v.readmitted}
                            </span>
                          </td>
                          <td className="p-2 font-mono">${v.total_cost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Laboratory Tests */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Diagnostic Laboratory Results ({patientHistory.labs.length})</span>
              </h4>
              {patientHistory.labs.length === 0 ? (
                <p className="text-slate-400 italic">No lab test records.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-2">Test Name</th>
                        <th className="p-2">Result</th>
                        <th className="p-2">Reference Range</th>
                        <th className="p-2">Interpretation</th>
                        <th className="p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientHistory.labs.map((lab) => (
                        <tr key={lab.id}>
                          <td className="p-2 font-medium">{lab.test_name}</td>
                          <td className="p-2 font-bold font-mono">{lab.test_value} {lab.unit}</td>
                          <td className="p-2 text-slate-500">{lab.reference_range}</td>
                          <td className="p-2">
                            {lab.is_abnormal ? (
                              <span className="text-red-600 font-bold">Abnormal High</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Normal</span>
                            )}
                          </td>
                          <td className="p-2 text-slate-400">{new Date(lab.test_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Active Medications */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center space-x-1.5">
                <Pill className="w-4 h-4 text-purple-600" />
                <span>Prescribed Medications ({patientHistory.medications.length})</span>
              </h4>
              {patientHistory.medications.length === 0 ? (
                <p className="text-slate-400 italic">No active prescriptions.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {patientHistory.medications.map((m) => (
                    <div key={m.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{m.medication_name} ({m.dosage})</p>
                        <p className="text-slate-500 text-[11px]">{m.frequency}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
