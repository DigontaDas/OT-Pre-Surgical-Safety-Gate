/**
 * Safety Gate Status Types
 * Core domain types for the OT Pre-Surgical Safety Gate
 */

export type SafetyStatus = 'pass' | 'warning' | 'fail' | 'loading' | 'unknown';

export type OverallSafetyDecision = 'safe' | 'conditional' | 'blocked' | 'pending';

export interface CheckResult {
  /** Unique identifier for this check */
  id: string;
  /** Human-readable check title */
  title: string;
  /** The safety status of this check */
  status: SafetyStatus;
  /** Short summary message displayed in the card header */
  summary: string;
  /** Detailed messages (can include multiple findings) */
  details: CheckDetail[];
  /** Raw FHIR data associated with this check (for document generation) */
  rawData?: unknown;
}

export interface CheckDetail {
  /** The detail message */
  message: string;
  /** Severity of this detail */
  severity: 'info' | 'warning' | 'error' | 'success';
  /** Optional clinical code (e.g., SNOMED, LOINC) */
  code?: ClinicalCode;
}

export interface ClinicalCode {
  /** The code system URI (e.g., http://snomed.info/sct) */
  system: string;
  /** The code value */
  code: string;
  /** Human-readable display name */
  display: string;
}

export interface ClinicalOverride {
  /** Clinician name signing the override */
  clinicianName: string;
  /** Role or title (e.g., Attending Surgeon) */
  role: string;
  /** Clinical justification for proceeding despite warnings */
  reason: string;
  /** ISO timestamp when override was signed */
  timestamp: string;
  /** Warnings acknowledged during override */
  acknowledgedWarnings: string[];
}

export interface SafetyReport {
  /** Patient ID this report is for */
  patientId: string;
  /** Timestamp when the safety check was performed */
  timestamp: string;
  /** Individual check results */
  checks: CheckResult[];
  /** Overall decision based on all checks */
  overallDecision: OverallSafetyDecision;
  /** Overall decision summary message */
  overallMessage: string;
  /** Optional clinician override details if warnings were overridden */
  override?: ClinicalOverride;
}

export interface LabResult {
  /** LOINC code for the lab test */
  loincCode: string;
  /** Display name of the lab test */
  name: string;
  /** Numeric value */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Date the test was performed */
  effectiveDate: string;
  /** Whether the value is within acceptable range */
  status: 'normal' | 'abnormal' | 'critical';
  /** Reference range description */
  referenceRange?: string;
}

export interface AllergyInfo {
  /** Substance the patient is allergic to */
  substance: string;
  /** SNOMED code for the substance */
  substanceCode?: ClinicalCode;
  /** Criticality: low | high | unable-to-assess */
  criticality: string;
  /** Type: allergy | intolerance */
  type: string;
  /** Whether this conflicts with surgical antibiotics */
  isSurgicalAntibiotic: boolean;
}

export interface ProcedureInfo {
  /** FHIR resource ID */
  id: string;
  /** Procedure code */
  code: ClinicalCode;
  /** Procedure status */
  status: string;
  /** Scheduled date */
  scheduledDate?: string;
}

export interface DiagnosisInfo {
  /** FHIR resource ID */
  id: string;
  /** Condition code */
  code: ClinicalCode;
  /** Clinical status */
  clinicalStatus: string;
  /** Whether this diagnosis matches the scheduled procedure */
  matchesProcedure: boolean;
}

export interface ConsentInfo {
  /** FHIR resource ID */
  id: string;
  /** Consent status */
  status: string;
  /** Date consent was signed */
  dateTime?: string;
  /** Whether consent scope matches scheduled procedure */
  matchesProcedure: boolean;
}

export interface PatientSummary {
  /** FHIR resource ID */
  id: string;
  /** Patient's full name */
  name: string;
  /** Date of birth */
  birthDate: string;
  /** Gender */
  gender: string;
  /** Medical Record Number */
  mrn?: string;
  /** Patient's initials for avatar */
  initials: string;
  /** Calculated age */
  age: number;
}
