/**
 * SNOMED CT Mappings for Procedure-Diagnosis Verification
 * 
 * This mapping table connects surgical procedures (by SNOMED code)
 * to their expected diagnoses (by SNOMED code). Used by the safety
 * gate to verify that the scheduled procedure matches the patient's
 * documented condition.
 * 
 * NOTE: This is a simplified demo mapping. In production, ontological
 * reasoning via SNOMED CT hierarchies or clinical decision support
 * systems would be used instead.
 */

export const SNOMED_SYSTEM = 'http://snomed.info/sct';

/**
 * Maps procedure SNOMED codes to arrays of acceptable diagnosis SNOMED codes.
 * If the patient has at least one active Condition with a code in the
 * mapped array, the diagnosis-procedure match is verified.
 */
export const PROCEDURE_DIAGNOSIS_MAP: Record<string, string[]> = {
  // Total Knee Arthroplasty → Osteoarthritis of knee
  '609588000': ['239873007', '396275006', '69896004', '202322001'],
  // Total Hip Replacement → Osteoarthritis of hip
  '52734007': ['239872002', '69897008', '202321008'],
  // Appendectomy → Appendicitis
  '80146002': ['74400008', '85189001'],
  // Cholecystectomy → Cholelithiasis / Cholecystitis
  '38102005': ['235919008', '65275009', '441862004'],
  // Coronary Artery Bypass → Coronary artery disease
  '232717009': ['53741008', '414545008', '413838009'],
  // Cesarean Section → Various obstetric indications
  '11466000': ['199246003', '17860005', '237240001'],
};

/**
 * Common surgical antibiotic substance SNOMED codes.
 * Used to check if any patient allergies conflict with
 * antibiotics commonly administered during surgery.
 */
export const SURGICAL_ANTIBIOTIC_CODES: Record<string, string[]> = {
  /** Penicillin class */
  penicillins: [
    '91936005',  // Penicillin allergy
    '373270004', // Penicillin substance
    '6369005',   // Penicillin G
    '27658006',  // Amoxicillin
  ],
  /** Cephalosporin class */
  cephalosporins: [
    '294532003', // Cephalosporin allergy
    '373263003', // Cephalosporin substance
    '387174006', // Cefazolin (common surgical prophylactic)
  ],
  /** Sulfonamide class */
  sulfonamides: [
    '294831002', // Sulfonamide allergy
    '363528007', // Sulfonamide substance
  ],
  /** Fluoroquinolone class */
  fluoroquinolones: [
    '372840006', // Fluoroquinolone substance
    '387553001', // Ciprofloxacin
  ],
};

/** All surgical antibiotic codes flattened for quick lookup */
export const ALL_SURGICAL_ANTIBIOTIC_CODES: string[] = Object.values(
  SURGICAL_ANTIBIOTIC_CODES
).flat();

/**
 * Check if a given SNOMED substance code is a surgical antibiotic
 */
export function isSurgicalAntibiotic(snomedCode: string): boolean {
  return ALL_SURGICAL_ANTIBIOTIC_CODES.includes(snomedCode);
}

/**
 * Get the antibiotic class name for a given SNOMED code
 */
export function getAntibioticClass(snomedCode: string): string | null {
  for (const [className, codes] of Object.entries(SURGICAL_ANTIBIOTIC_CODES)) {
    if (codes.includes(snomedCode)) {
      return className;
    }
  }
  return null;
}
