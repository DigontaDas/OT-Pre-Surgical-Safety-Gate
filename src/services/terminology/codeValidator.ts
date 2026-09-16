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
