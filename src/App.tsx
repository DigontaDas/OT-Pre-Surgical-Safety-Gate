import { useState } from 'react';
import type Client from 'fhirclient/lib/Client';
import { Activity, LayoutDashboard, FileText, LogOut, Lock } from 'lucide-react';
import { FhirClientContext } from './services/auth/FhirClientContext';
import { useSafetyCheck } from './hooks/fhirHooks';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ExportPage } from './features/export/ExportPage';

interface AppProps {
  fhirClient: Client;
}

function AppShell() {
  const [activeView, setActiveView] = useState<'dashboard' | 'export'>('dashboard');
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const { safetyReport } = useSafetyCheck();

  const isBlocked = safetyReport?.overallDecision === 'blocked' && !safetyReport?.override;

  const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedOut(true);
  };

  const handleNavigateToExport = () => {
    if (isBlocked) return;
    setActiveView('export');
  };

  if (isLoggedOut) {
    const launchUrl = `${window.location.origin}/launch.html`;
    const smartLauncherUrl = `https://launch.smarthealthit.org/?launch_url=${encodeURIComponent(launchUrl)}`;
    const directLaunchUrl = `${launchUrl}?iss=${encodeURIComponent('https://launch.smarthealthit.org/v/r4/fhir')}&launch=WzAsIiIsIiIsIkFVVE8iLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMSwiIl0`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-sans)', padding: '24px' }}>
        <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center', background: 'var(--color-surface)', padding: '40px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', border: '1px solid var(--color-border)' }}>
          <Activity size={56} color="var(--color-primary-dark)" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', marginBottom: '12px', fontWeight: '700' }}>Session Disconnected</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '28px', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Your active EHR clinical session has been terminated and local tokens cleared.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <button
              className="btn btn--primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '1rem' }}
              onClick={() => { window.location.href = directLaunchUrl; }}
            >
              ⚡ 1-Click Launch (SMART Health IT Sandbox)
            </button>
            <button
              className="btn btn--secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '1rem' }}
              onClick={() => { window.location.href = smartLauncherUrl; }}
            >
              Configure in SMART Launcher (Auto-Filled)
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
            💡 <strong>Why manual entry is not needed:</strong> In a production EHR (Epic or Cerner), launch URLs are registered once by hospital IT and launched automatically from the patient chart.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Clinical Disclaimer */}
      <div className="disclaimer-banner">
        ⚠️ FOR DEMONSTRATION PURPOSES ONLY — Not validated for clinical use
      </div>

      {/* App Header */}
      <header className="app-header">
        <Activity className="app-header__icon" size={28} />
        <div style={{ flex: 1 }}>
          <span className="app-header__title">OT Pre-Surgical Safety Gate</span>
          <span className="app-header__subtitle">Operating Theater Checklist</span>
        </div>
        
        <nav style={{ display: 'flex', gap: '16px', marginRight: '20px', alignItems: 'center' }}>
          <button 
            style={{ 
              background: activeView === 'dashboard' ? 'var(--color-primary-bg)' : 'transparent', 
              border: 'none', 
              color: activeView === 'dashboard' ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)', 
              cursor: 'pointer', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            style={{ 
              background: activeView === 'export' ? 'var(--color-primary-bg)' : 'transparent', 
              border: 'none', 
              color: isBlocked ? '#94a3b8' : activeView === 'export' ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)', 
              cursor: isBlocked ? 'not-allowed' : 'pointer', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              opacity: isBlocked ? 0.5 : 1
            }}
            onClick={handleNavigateToExport}
            disabled={isBlocked}
            title={isBlocked ? 'Export locked: Patient is NOT SAFE TO PROCEED' : 'Export Pre-Op Clinical Note'}
          >
            {isBlocked ? <Lock size={16} /> : <FileText size={18} />}
            Export Note
            {isBlocked && (
              <span style={{ fontSize: '10px', background: 'var(--color-fail)', color: '#fff', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px', fontWeight: 'bold' }}>
                Blocked
              </span>
            )}
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 8px' }}></div>
          <button 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--color-text-secondary)', 
              cursor: 'pointer', 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px',
              transition: 'all 0.2s ease'
            }}
            onClick={handleLogout}
            title="Disconnect"
          >
            <LogOut size={18} />
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="page">
        <div className="container">
          {activeView === 'dashboard' && <DashboardPage onNavigateToExport={handleNavigateToExport} />}
          {activeView === 'export' && <ExportPage onNavigateToDashboard={() => setActiveView('dashboard')} />}
        </div>
      </main>
    </>
  );
}

/**
 * Root application component.
 * Receives the authenticated FHIR client from main.tsx
 * and provides it via context to all child components.
 */
function App({ fhirClient }: AppProps) {
  return (
    <FhirClientContext.Provider value={fhirClient}>
      <AppShell />
    </FhirClientContext.Provider>
  );
}

export default App;
