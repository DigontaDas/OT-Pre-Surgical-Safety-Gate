import { useEffect, useRef, useState } from 'react';
import { usePatient, useSafetyCheck } from '../../hooks/fhirHooks';
import { useFhirClient } from '../../services/auth/FhirClientContext';
import { PatientBanner } from '../../components/PatientBanner';
import { SafetyCard } from '../../components/SafetyCard';
import { OverrideModal } from '../../components/OverrideModal';
import { CheckCircle, AlertTriangle, XCircle, ShieldCheck, FileEdit, RotateCcw } from 'lucide-react';
import type { ClinicalOverride } from '../../types/safety';
import gsap from 'gsap';

import { logPatientAccess } from '../../services/auth/auditLogger';

interface DashboardPageProps {
  onNavigateToExport?: () => void;
}

export function DashboardPage({ onNavigateToExport }: DashboardPageProps) {
  const client = useFhirClient();
  const { data: patient, isLoading: patientLoading } = usePatient();
  const { safetyReport, isLoading: safetyLoading, error } = useSafetyCheck();
  
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [override, setOverride] = useState<ClinicalOverride | null>(() => {
    try {
      const saved = sessionStorage.getItem(`clinical_override_${client.patient.id}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Keep safetyReport.override in sync if present
  if (safetyReport && override) {
    safetyReport.override = override;
  }

  // Effect to log patient access
  useEffect(() => {
    if (patient) {
      logPatientAccess(client);
    }
  }, [patient, client]);

  // Antigravity GSAP Animation Effect
  useEffect(() => {
    if (!patientLoading && !safetyLoading && safetyReport && containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.safety-card');
      const decisionBox = containerRef.current.querySelector('.safety-decision');
      const banner = containerRef.current.querySelector('.patient-banner');
      
      gsap.fromTo(
        banner,
        { opacity: 0, y: -20, rotateX: 10 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, ease: "power3.out" }
      );

      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.6, 
          stagger: 0.1, 
          ease: "back.out(1.2)",
          delay: 0.2
        }
      );

      gsap.fromTo(
        decisionBox,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.6 + (cards.length * 0.1), ease: "power3.out" }
      );
    }
  }, [patientLoading, safetyLoading, safetyReport]);

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

  const activeWarnings = safetyReport.checks
    .filter(c => c.status === 'warning')
    .flatMap(c => {
      const warningDetails = c.details.filter(d => d.severity === 'warning').map(d => d.message);
      return warningDetails.length > 0 ? warningDetails : [c.summary];
    });

  const handleSaveOverride = (newOverride: ClinicalOverride) => {
    setOverride(newOverride);
    if (safetyReport) {
      safetyReport.override = newOverride;
    }
    try {
      sessionStorage.setItem(`clinical_override_${client.patient.id}`, JSON.stringify(newOverride));
    } catch (e) {
      console.warn('Failed to persist override to sessionStorage', e);
    }
  };

  const handleRevokeOverride = () => {
    setOverride(null);
    if (safetyReport) {
      delete safetyReport.override;
    }
    try {
      sessionStorage.removeItem(`clinical_override_${client.patient.id}`);
    } catch (e) {
      console.warn('Failed to remove override from sessionStorage', e);
    }
  };

  const isOverridden = Boolean(override);

  return (
    <div ref={containerRef}>
      <PatientBanner patient={patient} />

      <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>
        PRE-SURGICAL CHECKLIST
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {safetyReport.checks.map((check: import('../../types/safety').CheckResult, idx: number) => (
          <SafetyCard key={check.id} check={check} index={idx + 1} />
        ))}
      </div>

      <div className={`safety-decision safety-decision--${isOverridden ? 'safe' : safetyReport.overallDecision}`}>
        <div className="safety-decision__icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          {isOverridden ? (
            <ShieldCheck size={48} color="var(--color-pass)" />
          ) : safetyReport.overallDecision === 'safe' ? (
            <CheckCircle size={48} color="var(--color-pass)" />
          ) : safetyReport.overallDecision === 'conditional' ? (
            <AlertTriangle size={48} color="var(--color-warning)" />
          ) : (
            <XCircle size={48} color="var(--color-fail)" />
          )}
        </div>

        <h2 className="safety-decision__title">
          {isOverridden
            ? 'OVERRIDE AUTHORIZED — SAFE TO PROCEED'
            : safetyReport.overallDecision === 'safe'
            ? 'SAFE TO PROCEED'
            : safetyReport.overallDecision === 'conditional'
            ? 'CONDITIONAL PROCEED'
            : 'NOT SAFE TO PROCEED'}
        </h2>

        <p className="safety-decision__message">
          {isOverridden
            ? `Clinical override signed by ${override?.clinicianName} (${override?.role}) on ${new Date(override?.timestamp || '').toLocaleDateString()} at ${new Date(override?.timestamp || '').toLocaleTimeString()}. Surgical clearance granted under documented precautions.`
            : safetyReport.overallMessage}
        </p>

        {/* Display Active Override Note Details */}
        {isOverridden && override && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '16px 20px',
            margin: '16px auto',
            maxWidth: '620px',
            textAlign: 'left',
            border: '1px solid #cbd5e1',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Attending Justification Note
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {override.clinicianName} • {override.role}
              </span>
            </div>
            <p style={{ margin: 0, fontStyle: 'italic', color: '#1e293b', fontSize: '0.9rem', lineHeight: '1.5' }}>
              "{override.reason}"
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <button 
            className="btn btn--primary"
            disabled={!isOverridden && safetyReport.overallDecision === 'blocked'}
            onClick={onNavigateToExport}
          >
            Generate Pre-Op Summary →
          </button>

          {safetyReport.overallDecision === 'conditional' && !isOverridden && (
            <button 
              className="btn btn--secondary"
              onClick={() => setIsOverrideModalOpen(true)}
            >
              Override with Note
            </button>
          )}

          {isOverridden && (
            <>
              <button 
                className="btn btn--secondary"
                onClick={() => setIsOverrideModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileEdit size={16} /> Edit Override
              </button>
              <button 
                className="btn btn--secondary"
                onClick={handleRevokeOverride}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}
              >
                <RotateCcw size={16} /> Revoke
              </button>
            </>
          )}
        </div>
      </div>

      <OverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        onSave={handleSaveOverride}
        warnings={activeWarnings}
        existingOverride={override || undefined}
      />
    </div>
  );
}

