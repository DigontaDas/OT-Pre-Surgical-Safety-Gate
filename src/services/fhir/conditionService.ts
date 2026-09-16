/**
 * Condition Service — FHIR Condition resource operations
 */
import type Client from 'fhirclient/lib/Client';
import type { Bundle, BundleEntry, Condition } from 'fhir/r4';
import type { DiagnosisInfo, ClinicalCode } from '../../types/safety';
import { SNOMED_SYSTEM, PROCEDURE_DIAGNOSIS_MAP } from '../../config/snomedMappings';

/**
 * Fetch active conditions for the current patient.
 */
export async function fetchConditions(client: Client): Promise<DiagnosisInfo[]> {
  const patientId = client.patient.id;
  const results: DiagnosisInfo[] = [];

  try {
    const bundle = await client.request<Bundle>(
      `Condition?patient=${patientId}&clinical-status=active&_count=50`
    );
    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const cond = (entry as BundleEntry<Condition>).resource;
        if (cond) {
          const info = toDiagnosisInfo(cond);
          if (info) results.push(info);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Condition resources:', e);
  }

  return results;
}

/**
 * Extract coded DiagnosisInfo from a FHIR Condition resource.
 */
function toDiagnosisInfo(cond: Condition): DiagnosisInfo | null {
  if (!cond.id) return null;

  const coding = cond.code?.coding?.find(c => c.system === SNOMED_SYSTEM)
    || cond.code?.coding?.[0];

  const code: ClinicalCode = coding
    ? { system: coding.system || '', code: coding.code || '', display: coding.display || cond.code?.text || '' }
    : { system: '', code: '', display: cond.code?.text || 'Unknown Condition' };

  // clinicalStatus is a CodeableConcept
  const clinicalStatusCoding = cond.clinicalStatus?.coding?.[0];
  const clinicalStatus = clinicalStatusCoding?.code || 'active';

  return {
    id: cond.id,
    code,
    clinicalStatus,
    matchesProcedure: false, // Default false, evaluated later by the safety engine
  };
}

/**
 * Utility to evaluate if a diagnosis SNOMED code supports a scheduled procedure.
 */
export function checkDiagnosisMatch(procedureCode: string, diagnosisCode: string): boolean {
  const allowedDiagnoses = PROCEDURE_DIAGNOSIS_MAP[procedureCode];
  if (!allowedDiagnoses) return false;
  return allowedDiagnoses.includes(diagnosisCode);
}
