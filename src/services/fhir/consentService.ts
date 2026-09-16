/**
 * Consent Service — FHIR Consent resource operations
 */
import type Client from 'fhirclient/lib/Client';
import type { Bundle, BundleEntry, Consent } from 'fhir/r4';
import type { ConsentInfo } from '../../types/safety';

/**
 * Fetch active consents for the current patient.
 */
export async function fetchConsents(client: Client): Promise<ConsentInfo[]> {
  const patientId = client.patient.id;
  const results: ConsentInfo[] = [];

  try {
    const bundle = await client.request<Bundle>(
      `Consent?patient=${patientId}&status=active&_count=20`
    );
    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const consent = (entry as BundleEntry<Consent>).resource;
        if (consent) {
          const info = toConsentInfo(consent);
          if (info) results.push(info);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Consent resources:', e);
  }

  return results;
}

/**
 * Extract ConsentInfo from a FHIR Consent resource.
 */
function toConsentInfo(consent: Consent): ConsentInfo | null {
  if (!consent.id) return null;

  return {
    id: consent.id,
    status: consent.status,
    dateTime: consent.dateTime,
    matchesProcedure: false, // Default false, evaluated later by safety engine
  };
}
