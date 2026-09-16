/**
 * Observation Service — FHIR Observation resource operations (Labs)
 */
import type Client from 'fhirclient/lib/Client';
import type { Bundle, BundleEntry, Observation, Quantity } from 'fhir/r4';
import type { LabResult } from '../../types/safety';
import { LOINC_SYSTEM, LOINC_DISPLAY, LOINC_UNITS, getLoincQueryParam } from '../../config/loincCodes';
import { evaluateLabValue } from '../../config/safetyThresholds';

/**
 * Fetch most recent lab results for our target LOINC codes.
 */
export async function fetchLabResults(client: Client): Promise<LabResult[]> {
  const patientId = client.patient.id;
  const results: LabResult[] = [];
  const loincQuery = getLoincQueryParam();

  try {
    // Fetch Observations filtered strictly by our target LOINC codes
    const bundle = await client.request<Bundle>(
      `Observation?patient=${patientId}&code=${loincQuery}&_sort=-date&_count=20`
    );
    
    if (bundle.entry) {
      // We only want the most recent result for each LOINC code
      const seenCodes = new Set<string>();
      
      for (const entry of bundle.entry) {
        const obs = (entry as BundleEntry<Observation>).resource;
        if (!obs) continue;

        const coding = obs.code?.coding?.find(c => c.system === LOINC_SYSTEM);
        const code = coding?.code;
        
        if (code && !seenCodes.has(code)) {
          seenCodes.add(code);
          const info = toLabResult(obs, code);
          if (info) results.push(info);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Observation resources:', e);
  }

  return results;
}

/**
 * Extract LabResult from a FHIR Observation resource.
 */
function toLabResult(obs: Observation, loincCode: string): LabResult | null {
  // We only handle numeric quantities for these specific labs
  const valueQuantity = obs.valueQuantity as Quantity | undefined;
  if (valueQuantity?.value === undefined) return null;

  const value = valueQuantity.value;
  const unit = valueQuantity.unit || LOINC_UNITS[loincCode as keyof typeof LOINC_UNITS] || '';
  const name = LOINC_DISPLAY[loincCode as keyof typeof LOINC_DISPLAY] || obs.code?.text || loincCode;
  const effectiveDate = obs.effectiveDateTime || 'Unknown';

  const status = evaluateLabValue(loincCode, value);
  
  // Extract reference range if provided by the EHR, otherwise we use our own thresholds logic
  const refRange = obs.referenceRange?.[0];
  let referenceRangeDesc = undefined;
  if (refRange?.text) {
    referenceRangeDesc = refRange.text;
  } else if (refRange?.low || refRange?.high) {
    const low = refRange.low?.value !== undefined ? refRange.low.value : '';
    const high = refRange.high?.value !== undefined ? refRange.high.value : '';
    referenceRangeDesc = `${low} - ${high} ${unit}`;
  }

  return {
    loincCode,
    name,
    value,
    unit,
    effectiveDate,
    status,
    referenceRange: referenceRangeDesc,
  };
}
