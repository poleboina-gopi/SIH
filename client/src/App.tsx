import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dock } from './components/Dock';
import { DotPattern } from './components/DotPattern';
import { SmoothCursor } from './components/SmoothCursor';
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
  // Theme state: dark-first with complete light-mode parity
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app-theme') as 'dark' | 'light' | null;
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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
  useEffect(() => {
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
    if (user?.role === 'admin') return; // strictly block admin
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

  return (
    <div className="app-container">
      {/* Ambient Animated Dot Pattern Canvas with Radial Vignette */}
      <DotPattern glow={true} />

      {/* Smooth Inertia Mouse Follower with Subtle Violet Glow */}
      <SmoothCursor glowEffect={true} showTrail={true} trailLength={4} />

      {/* If unauthenticated, show enterprise LoginPage */}
      {!user || currentTab === 'login' ? (
        <LoginPage
          onLoginSuccess={(u) => {
            setUser(u);
            setCurrentTab(u.role === 'admin' ? 'admin' : 'inspector');
          }}
        />
      ) : (
        <>
          {/* Directorate Floating Glass Navigation Header */}
          <Navbar
            user={user}
            currentTab={currentTab}
            onSelectTab={(tab) => {
              if (user.role === 'admin' && (tab === 'scan' || tab === 'inspector')) {
                return;
              }
              setCurrentTab(tab);
            }}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          {/* Main Content Area */}
          <main className="main-content">
            {currentTab === 'inspector' && (
              user.role === 'admin' ? (
                <AdminDashboard user={user} onViewReport={handleViewReport} />
              ) : (
                <InspectorDashboard
                  user={user}
                  onNavigateScan={() => { setActiveSample(null); setCurrentTab('scan'); }}
                  onSelectSample={handleSelectSample}
                  onViewReport={handleViewReport}
                />
              )
            )}

            {currentTab === 'scan' && (
              user.role === 'admin' ? (
                <AdminDashboard user={user} onViewReport={handleViewReport} />
              ) : (
                <ScanUploadPage
                  user={user}
                  initialSample={activeSample}
                  onOcrComplete={handleOcrComplete}
                />
              )
            )}

            {currentTab === 'results' && scanData && (
              user.role === 'admin' ? (
                <AdminDashboard user={user} onViewReport={handleViewReport} />
              ) : (
                <ScanResultsPage
                  scanData={scanData}
                  onBack={() => setCurrentTab('scan')}
                  onValidationComplete={handleValidationComplete}
                />
              )
            )}

            {currentTab === 'report' && activeReportId && (
              <ComplianceReportPage
                user={user}
                reportId={activeReportId}
                onBack={() => setCurrentTab(user.role === 'admin' ? 'admin' : 'inspector')}
                onNewScan={() => {
                  if (user.role === 'admin') return;
                  setActiveSample(null);
                  setCurrentTab('scan');
                }}
              />
            )}

            {currentTab === 'admin' && (
              <AdminDashboard user={user} onViewReport={handleViewReport} />
            )}

            {currentTab === 'repository' && (
              <RepositoryPage
                user={user}
                onViewReport={handleViewReport}
                onNewScan={() => {
                  if (user.role === 'admin') return;
                  setActiveSample(null);
                  setCurrentTab('scan');
                }}
              />
            )}
          </main>

          {/* Interactive Bottom Dock with macOS Magnification */}
          <Dock
            user={user}
            currentTab={currentTab}
            onSelectTab={(tab) => {
              if (user.role === 'admin' && (tab === 'scan' || tab === 'inspector')) {
                return;
              }
              setCurrentTab(tab);
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </>
      )}
    </div>
  );
}

export default App;
