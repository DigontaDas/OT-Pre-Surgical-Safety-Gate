import { describe, it, expect } from 'vitest';
import { runSafetyChecks, SafetyInputs } from './safetyEngine';
import { LOINC_CODES } from '../../config/loincCodes';

describe('safetyEngine', () => {
  const basePatientId = 'patient-123';
  
  // Valid CPT procedure: 27447 (Total Knee Arthroplasty)
  const validCptProcedure: import('../../types/safety').ProcedureInfo = {
    id: 'proc-1',
    code: { code: '27447', display: 'Total Knee Arthroplasty', system: 'http://www.ama-assn.org/go/cpt' },
    status: 'scheduled',
    scheduledDate: new Date().toISOString()
  };
  
  // Matching SNOMED diagnosis: 239873007 (Osteoarthritis of knee)
  const matchingSnomedDiagnosis: import('../../types/safety').DiagnosisInfo = {
    id: 'diag-1',
    code: { code: '239873007', display: 'Osteoarthritis of knee', system: 'http://snomed.info/sct' },
    clinicalStatus: 'active',
    matchesProcedure: true
  };

  // Mismatched SNOMED diagnosis: 74400008 (Appendicitis)
  const mismatchedDiagnosis: import('../../types/safety').DiagnosisInfo = {
    id: 'diag-2',
    code: { code: '74400008', display: 'Appendicitis', system: 'http://snomed.info/sct' },
    clinicalStatus: 'active',
    matchesProcedure: false
  };

  const validConsent: import('../../types/safety').ConsentInfo = {
    id: 'cons-1',
    status: 'active',
    dateTime: new Date().toISOString(),
    matchesProcedure: true
  };

  const validLabs: import('../../types/safety').LabResult[] = [
    { name: 'Platelets', loincCode: LOINC_CODES.PLATELET_COUNT, value: 200, unit: '10*3/uL', status: 'normal', effectiveDate: new Date().toISOString() },
    { name: 'PT/INR', loincCode: LOINC_CODES.PT_INR, value: 1.0, unit: '', status: 'normal', effectiveDate: new Date().toISOString() },
    { name: 'Hemoglobin', loincCode: LOINC_CODES.HEMOGLOBIN, value: 14, unit: 'g/dL', status: 'normal', effectiveDate: new Date().toISOString() }
  ];

  it('should pass and decide SAFE when CPT procedure matches SNOMED diagnosis with normal labs and active consent', () => {
    const inputs: SafetyInputs = {
      patientId: basePatientId,
      procedures: [validCptProcedure],
      diagnoses: [matchingSnomedDiagnosis],
      consents: [validConsent],
      allergies: [],
      labs: validLabs
    };
    
    const report = runSafetyChecks(inputs);
    
    expect(report.patientId).toBe(basePatientId);
    expect(report.checks.find(c => c.id === 'procedure')?.status).toBe('pass');
    expect(report.checks.find(c => c.id === 'diagnosis')?.status).toBe('pass');
    expect(report.checks.find(c => c.id === 'consent')?.status).toBe('pass');
    expect(report.checks.find(c => c.id === 'allergy')?.status).toBe('pass');
    expect(report.checks.find(c => c.id === 'labs')?.status).toBe('pass');
    expect(report.overallDecision).toBe('safe');
  });

  it('should warn when CPT procedure does not match the active SNOMED diagnosis', () => {
    const inputs: SafetyInputs = {
      patientId: basePatientId,
      procedures: [validCptProcedure],
      diagnoses: [mismatchedDiagnosis],
      consents: [validConsent],
      allergies: [],
      labs: validLabs
    };
    
    const report = runSafetyChecks(inputs);
    expect(report.checks.find(c => c.id === 'diagnosis')?.status).toBe('warning');
    expect(report.overallDecision).toBe('conditional');
  });

  it('should fail and block surgery if no active surgical consent exists', () => {
    const inputs: SafetyInputs = {
      patientId: basePatientId,
      procedures: [validCptProcedure],
      diagnoses: [matchingSnomedDiagnosis],
      consents: [],
      allergies: [],
      labs: validLabs
    };
    
    const report = runSafetyChecks(inputs);
    expect(report.checks.find(c => c.id === 'consent')?.status).toBe('fail');
    expect(report.overallDecision).toBe('blocked');
  });

  it('should warn when patient has surgical antibiotic allergy (e.g. Penicillin)', () => {
    const inputs: SafetyInputs = {
      patientId: basePatientId,
      procedures: [validCptProcedure],
      diagnoses: [matchingSnomedDiagnosis],
      consents: [validConsent],
      allergies: [
        { substance: 'Penicillin', criticality: 'high', isSurgicalAntibiotic: true, type: 'allergy', substanceCode: { code: '91936005', system: 'http://snomed.info/sct', display: 'Allergy to penicillin' } }
      ],
      labs: validLabs
    };
    
    const report = runSafetyChecks(inputs);
    expect(report.checks.find(c => c.id === 'allergy')?.status).toBe('warning');
    expect(report.overallDecision).toBe('conditional');
  });

  it('should fail and block surgery when critical lab values are detected (e.g. critical thrombocytopenia)', () => {
    const criticalLabs: import('../../types/safety').LabResult[] = [
      { name: 'Platelets', loincCode: LOINC_CODES.PLATELET_COUNT, value: 35, unit: '10*3/uL', status: 'critical', effectiveDate: new Date().toISOString() },
      { name: 'PT/INR', loincCode: LOINC_CODES.PT_INR, value: 1.0, unit: '', status: 'normal', effectiveDate: new Date().toISOString() },
      { name: 'Hemoglobin', loincCode: LOINC_CODES.HEMOGLOBIN, value: 14, unit: 'g/dL', status: 'normal', effectiveDate: new Date().toISOString() }
    ];

    const inputs: SafetyInputs = {
      patientId: basePatientId,
      procedures: [validCptProcedure],
      diagnoses: [matchingSnomedDiagnosis],
      consents: [validConsent],
      allergies: [],
      labs: criticalLabs
    };
    
    const report = runSafetyChecks(inputs);
    expect(report.checks.find(c => c.id === 'labs')?.status).toBe('fail');
    expect(report.overallDecision).toBe('blocked');
  });
});

