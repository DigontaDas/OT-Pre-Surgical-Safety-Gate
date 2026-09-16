/**
 * Patient Service — FHIR Patient resource operations
 */
import type Client from 'fhirclient/lib/Client';
import type { Patient } from 'fhir/r4';
import type { PatientSummary } from '../../types/safety';

/**
 * Fetch the current patient from the FHIR server.
 * Uses the patient ID from the launch context.
 */
export async function fetchPatient(client: Client): Promise<Patient> {
  return client.patient.read() as Promise<Patient>;
}

/**
 * Transform a FHIR Patient resource into a simplified PatientSummary.
 * Extracts only the display-necessary fields (PHI minimization).
 */
export function toPatientSummary(patient: Patient): PatientSummary {
  const name = patient.name?.[0];
  const fullName = name
    ? `${name.given?.join(' ') || ''} ${name.family || ''}`.trim()
    : 'Unknown Patient';

  const initials = name
    ? `${(name.given?.[0] || '?')[0]}${(name.family || '?')[0]}`.toUpperCase()
    : '??';

  const birthDate = patient.birthDate || 'Unknown';
  const age = birthDate !== 'Unknown'
    ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  const mrn = patient.identifier?.find(
    id => id.type?.coding?.some(c => c.code === 'MR')
  )?.value;

  return {
    id: patient.id || '',
    name: fullName,
    birthDate,
    gender: patient.gender || 'unknown',
    mrn,
    initials,
    age,
  };
}
