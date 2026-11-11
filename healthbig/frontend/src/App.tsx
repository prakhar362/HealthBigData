import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

import { OverviewPage } from './pages/OverviewPage';
import { PatientsPage } from './pages/PatientsPage';
import { DiseaseAnalyticsPage } from './pages/DiseaseAnalyticsPage';
import { RiskPredictionPage } from './pages/RiskPredictionPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { HospitalAnalyticsPage } from './pages/HospitalAnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { SettingsPage } from './pages/SettingsPage';

function AppLayout() {
  const navigate = useNavigate();

  const handleGlobalSearch = (term: string) => {
    if (term.trim()) {
      navigate(`/patients?search=${encodeURIComponent(term)}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Persistent Left Dark Navy Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar onSearch={handleGlobalSearch} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/60">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/disease-analytics" element={<DiseaseAnalyticsPage />} />
              <Route path="/risk-prediction" element={<RiskPredictionPage />} />
              <Route path="/monitoring" element={<MonitoringPage />} />
              <Route path="/hospital-analytics" element={<HospitalAnalyticsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/data-management" element={<DataManagementPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
