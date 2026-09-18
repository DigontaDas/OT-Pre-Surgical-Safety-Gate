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
export const CPT_SYSTEM = 'http://www.ama-assn.org/go/cpt';
export const CPT_SYSTEMS = [
  'http://www.ama-assn.org/go/cpt',
  'http://hl7.org/fhir/sid/cpt',
  'urn:oid:2.16.840.1.113883.6.12',
];

export const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';
export const RXNORM_SYSTEMS = [
  'http://www.nlm.nih.gov/research/umls/rxnorm',
  'urn:oid:2.16.840.1.113883.6.88',
];


/**
 * Maps procedure codes (both official AMA CPT codes and SNOMED CT procedure codes)
 * to arrays of acceptable diagnosis SNOMED CT codes.
 * If the patient has at least one active Condition with a code in the
 * mapped array, the diagnosis-procedure match is verified.
 */
export const PROCEDURE_DIAGNOSIS_MAP: Record<string, string[]> = {
  // --- Official AMA CPT Codes mapped to SNOMED CT Diagnoses ---
  // CPT 27447: Total Knee Arthroplasty → Osteoarthritis of knee (SNOMED CT)
  '27447': ['239873007', '396275006', '69896004', '202322001'],
  // CPT 27130: Total Hip Arthroplasty → Osteoarthritis of hip (SNOMED CT)
  '27130': ['239872002', '69897008', '202321008'],
  // CPT 44970 / 44950: Appendectomy → Appendicitis (SNOMED CT)
  '44970': ['74400008', '85189001'],
  '44950': ['74400008', '85189001'],
  // CPT 47562 / 47563: Laparoscopic Cholecystectomy → Cholelithiasis / Cholecystitis (SNOMED CT)
  '47562': ['235919008', '65275009', '441862004'],
  '47563': ['235919008', '65275009', '441862004'],
  // CPT 33533 / 33510: Coronary Artery Bypass Graft → Coronary artery disease (SNOMED CT)
  '33533': ['53741008', '414545008', '413838009'],
  '33510': ['53741008', '414545008', '413838009'],
  // CPT 59510 / 59514: Cesarean Section Delivery → Obstetric indications (SNOMED CT)
  '59510': ['199246003', '17860005', '237240001'],
  '59514': ['199246003', '17860005', '237240001'],

  // --- SNOMED CT Procedure Codes mapped to SNOMED CT Diagnoses ---
  // SNOMED 609588000: Total Knee Arthroplasty → Osteoarthritis of knee
  '609588000': ['239873007', '396275006', '69896004', '202322001'],
  // SNOMED 52734007: Total Hip Replacement → Osteoarthritis of hip
  '52734007': ['239872002', '69897008', '202321008'],
  // SNOMED 80146002: Appendectomy → Appendicitis
  '80146002': ['74400008', '85189001'],
  // SNOMED 38102005: Cholecystectomy → Cholelithiasis / Cholecystitis
  '38102005': ['235919008', '65275009', '441862004'],
  // SNOMED 232717009: Coronary Artery Bypass → Coronary artery disease
  '232717009': ['53741008', '414545008', '413838009'],
  // SNOMED 11466000: Cesarean Section → Various obstetric indications
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

export const RXNORM_ANTIBIOTIC_CODES: Record<string, string[]> = {
  penicillins: [
    '7980',  // Penicillin G
    '70618', // Penicillin V
    '723',   // Amoxicillin
    '18631', // Ampicillin
  ],
  cephalosporins: [
    '2180',  // Cefazolin
    '2193',  // Ceftriaxone
    '2183',  // Cefepime
    '2194',  // Cefuroxime
  ],
  sulfonamides: [
    '10180', // Sulfamethoxazole
    '9997',  // Sulfadiazine
  ],
  fluoroquinolones: [
    '2551',   // Ciprofloxacin
    '82122',  // Levofloxacin
    '139462', // Moxifloxacin
  ],
};

/** All surgical antibiotic codes flattened for quick lookup */
export const ALL_SURGICAL_ANTIBIOTIC_CODES: string[] = Object.values(
  SURGICAL_ANTIBIOTIC_CODES
).flat();

export const ALL_RXNORM_ANTIBIOTIC_CODES: string[] = Object.values(
  RXNORM_ANTIBIOTIC_CODES
).flat();

/**
 * Check if a given code (SNOMED CT or RxNorm) represents a surgical antibiotic.
 */
export function isSurgicalAntibiotic(code: string, system?: string): boolean {
  if (!code) return false;
  
  if (system && RXNORM_SYSTEMS.includes(system)) {
    return ALL_RXNORM_ANTIBIOTIC_CODES.includes(code);
  }
  
  return ALL_SURGICAL_ANTIBIOTIC_CODES.includes(code) || ALL_RXNORM_ANTIBIOTIC_CODES.includes(code);
}

/**
 * Get the antibiotic class name for a given SNOMED or RxNorm code
 */
export function getAntibioticClass(code: string): string | null {
  for (const [className, codes] of Object.entries(SURGICAL_ANTIBIOTIC_CODES)) {
    if (codes.includes(code)) {
      return className;
    }
  }
  for (const [className, codes] of Object.entries(RXNORM_ANTIBIOTIC_CODES)) {
    if (codes.includes(code)) {
      return className;
    }
  }
  return null;
}

