import { createContext, useContext } from 'react';
import type Client from 'fhirclient/lib/Client';

/**
 * React Context for the authenticated FHIR client.
 * Provided by App.tsx after successful SMART on FHIR authorization.
 */
export const FhirClientContext = createContext<Client | null>(null);

/**
 * Hook to access the authenticated FHIR client.
 * Throws if used outside the FhirClientContext.Provider.
 */
export function useFhirClient(): Client {
  const client = useContext(FhirClientContext);
  if (!client) {
    throw new Error(
      'useFhirClient must be used within a FhirClientContext.Provider. ' +
      'Ensure the app was launched via the SMART on FHIR flow.'
    );
  }
  return client;
}
