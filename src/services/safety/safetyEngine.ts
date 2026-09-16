/**
 * Safety Engine
 * Orchestrates all clinical safety checks and computes the final decision.
 */
import { CheckResult, OverallSafetyDecision, SafetyReport } from '../../types/safety';

export interface SafetyInputs {
  patientId: string;
  procedures: import('../../types/safety').ProcedureInfo[];
  diagnoses: import('../../types/safety').DiagnosisInfo[];
  consents: import('../../types/safety').ConsentInfo[];
  allergies: import('../../types/safety').AllergyInfo[];
  labs: import('../../types/safety').LabResult[];
}

export function runSafetyChecks(inputs: SafetyInputs): SafetyReport {
  const checks: CheckResult[] = [
    evaluateProcedure(inputs.procedures),
    evaluateDiagnosis(inputs.diagnoses, inputs.procedures),
    evaluateConsent(inputs.consents),
    evaluateAllergies(inputs.allergies),
    evaluateLabs(inputs.labs),
  ];

  let hasFail = false;
  let hasWarning = false;

  for (const check of checks) {
    if (check.status === 'fail') hasFail = true;
    if (check.status === 'warning') hasWarning = true;
  }

  let overallDecision: OverallSafetyDecision = 'safe';
  let overallMessage = 'All pre-surgical safety checks passed. Safe to proceed.';

  if (hasFail) {
    overallDecision = 'blocked';
    overallMessage = 'Critical safety checks failed. Procedure cannot proceed.';
  } else if (hasWarning) {
    overallDecision = 'conditional';
    overallMessage = 'Warnings detected. Surgeon review and override required.';
  }

  return {
    patientId: inputs.patientId,
    timestamp: new Date().toISOString(),
    checks,
    overallDecision,
    overallMessage,
  };
}

function evaluateProcedure(procedures: SafetyInputs['procedures']): CheckResult {
  const result: CheckResult = {
    id: 'procedure',
    title: 'Scheduled Procedure',
    status: 'unknown',
    summary: '',
    details: [],
    rawData: procedures,
  };

  if (procedures.length === 0) {
    result.status = 'fail';
    result.summary = 'No scheduled procedure found';
    result.details.push({
      severity: 'error',
      message: 'Patient has no active or scheduled surgical procedures.',
    });
    return result;
  }

  const proc = procedures[0];
  if (!proc.code.code) {
    result.status = 'warning';
    result.summary = 'Procedure is missing clinical code';
    result.details.push({
      severity: 'warning',
      message: `Procedure found ("${proc.code.display}") but lacks a SNOMED/standard code for verification.`,
    });
    return result;
  }

  result.status = 'pass';
  result.summary = 'Valid procedure scheduled';
  result.details.push({
    severity: 'success',
    message: `${proc.code.display} (Scheduled: ${proc.scheduledDate ? new Date(proc.scheduledDate).toLocaleDateString() : 'TBD'})`,
    code: proc.code,
  });

  return result;
}

import { checkDiagnosisMatch } from '../fhir/conditionService';

function evaluateDiagnosis(
  diagnoses: SafetyInputs['diagnoses'],
  procedures: SafetyInputs['procedures']
): CheckResult {
  const result: CheckResult = {
    id: 'diagnosis',
    title: 'Diagnosis Verification',
    status: 'unknown',
    summary: '',
    details: [],
    rawData: diagnoses,
  };

  if (procedures.length === 0 || !procedures[0].code.code) {
    result.status = 'warning';
    result.summary = 'Cannot verify without coded procedure';
    return result;
  }

  const procCode = procedures[0].code.code;
  let matchFound = false;
  let matchedDiag = null;

  for (const diag of diagnoses) {
    if (diag.code.code && checkDiagnosisMatch(procCode, diag.code.code)) {
      matchFound = true;
      matchedDiag = diag;
      break;
    }
  }

  if (matchFound && matchedDiag) {
    result.status = 'pass';
    result.summary = 'Diagnosis supports procedure';
    result.details.push({
      severity: 'success',
      message: `Verified supporting active diagnosis: ${matchedDiag.code.display}`,
      code: matchedDiag.code,
    });
  } else if (diagnoses.length > 0) {
    result.status = 'warning';
    result.summary = 'No matching diagnosis found';
    result.details.push({
      severity: 'warning',
      message: `Patient has ${diagnoses.length} active conditions, but none map to the scheduled procedure.`,
    });
  } else {
    result.status = 'fail';
    result.summary = 'No active diagnoses';
    result.details.push({
      severity: 'error',
      message: 'Patient has no active documented conditions.',
    });
  }

  return result;
}

function evaluateConsent(consents: SafetyInputs['consents']): CheckResult {
  const result: CheckResult = {
    id: 'consent',
    title: 'Surgical Consent',
    status: 'unknown',
    summary: '',
    details: [],
    rawData: consents,
  };

  if (consents.length === 0) {
    result.status = 'fail';
    result.summary = 'No consent record found';
    result.details.push({
      severity: 'error',
      message: 'No active surgical consent documented for this patient.',
    });
    return result;
  }

  const validConsent = consents.find(c => c.status === 'active');
  if (validConsent) {
    result.status = 'pass';
    result.summary = 'Active consent verified';
    result.details.push({
      severity: 'success',
      message: `Consent signed ${validConsent.dateTime ? new Date(validConsent.dateTime).toLocaleDateString() : '(date unknown)'}`,
    });
  } else {
    result.status = 'fail';
    result.summary = 'No ACTIVE consent found';
    result.details.push({
      severity: 'error',
      message: 'Consent records exist but none are in "active" status.',
    });
  }

  return result;
}

function evaluateAllergies(allergies: SafetyInputs['allergies']): CheckResult {
  const result: CheckResult = {
    id: 'allergy',
    title: 'Allergy Check',
    status: 'unknown',
    summary: '',
    details: [],
    rawData: allergies,
  };

  if (allergies.length === 0) {
    result.status = 'pass';
    result.summary = 'No known allergies (NKA)';
    result.details.push({
      severity: 'info',
      message: 'Patient has no documented allergies.',
    });
    return result;
  }

  const conflicts = allergies.filter(a => a.isSurgicalAntibiotic);

  if (conflicts.length > 0) {
    result.status = 'warning';
    result.summary = 'Surgical antibiotic conflict';
    for (const conflict of conflicts) {
      result.details.push({
        severity: 'warning',
        message: `Allergy to ${conflict.substance} (Criticality: ${conflict.criticality})`,
        code: conflict.substanceCode,
      });
    }
    result.details.push({
      severity: 'info',
      message: 'Alternative prophylactic antibiotics must be ordered.',
    });
  } else {
    result.status = 'pass';
    result.summary = 'No surgical antibiotic conflicts';
    result.details.push({
      severity: 'success',
      message: `Patient has ${allergies.length} allergies, none conflict with standard surgical antibiotics.`,
    });
  }

  return result;
}

import { LOINC_CODES, LOINC_DISPLAY } from '../../config/loincCodes';

function evaluateLabs(labs: SafetyInputs['labs']): CheckResult {
  const result: CheckResult = {
    id: 'labs',
    title: 'Laboratory Results',
    status: 'unknown',
    summary: '',
    details: [],
    rawData: labs,
  };

  // Required core labs
  const requiredLabs = [LOINC_CODES.PLATELET_COUNT, LOINC_CODES.PT_INR, LOINC_CODES.HEMOGLOBIN];
  const missingLabs = requiredLabs.filter(req => !labs.some(l => l.loincCode === req));

  let hasCritical = false;
  let hasAbnormal = false;

  for (const lab of labs) {
    let severity: 'success' | 'warning' | 'error' = 'success';
    if (lab.status === 'critical') {
      hasCritical = true;
      severity = 'error';
    } else if (lab.status === 'abnormal') {
      hasAbnormal = true;
      severity = 'warning';
    }

    result.details.push({
      severity,
      message: `${lab.name}: ${lab.value} ${lab.unit} ${lab.status !== 'normal' ? `(${lab.status.toUpperCase()})` : ''}`,
    });
  }

  if (missingLabs.length > 0) {
    hasAbnormal = true;
    for (const missing of missingLabs) {
      result.details.push({
        severity: 'warning',
        message: `Missing recent result for ${LOINC_DISPLAY[missing as keyof typeof LOINC_DISPLAY]}`,
      });
    }
  }

  if (hasCritical) {
    result.status = 'fail';
    result.summary = 'Critical lab values detected';
  } else if (hasAbnormal) {
    result.status = 'warning';
    result.summary = 'Abnormal or missing lab values';
  } else if (labs.length > 0) {
    result.status = 'pass';
    result.summary = 'All required labs within normal limits';
  } else {
    result.status = 'fail';
    result.summary = 'No lab results found';
  }

  return result;
}
