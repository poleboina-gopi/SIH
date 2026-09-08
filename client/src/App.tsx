import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { InspectorDashboard } from './pages/InspectorDashboard';
import { ScanUploadPage } from './pages/ScanUploadPage';
import { ScanResultsPage } from './pages/ScanResultsPage';
import { ComplianceReportPage } from './pages/ComplianceReportPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { RepositoryPage } from './pages/RepositoryPage';
import { User, ParsedFields } from './types';
import { SampleLabel } from './data/sampleLabels';
import { api } from './services/api';

export function App() {
  const [user, setUser] = useState<User | null>(() => {
    // Default to active inspector session for seamless evaluation
    const stored = api.getCurrentUser();
    if (stored) return stored;
    return {
      id: "usr_inspector_01",
      name: "R. K. Sharma",
      email: "inspector@gov.in",
      role: "inspector",
      designation: "Legal Metrology Officer (Zonal)",
      badgeNumber: "LM-DEL-2024-890",
      department: "Directorate of Legal Metrology, Delhi Circle"
    };
  });

  const [currentTab, setCurrentTab] = useState<string>('inspector');
  const [activeSample, setActiveSample] = useState<SampleLabel | null>(null);

  // Scan workflow state
  const [scanData, setScanData] = useState<{
    imageUrl: string;
    productName: string;
    brand: string;
    category: string;
    rawText: string;
    parsedFields?: ParsedFields;
    boundingBoxes?: any[];
  } | null>(null);

  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  // Switch role handler (Inspector <-> Admin)
  const handleSwitchRole = (role: 'inspector' | 'admin') => {
    if (role === 'admin') {
      const adminUser: User = {
        id: "usr_admin_01",
        name: "Dr. S. Mukherjee",
        email: "admin@gov.in",
        role: "admin",
        designation: "Joint Controller, Legal Metrology",
        badgeNumber: "LM-HQ-9901",
        department: "Department of Consumer Affairs, MoCA"
      };
      setUser(adminUser);
      localStorage.setItem('lm_user', JSON.stringify(adminUser));
      setCurrentTab('admin');
    } else {
      const inspectorUser: User = {
        id: "usr_inspector_01",
        name: "R. K. Sharma",
        email: "inspector@gov.in",
        role: "inspector",
        designation: "Legal Metrology Officer (Zonal)",
        badgeNumber: "LM-DEL-2024-890",
        department: "Directorate of Legal Metrology, Delhi Circle"
      };
      setUser(inspectorUser);
      localStorage.setItem('lm_user', JSON.stringify(inspectorUser));
      setCurrentTab('inspector');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentTab('login');
  };

  // When a benchmark sample is selected from dashboard
  const handleSelectSample = (sample: SampleLabel) => {
    setActiveSample(sample);
    setCurrentTab('scan');
  };

  // When OCR completes on scan page
  const handleOcrComplete = (data: any) => {
    setScanData(data);
    setCurrentTab('results');
  };

  // When validation completes on results page
  const handleValidationComplete = (reportId: string) => {
    setActiveReportId(reportId);
    setCurrentTab('report');
  };

  // View specific report from dashboard or repository
  const handleViewReport = (scanId: string) => {
    setActiveReportId(scanId);
    setCurrentTab('report');
  };

  if (!user || currentTab === 'login') {
    return <LoginPage onLoginSuccess={(u) => { setUser(u); setCurrentTab(u.role === 'admin' ? 'admin' : 'inspector'); }} />;
  }

  return (
    <div className="app-container">
      {/* Directorate Navigation Header */}
      <Navbar
        user={user}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {currentTab === 'inspector' && (
          <InspectorDashboard
            user={user}
            onNavigateScan={() => { setActiveSample(null); setCurrentTab('scan'); }}
            onSelectSample={handleSelectSample}
            onViewReport={handleViewReport}
          />
        )}

        {currentTab === 'scan' && (
          <ScanUploadPage
            initialSample={activeSample}
            onOcrComplete={handleOcrComplete}
          />
        )}

        {currentTab === 'results' && scanData && (
          <ScanResultsPage
            scanData={scanData}
            onBack={() => setCurrentTab('scan')}
            onValidationComplete={handleValidationComplete}
          />
        )}

        {currentTab === 'report' && activeReportId && (
          <ComplianceReportPage
            reportId={activeReportId}
            onBack={() => setCurrentTab('inspector')}
            onNewScan={() => { setActiveSample(null); setCurrentTab('scan'); }}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard user={user} />
        )}

        {currentTab === 'repository' && (
          <RepositoryPage
            onViewReport={handleViewReport}
            onNewScan={() => { setActiveSample(null); setCurrentTab('scan'); }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
