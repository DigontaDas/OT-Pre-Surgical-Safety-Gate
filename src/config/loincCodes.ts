/**
 * LOINC Code Constants
 * Standard laboratory test codes used for pre-surgical safety checks.
 * These are universally standardized — the same code always means
 * the same test regardless of which hospital or lab system generated it.
 */

export const LOINC_CODES = {
  /** Platelet count in blood */
  PLATELET_COUNT: '777-3',
  /** Prothrombin time / INR */
  PT_INR: '5902-2',
  /** Activated Partial Thromboplastin Time */
  APTT: '3173-2',
  /** Hemoglobin in blood */
  HEMOGLOBIN: '718-7',
  /** White blood cell count */
  WBC: '6690-2',
} as const;

export type LoincCode = typeof LOINC_CODES[keyof typeof LOINC_CODES];

/** LOINC system URI for FHIR queries */
export const LOINC_SYSTEM = 'http://loinc.org';

/** Display names for each LOINC code */
export const LOINC_DISPLAY: Record<LoincCode, string> = {
  [LOINC_CODES.PLATELET_COUNT]: 'Platelet Count',
  [LOINC_CODES.PT_INR]: 'PT/INR',
  [LOINC_CODES.APTT]: 'aPTT',
  [LOINC_CODES.HEMOGLOBIN]: 'Hemoglobin',
  [LOINC_CODES.WBC]: 'WBC Count',
};

/** Units for each lab test */
export const LOINC_UNITS: Record<LoincCode, string> = {
  [LOINC_CODES.PLATELET_COUNT]: '× 10³/µL',
  [LOINC_CODES.PT_INR]: 'ratio',
  [LOINC_CODES.APTT]: 'sec',
  [LOINC_CODES.HEMOGLOBIN]: 'g/dL',
  [LOINC_CODES.WBC]: '× 10³/µL',
};

/**
 * Builds the FHIR query parameter value for filtering Observations
 * by our required LOINC codes. This ensures code-based lookup
 * (not string matching) as required by the project specification.
 *
 * Usage: GET /Observation?patient={id}&code={getLoincQueryParam()}
 */
export function getLoincQueryParam(): string {
  return Object.values(LOINC_CODES)
    .map(code => `${LOINC_SYSTEM}|${code}`)
    .join(',');
}
