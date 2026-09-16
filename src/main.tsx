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
    console.error('SMART on FHIR authorization failed:', error);
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <div className="loading-container">
          <div className="error-container">
            <h2 className="error-container__title">Launch Error</h2>
            <p className="error-container__message">
              This application must be launched from an EHR or the{' '}
              <a
                href="https://launch.smarthealthit.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                SMART App Launcher
              </a>.
            </p>
            <p className="error-container__message">
              Set the Launch URL to:{' '}
              <code>{window.location.origin + '/launch.html'}</code>
            </p>
          </div>
        </div>
      </StrictMode>
    );
  });
