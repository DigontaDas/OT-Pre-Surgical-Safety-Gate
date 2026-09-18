/**
 * Procedure Service — FHIR Procedure and ServiceRequest resource operations
 */
import type Client from 'fhirclient/lib/Client';
import type { Bundle, BundleEntry, Procedure, ServiceRequest, Coding } from 'fhir/r4';
import type { ProcedureInfo, ClinicalCode } from '../../types/safety';
import { SNOMED_SYSTEM, CPT_SYSTEM, CPT_SYSTEMS } from '../../config/snomedMappings';

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

function extractProcedureCoding(codings?: Coding[], fallbackText?: string): ClinicalCode {
  if (!codings || codings.length === 0) {
    return { system: '', code: '', display: fallbackText || 'Unknown Procedure' };
  }

  // Look for CPT coding (official procedure terminology) first, then SNOMED CT
  const cptCoding = codings.find(c => 
    CPT_SYSTEMS.includes(c.system || '') || c.system?.toLowerCase().includes('cpt')
  );
  const snomedCoding = codings.find(c => c.system === SNOMED_SYSTEM);
  const selected = cptCoding || snomedCoding || codings[0];

  return {
    system: selected.system || (cptCoding ? CPT_SYSTEM : ''),
    code: selected.code || '',
    display: selected.display || fallbackText || selected.code || 'Unknown Procedure'
  };
}

/**
 * Extract a coded ProcedureInfo from a FHIR Procedure resource.
 */
function toProcedureInfo(proc: Procedure): ProcedureInfo | null {
  if (!proc.id) return null;

  const code = extractProcedureCoding(proc.code?.coding, proc.code?.text);

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

  const code = extractProcedureCoding(req.code?.coding, req.code?.text);

  return {
    id: req.id,
    code,
    status: req.status || 'unknown',
    scheduledDate: req.authoredOn || undefined,
  };
}

