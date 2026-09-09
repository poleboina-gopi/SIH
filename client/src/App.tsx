import React, { useState } from 'react';
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
  // Only load real authenticated user from localStorage; no demo fallbacks
  const [user, setUser] = useState<User | null>(() => {
    return api.getCurrentUser();
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const stored = api.getCurrentUser();
    if (stored?.role === 'admin') return 'admin';
    return 'inspector';
  });

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

  // RBAC route guard: strictly isolates Inspector vs Admin interfaces
  React.useEffect(() => {
    if (user?.role === 'admin' && (currentTab === 'inspector' || currentTab === 'scan' || currentTab === 'results')) {
      setCurrentTab('admin');
    }
    if (user?.role === 'inspector' && currentTab === 'admin') {
      setCurrentTab('inspector');
    }
  }, [user, currentTab]);

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

  // If unauthenticated, show enterprise LoginPage
  if (!user || currentTab === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(u) => {
          setUser(u);
          setCurrentTab(u.role === 'admin' ? 'admin' : 'inspector');
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Directorate Navigation Header */}
      <Navbar
        user={user}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
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
            user={user}
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
