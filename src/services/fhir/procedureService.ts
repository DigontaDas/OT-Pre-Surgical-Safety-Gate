/**
 * Procedure Service — FHIR Procedure and ServiceRequest resource operations
 */
import type Client from 'fhirclient/lib/Client';
import type { Bundle, BundleEntry, Procedure, ServiceRequest } from 'fhir/r4';
import type { ProcedureInfo, ClinicalCode } from '../../types/safety';
import { SNOMED_SYSTEM } from '../../config/snomedMappings';

/**
 * Fetch scheduled/preparation procedures for the current patient.
 * Tries Procedure resources first, falls back to ServiceRequest.
 */
export async function fetchProcedures(client: Client): Promise<ProcedureInfo[]> {
  const patientId = client.patient.id;
  const results: ProcedureInfo[] = [];

  // Try Procedure resources (status: preparation, in-progress)
  try {
    const bundle = await client.request<Bundle>(
      `Procedure?patient=${patientId}&_sort=-date&_count=20`
    );
    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const proc = (entry as BundleEntry<Procedure>).resource;
        if (proc) {
          const info = toProcedureInfo(proc);
          if (info) results.push(info);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Procedure resources:', e);
  }

  // Also try ServiceRequest resources (in case procedures are ordered but not started)
  try {
    const bundle = await client.request<Bundle>(
      `ServiceRequest?patient=${patientId}&status=active&_sort=-authored&_count=10`
    );
    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const req = (entry as BundleEntry<ServiceRequest>).resource;
        if (req) {
          const info = serviceRequestToProcedureInfo(req);
          if (info) results.push(info);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch ServiceRequest resources:', e);
  }

  return results;
}

/**
 * Extract a coded ProcedureInfo from a FHIR Procedure resource.
 */
function toProcedureInfo(proc: Procedure): ProcedureInfo | null {
  if (!proc.id) return null;

  const coding = proc.code?.coding?.find(c => c.system === SNOMED_SYSTEM)
    || proc.code?.coding?.[0];

  const code: ClinicalCode = coding
    ? { system: coding.system || '', code: coding.code || '', display: coding.display || proc.code?.text || '' }
    : { system: '', code: '', display: proc.code?.text || 'Unknown Procedure' };

  return {
    id: proc.id,
    code,
    status: proc.status || 'unknown',
    scheduledDate: proc.performedDateTime
      || (proc.performedPeriod?.start)
      || undefined,
  };
}

/**
 * Convert a ServiceRequest into a ProcedureInfo for unified handling.
 */
function serviceRequestToProcedureInfo(req: ServiceRequest): ProcedureInfo | null {
  if (!req.id) return null;

  const coding = req.code?.coding?.find(c => c.system === SNOMED_SYSTEM)
    || req.code?.coding?.[0];

  const code: ClinicalCode = coding
    ? { system: coding.system || '', code: coding.code || '', display: coding.display || req.code?.text || '' }
    : { system: '', code: '', display: req.code?.text || 'Unknown Procedure' };

  return {
    id: req.id,
    code,
    status: req.status || 'unknown',
    scheduledDate: req.authoredOn || undefined,
  };
}
