/**
 * Basic validator for clinical codes.
 * In a real application, this would call out to a terminology server
 * like Snowstorm to validate SNOMED CT codes or LOINC.
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export async function validateSnomedCode(code: string): Promise<ValidationResult> {
  // Mock implementation for demo purposes
  // In reality: GET https://snowstorm.example.com/snomed-ct/MAIN/concepts/{code}
  if (!code) {
    return { isValid: false, message: 'Code is empty' };
  }
  
  if (code.length < 5) {
    return { isValid: false, message: 'Invalid SNOMED CT code format' };
  }

  return { isValid: true };
}

export async function validateLoincCode(code: string): Promise<ValidationResult> {
  if (!code) {
    return { isValid: false, message: 'Code is empty' };
  }
  
  // Basic LOINC format check (e.g., 1234-5)
  const loincRegex = /^\d+-\d+$/;
  if (!loincRegex.test(code)) {
    return { isValid: false, message: 'Invalid LOINC code format' };
  }

  return { isValid: true };
}

/**
 * Validate official AMA CPT (Current Procedural Terminology) code format.
 * CPT Category I: 5 numeric digits (e.g., 27447)
 * CPT Category II/III: 4 digits + 1 letter (e.g., 0001F, 0500T)
 */
export async function validateCptCode(code: string): Promise<ValidationResult> {
  if (!code) {
    return { isValid: false, message: 'Code is empty' };
  }

  const cptRegex = /^(\d{5}|\d{4}[A-Za-z])$/;
  if (!cptRegex.test(code.trim())) {
    return { isValid: false, message: 'Invalid AMA CPT code format (must be 5 characters)' };
  }

  return { isValid: true };
}

/**
 * Validate NLM RxNorm Concept Unique Identifier (RXCUI) format.
 * RxNorm identifiers are numeric strings typically 1 to 7 digits.
 */
export async function validateRxNormCode(code: string): Promise<ValidationResult> {
  if (!code) {
    return { isValid: false, message: 'Code is empty' };
  }

  const rxnormRegex = /^\d{1,8}$/;
  if (!rxnormRegex.test(code.trim())) {
    return { isValid: false, message: 'Invalid RxNorm RXCUI code format (must be numeric digits)' };
  }

  return { isValid: true };
}


