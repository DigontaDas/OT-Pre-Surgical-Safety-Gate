import { useQuery } from '@tanstack/react-query';
import { useFhirClient } from '../services/auth/FhirClientContext';
import { fetchPatient, toPatientSummary } from '../services/fhir/patientService';
import { fetchProcedures } from '../services/fhir/procedureService';
import { fetchConditions } from '../services/fhir/conditionService';
import { fetchConsents } from '../services/fhir/consentService';
import { fetchAllergies } from '../services/fhir/allergyService';
import { fetchLabResults } from '../services/fhir/observationService';
import { runSafetyChecks } from '../services/safety/safetyEngine';
import type { SafetyReport } from '../types/safety';

export function usePatient() {
  const client = useFhirClient();
  return useQuery({
    queryKey: ['patient', client.patient.id],
    queryFn: async () => {
      const p = await fetchPatient(client);
      return toPatientSummary(p);
    },
  });
}

export function useProcedures() {
  const client = useFhirClient();
  return useQuery({
    queryKey: ['procedures', client.patient.id],
    queryFn: () => fetchProcedures(client),
  });
}

export function useConditions() {
  const client = useFhirClient();
  return useQuery({
    queryKey: ['conditions', client.patient.id],
    queryFn: () => fetchConditions(client),
  });
}

export function useConsents() {
  const client = useFhirClient();
  return useQuery({
    queryKey: ['consents', client.patient.id],
    queryFn: () => fetchConsents(client),
  });
}

export function useAllergies() {
  const client = useFhirClient();
  return useQuery({
    queryKey: ['allergies', client.patient.id],
    queryFn: () => fetchAllergies(client),
  });
}

export function useLabResults() {
  const client = useFhirClient();
  return useQuery({
    queryKey: ['labs', client.patient.id],
    queryFn: () => fetchLabResults(client),
  });
}

/**
 * Composite hook that fetches all required data and runs the safety engine.
 */
export function useSafetyCheck() {
  const client = useFhirClient();
  const patientId = client.patient.id || '';

  const { data: procedures, isLoading: pLoading, error: pError } = useProcedures();
  const { data: conditions, isLoading: cLoading, error: cError } = useConditions();
  const { data: consents, isLoading: sLoading, error: sError } = useConsents();
  const { data: allergies, isLoading: aLoading, error: aError } = useAllergies();
  const { data: labs, isLoading: lLoading, error: lError } = useLabResults();

  const isLoading = pLoading || cLoading || sLoading || aLoading || lLoading;
  const error = pError || cError || sError || aError || lError;

  let safetyReport: SafetyReport | null = null;

  if (!isLoading && !error && procedures && conditions && consents && allergies && labs) {
    safetyReport = runSafetyChecks({
      patientId,
      procedures,
      diagnoses: conditions,
      consents,
      allergies,
      labs,
    });

    if (patientId) {
      try {
        const saved = sessionStorage.getItem(`clinical_override_${patientId}`);
        if (saved) {
          safetyReport.override = JSON.parse(saved);
        }
      } catch (e) {
        // ignore parse error
      }
    }
  }

  return {
    safetyReport,
    isLoading,
    error,
  };
}
