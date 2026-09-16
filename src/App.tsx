import { useState } from 'react';
import type Client from 'fhirclient/lib/Client';
import { FhirClientContext } from './services/auth/FhirClientContext';
import { DashboardPage } from './features/dashboard/DashboardPage';

interface AppProps {
  fhirClient: Client;
}

/**
 * Root application component.
 * Receives the authenticated FHIR client from main.tsx
 * and provides it via context to all child components.
 */
function App({ fhirClient }: AppProps) {
  const [activeView] = useState<'dashboard' | 'export'>('dashboard');

  return (
    <FhirClientContext.Provider value={fhirClient}>
      {/* Clinical Disclaimer */}
      <div className="disclaimer-banner">
        ⚠️ FOR DEMONSTRATION PURPOSES ONLY — Not validated for clinical use
      </div>

      {/* App Header */}
      <header className="app-header">
        <span className="app-header__icon">🏥</span>
        <span className="app-header__title">OT Pre-Surgical Safety Gate</span>
        <span className="app-header__subtitle">Operating Theater Checklist</span>
      </header>

      {/* Main Content */}
      <main className="page">
        <div className="container">
          {activeView === 'dashboard' && <DashboardPage />}
        </div>
      </main>
    </FhirClientContext.Provider>
  );
}

export default App;
