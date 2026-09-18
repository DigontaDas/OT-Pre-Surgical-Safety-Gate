import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FHIR from 'fhirclient';
import App from './App';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * SMART on FHIR Application Entry Point
 *
 * fhirclient.oauth2.ready() completes the OAuth2 + PKCE flow:
 * - On a fresh launch, it detects the authorization code in the URL
 * - Exchanges it for an access token (with PKCE code_verifier)
 * - Returns a ready-to-use FHIR client with the access token set
 * - On subsequent loads, restores the client from sessionStorage
 */
FHIR.oauth2
  .ready()
  .then((client) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App fhirClient={client} />
        </QueryClientProvider>
      </StrictMode>
    );
  })
  .catch((error) => {
    console.warn('SMART on FHIR authorization not detected or direct browser load:', error);

    const launchUrl = `${window.location.origin}/launch.html`;
    const smartLauncherUrl = `https://launch.smarthealthit.org/?launch_url=${encodeURIComponent(launchUrl)}`;
    const directLaunchUrl = `${launchUrl}?iss=${encodeURIComponent('https://launch.smarthealthit.org/v/r4/fhir')}&launch=WzAsIiIsIiIsIkFVVE8iLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMSwiIl0`;

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg)', padding: '24px', fontFamily: 'var(--font-sans)' }}>
          <div style={{ maxWidth: '540px', width: '100%', background: 'var(--color-surface)', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '50%', background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', marginBottom: '20px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text)', marginBottom: '12px' }}>
              OT Safety Gate Launch Portal
            </h1>
            
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
              This clinical safety app requires <strong>SMART on FHIR</strong> authentication and active patient context from an EHR.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              <button
                className="btn btn--primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: '1rem', fontWeight: '600' }}
                onClick={() => { window.location.href = directLaunchUrl; }}
              >
                ⚡ 1-Click Launch (SMART Health IT Sandbox)
              </button>
              
              <a
                href={smartLauncherUrl}
                className="btn btn--secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', boxSizing: 'border-box' }}
              >
                Open SMART Launcher (Auto-Configured)
              </a>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '14px 16px', borderRadius: '10px', textAlign: 'left', border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              <div style={{ fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
                ℹ️ Architecture Note
              </div>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>In Production:</strong> Clinicians launch directly from patient charts in Epic or Cerner without typing URLs.
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                App Launch URL: <code style={{ color: 'var(--color-primary-dark)', wordBreak: 'break-all' }}>{launchUrl}</code>
              </div>
            </div>
          </div>
        </div>
      </StrictMode>
    );
  });
