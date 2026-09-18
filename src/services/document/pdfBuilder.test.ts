import { describe, it, expect } from 'vitest';
import { generatePreopPdf } from './pdfBuilder';
import type { SafetyReport } from '../../types/safety';

describe('pdfBuilder', () => {
  const sampleReport: SafetyReport = {
    patientId: 'patient-test-1',
    overallDecision: 'safe',
    overallMessage: 'Safe to proceed with surgery',
    timestamp: new Date().toISOString(),
    checks: [
      {
        id: 'procedure',
        title: 'Surgical Procedure Verification',
        status: 'pass',
        summary: 'Total Knee Arthroplasty (CPT 27447) scheduled',
        details: [
          {
            message: 'Scheduled CPT: Total Knee Arthroplasty',
            severity: 'info',
            code: { code: '27447', display: 'Total Knee Arthroplasty', system: 'http://www.ama-assn.org/go/cpt' }
          }
        ]
      },
      {
        id: 'diagnosis',
        title: 'Clinical Diagnosis Match',
        status: 'pass',
        summary: 'Osteoarthritis of knee (SNOMED 239873007) verified',
        details: [
          {
            message: 'Active diagnosis matches surgical indication',
            severity: 'success',
            code: { code: '239873007', display: 'Osteoarthritis of knee', system: 'http://snomed.info/sct' }
          }
        ]
      },
      {
        id: 'consent',
        title: 'Surgical Consent',
        status: 'pass',
        summary: 'Active signed consent found',
        details: [
          {
            message: 'Consent signed and matched to procedure',
            severity: 'success'
          }
        ]
      },
      {
        id: 'labs',
        title: 'Pre-Op Safety Labs',
        status: 'pass',
        summary: 'All lab values in normal pre-op ranges',
        details: [
          {
            message: 'Platelet Count: 210 10*3/uL',
            severity: 'info',
            code: { code: '777-3', display: 'Platelets', system: 'http://loinc.org' }
          },
          {
            message: 'PT/INR: 1.1',
            severity: 'info',
            code: { code: '6301-6', display: 'INR', system: 'http://loinc.org' }
          }
        ]
      },
      {
        id: 'allergies',
        title: 'Allergy & Antibiotic Safety',
        status: 'pass',
        summary: 'No contraindications detected',
        details: [
          {
            message: 'No active contraindications for surgical antibiotics',
            severity: 'success'
          }
        ]
      }
    ]
  };

  it('generates a valid jsPDF document instance', () => {
    const doc = generatePreopPdf(sampleReport, {
      id: 'patient-test-1',
      name: 'Sarah Johnson',
      birthDate: '1985-04-12',
      gender: 'female',
      mrn: 'MRN-123456'
    });

    expect(doc).toBeDefined();
    expect(doc.internal.pages.length).toBeGreaterThan(0);
    const output = doc.output('datauristring');
    expect(output).toContain('data:application/pdf');
  });

  it('handles clinical overrides correctly in PDF', () => {
    const overriddenReport: SafetyReport = {
      ...sampleReport,
      overallDecision: 'conditional',
      override: {
        clinicianName: 'Dr. Gregory House',
        role: 'Attending Surgeon',
        reason: 'Emergency Surgical Clearance - Urgent Benefit Outweighs Elevated Clotting Time',
        acknowledgedWarnings: ['Elevated INR 2.1'],
        timestamp: new Date().toISOString()
      }
    };

    const doc = generatePreopPdf(overriddenReport, {
      id: 'patient-test-1',
      name: 'Sarah Johnson'
    });

    expect(doc).toBeDefined();
    const output = doc.output('datauristring');
    expect(output).toContain('data:application/pdf');
  });
});
