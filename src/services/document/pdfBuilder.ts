import { jsPDF } from 'jspdf';
import type { SafetyReport, CheckResult, CheckDetail } from '../../types/safety';

export interface PatientPdfInfo {
  id: string;
  name: string;
  birthDate?: string;
  gender?: string;
  mrn?: string;
}

const SECTION_LOINC_MAP: Record<string, string> = {
  procedure: '29554-3',
  diagnosis: '11450-4',
  consent: '59284-0',
  allergies: '48765-2',
  labs: '30954-2',
};

/**
 * Builds a professional, publication-quality clinical PDF document
 * for the Pre-Surgical Safety Gate verification report.
 * Adheres to USCDI v3 Clinical Note (LOINC 83807-8) formatting.
 */
export function generatePreopPdf(
  safetyReport: SafetyReport,
  patientInfo: PatientPdfInfo
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (requiredMm: number) => {
    if (y + requiredMm > 275) {
      doc.addPage();
      y = 20;
    }
  };

  // ── 1. Top Header Banner ──
  doc.setFillColor(15, 76, 129); // Clinical Navy
  doc.rect(margin, y, contentWidth, 18, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('OPERATING THEATER PRE-SURGICAL SAFETY GATE', margin + 6, y + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 235, 252);
  doc.text('PRE-OPERATIVE CLINICAL CLEARANCE & SAFETY VERIFICATION REPORT', margin + 6, y + 14);

  y += 24;

  // ── Standards Metadata Tag ──
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('STANDARDS: LOINC 83807-8 (Preoperative Note) • USCDI v3 Compliant • HL7 FHIR Core', margin + 4, y + 5.5);
  y += 13;

  // ── 2. Patient Demographics & Status Box ──
  const isOverridden = !!safetyReport.override;
  const decision = safetyReport.overallDecision;

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  // Patient details (Left)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Patient: ${patientInfo.name}`, margin + 5, y + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`MRN: ${patientInfo.mrn || patientInfo.id || 'N/A'}`, margin + 5, y + 13);
  doc.text(`DOB: ${patientInfo.birthDate || 'N/A'}  •  Gender: ${patientInfo.gender || 'Unknown'}`, margin + 5, y + 18);
  doc.text(`Verification Timestamp: ${new Date(safetyReport.timestamp).toLocaleString()}`, margin + 5, y + 23);

  // Clearance Status Badge (Right)
  const badgeWidth = 62;
  const badgeHeight = 14;
  const badgeX = pageWidth - margin - badgeWidth - 5;
  const badgeY = y + 6;

  if (isOverridden) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('CLINICAL OVERRIDE', badgeX + 5, badgeY + 6);
    doc.setFontSize(7);
    doc.text('CONDITIONAL CLEARANCE', badgeX + 5, badgeY + 11);
  } else if (decision === 'safe') {
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(22, 163, 74);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'FD');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('SAFE TO PROCEED', badgeX + 7, badgeY + 9);
  } else if (decision === 'conditional') {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'FD');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('CONDITIONAL PROCEED', badgeX + 5, badgeY + 9);
  } else {
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(220, 38, 38);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'FD');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('CLEARANCE BLOCKED', badgeX + 5, badgeY + 9);
  }

  y += 33;

  // ── 3. Checklist Sections ──
  safetyReport.checks.forEach((check: CheckResult, index: number) => {
    ensureSpace(24);

    const loinc = SECTION_LOINC_MAP[check.id] || '18776-5';
    
    // Header line
    doc.setDrawColor(15, 76, 129);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 76, 129);
    doc.text(`${index + 1}. ${check.title.toUpperCase()}`, margin, y);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`LOINC: ${loinc}`, pageWidth - margin - 26, y);
    y += 5.5;

    // Status line
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Status:', margin + 3, y);

    const isPass = check.status === 'pass';
    const isWarn = check.status === 'warning';
    doc.setFont('helvetica', 'bold');
    if (isPass) {
      doc.setTextColor(21, 128, 61);
      doc.text('PASSED / VERIFIED', margin + 24, y);
    } else if (isWarn) {
      doc.setTextColor(180, 83, 9);
      doc.text('WARNING NOTED', margin + 24, y);
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text('CRITICAL FAILURE', margin + 24, y);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`•  ${check.summary}`, margin + 65, y);
    y += 5.5;

    // Details items
    if (check.details && check.details.length > 0) {
      check.details.forEach((detail: CheckDetail) => {
        ensureSpace(8);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);

        let text = `• ${detail.message}`;
        if (detail.code) {
          const sys = detail.code.system.includes('cpt')
            ? 'CPT'
            : detail.code.system.includes('snomed')
            ? 'SNOMED'
            : detail.code.system.includes('loinc')
            ? 'LOINC'
            : 'CODE';
          text += ` [${sys}: ${detail.code.code}]`;
        }

        const lines = doc.splitTextToSize(text, contentWidth - 8);
        lines.forEach((l: string) => {
          doc.text(l, margin + 6, y);
          y += 4.5;
        });
      });
    }

    y += 3;
  });

  // ── 4. Clinical Override Section (if applicable) ──
  if (safetyReport.override) {
    ensureSpace(32);

    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('PHYSICIAN CLINICAL OVERRIDE & ATTESTATION', margin, y);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('LOINC: 77278-0', pageWidth - margin - 26, y);
    y += 5.5;

    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD');

    const auth = `${safetyReport.override.clinicianName} (${safetyReport.override.role})`;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(`Authorized by: ${auth}  •  ${new Date(safetyReport.override.timestamp).toLocaleString()}`, margin + 5, y + 6);

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(113, 63, 18);
    doc.text(`Clinical Justification: "${safetyReport.override.reason}"`, margin + 5, y + 12);

    if (safetyReport.override.acknowledgedWarnings?.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Acknowledged Warnings: ${safetyReport.override.acknowledgedWarnings.join('; ')}`, margin + 5, y + 18);
    }

    y += 27;
  }

  // ── 5. Attending Sign-Off Block ──
  ensureSpace(28);

  doc.setDrawColor(15, 76, 129);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 76, 129);
  doc.text('CLINICAL ATTESTATION SIGN-OFF', margin + 4, y + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('I hereby certify that all pre-surgical safety checklist items have been reviewed, verified against', margin + 4, y + 11);
  doc.text('EHR records, and deemed clinically acceptable for the scheduled operative intervention.', margin + 4, y + 15);

  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth - margin - 75, y + 17, pageWidth - margin - 5, y + 17);
  doc.setFontSize(7);
  doc.text('Attending Surgeon / Anesthesiologist Signature', pageWidth - margin - 65, y + 20.5);

  // ── Footer ──
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('CONFIDENTIAL MEDICAL RECORD • Generated by OT Pre-Surgical Safety Gate via SMART on FHIR', margin, 288);
  doc.text(`Page 1 of 1`, pageWidth - margin - 15, 288);

  return doc;
}
