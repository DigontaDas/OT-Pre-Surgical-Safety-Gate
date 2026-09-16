/**
 * Safety Thresholds for Laboratory Results
 * 
 * IMPORTANT: These are demonstration defaults only.
 * They are NOT validated for clinical use and should NOT
 * be used for real medical decision-making.
 */

export interface LabThreshold {
  /** LOINC code for the test */
  loincCode: string;
  /** Normal range: min (inclusive) */
  normalMin: number;
  /** Normal range: max (inclusive) */
  normalMax: number;
  /** Warning range: min (values below this are critical) */
  warningMin: number;
  /** Warning range: max (values above this are critical) */
  warningMax: number;
}

export const LAB_THRESHOLDS: Record<string, LabThreshold> = {
  /** Platelet Count: 150–400 normal, 100–149 or 401–500 warning, <100 or >500 critical */
  '777-3': {
    loincCode: '777-3',
    normalMin: 150,
    normalMax: 400,
    warningMin: 100,
    warningMax: 500,
  },
  /** PT/INR: 0.8–1.2 normal, 1.2–1.5 warning, >1.5 critical */
  '5902-2': {
    loincCode: '5902-2',
    normalMin: 0.8,
    normalMax: 1.2,
    warningMin: 0.5,
    warningMax: 1.5,
  },
  /** aPTT: 25–35 normal, 35–45 warning, >45 critical */
  '3173-2': {
    loincCode: '3173-2',
    normalMin: 25,
    normalMax: 35,
    warningMin: 15,
    warningMax: 45,
  },
  /** Hemoglobin: 12–17 normal, 10–11.9 warning, <10 critical */
  '718-7': {
    loincCode: '718-7',
    normalMin: 12,
    normalMax: 17,
    warningMin: 10,
    warningMax: 20,
  },
  /** WBC: 4.5–11 normal, 3–4.4 or 11.1–15 warning, <3 or >15 critical */
  '6690-2': {
    loincCode: '6690-2',
    normalMin: 4.5,
    normalMax: 11,
    warningMin: 3,
    warningMax: 15,
  },
};

/**
 * Evaluate a lab value against its threshold
 */
export function evaluateLabValue(
  loincCode: string,
  value: number
): 'normal' | 'abnormal' | 'critical' {
  const threshold = LAB_THRESHOLDS[loincCode];
  if (!threshold) return 'normal'; // Unknown test, don't flag

  if (value >= threshold.normalMin && value <= threshold.normalMax) {
    return 'normal';
  }
  if (value >= threshold.warningMin && value <= threshold.warningMax) {
    return 'abnormal';
  }
  return 'critical';
}
