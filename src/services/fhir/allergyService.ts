/**
 * Allergy Service — FHIR AllergyIntolerance resource operations
 */
import type Client from 'fhirclient/lib/Client';
import type { Bundle, BundleEntry, AllergyIntolerance } from 'fhir/r4';
import type { AllergyInfo, ClinicalCode } from '../../types/safety';
import { SNOMED_SYSTEM, isSurgicalAntibiotic } from '../../config/snomedMappings';

/**
 * Fetch allergies for the current patient.
 */
export async function fetchAllergies(client: Client): Promise<AllergyInfo[]> {
  const patientId = client.patient.id;
  const results: AllergyInfo[] = [];

  try {
    const bundle = await client.request<Bundle>(
      `AllergyIntolerance?patient=${patientId}&_count=50`
    );
    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const allergy = (entry as BundleEntry<AllergyIntolerance>).resource;
        if (allergy) {
          const info = toAllergyInfo(allergy);
          if (info) results.push(info);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch AllergyIntolerance resources:', e);
  }

  return results;
}

/**
 * Extract AllergyInfo from a FHIR AllergyIntolerance resource.
 */
function toAllergyInfo(allergy: AllergyIntolerance): AllergyInfo | null {
  if (!allergy.id) return null;

  const coding = allergy.code?.coding?.find(c => c.system === SNOMED_SYSTEM)
    || allergy.code?.coding?.[0];

  const code: ClinicalCode | undefined = coding
    ? { system: coding.system || '', code: coding.code || '', display: coding.display || allergy.code?.text || '' }
    : undefined;

  const substanceStr = code?.display || allergy.code?.text || 'Unknown Substance';
  const isAntibiotic = code && code.system === SNOMED_SYSTEM
    ? isSurgicalAntibiotic(code.code)
    : false;

  return {
    substance: substanceStr,
    substanceCode: code,
    criticality: allergy.criticality || 'unable-to-assess',
    type: allergy.type || 'allergy',
    isSurgicalAntibiotic: isAntibiotic,
  };
}
