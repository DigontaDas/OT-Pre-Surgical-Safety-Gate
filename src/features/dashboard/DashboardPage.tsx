import { useEffect } from 'react';
import { usePatient, useSafetyCheck } from '../../hooks/fhirHooks';
import { useFhirClient } from '../../services/auth/FhirClientContext';
import { PatientBanner } from '../../components/PatientBanner';
import { SafetyCard } from '../../components/SafetyCard';

import { logPatientAccess } from '../../services/auth/auditLogger';

export function DashboardPage() {
  const client = useFhirClient();
  const { data: patient, isLoading: patientLoading } = usePatient();
  const { safetyReport, isLoading: safetyLoading, error } = useSafetyCheck();

  if (patientLoading || safetyLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading patient clinical data and running safety checks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2 className="error-container__title">Error Fetching Data</h2>
        <p className="error-container__message">
          There was a problem communicating with the FHIR server.
        </p>
      </div>
    );
  }

  if (!patient || !safetyReport) {
    return null;
  }

  // Effect to log patient access
  useEffect(() => {
    if (patient) {
      logPatientAccess(client);
    }
  }, [patient, client]);

  return (
    <div>
      <PatientBanner patient={patient} />

      <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
        PRE-SURGICAL CHECKLIST
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {safetyReport.checks.map((check: import('../../types/safety').CheckResult, idx: number) => (
          <SafetyCard key={check.id} check={check} index={idx + 1} />
        ))}
      </div>

      <div className={`safety-decision safety-decision--${safetyReport.overallDecision}`}>
        <div className="safety-decision__icon">
          {safetyReport.overallDecision === 'safe' && '✅'}
          {safetyReport.overallDecision === 'conditional' && '⚠️'}
          {safetyReport.overallDecision === 'blocked' && '❌'}
        </div>
        <h2 className="safety-decision__title">
          {safetyReport.overallDecision === 'safe' && 'SAFE TO PROCEED'}
          {safetyReport.overallDecision === 'conditional' && 'CONDITIONAL PROCEED'}
          {safetyReport.overallDecision === 'blocked' && 'NOT SAFE TO PROCEED'}
        </h2>
        <p className="safety-decision__message">{safetyReport.overallMessage}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
          <button 
            className="btn btn--primary"
            disabled={safetyReport.overallDecision === 'blocked'}
          >
            Generate Pre-Op Summary
          </button>
          {safetyReport.overallDecision === 'conditional' && (
            <button className="btn btn--secondary">
              Override with Note
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
