import type { SafetyReport } from '../../types/safety';

interface PatientContext {
  id: string;
  name?: string;
  birthDate?: string;
  gender?: string;
  mrn?: string;
}

/**
 * Generates an industry-standard HL7 CDA Release 2.0 / C-CDA R2.1 XML document
 * matching the schemas in https://github.com/HL7/CDA-core-2.0 and federally required USCDI standards.
 * 
 * Template: Consultation Note (2.16.840.1.113883.10.20.22.1.4) / US Realm Header (2.16.840.1.113883.10.20.22.1.1)
 */
export function buildCcdaXml(report: SafetyReport, patient: PatientContext): string {
  const docId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'cda-' + Date.now();
  const effectiveTime = new Date(report.timestamp).toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const birthTime = patient.birthDate ? patient.birthDate.replace(/-/g, '') : '19800101';
  const genderCode = patient.gender === 'female' ? 'F' : patient.gender === 'male' ? 'M' : 'UN';
  const genderDisplay = patient.gender === 'female' ? 'Female' : patient.gender === 'male' ? 'Male' : 'Undifferentiated';

  const escapeXml = (str: string) => (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Find individual check findings
  const procCheck = report.checks.find(c => c.id === 'procedure');
  const diagCheck = report.checks.find(c => c.id === 'diagnosis');
  const consentCheck = report.checks.find(c => c.id === 'consent');
  const allergyCheck = report.checks.find(c => c.id === 'allergy');
  const labCheck = report.checks.find(c => c.id === 'labs');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:hl7-org:v3 CDA.xsd">
  <!-- HL7 CDA Core 2.0 / US Realm Header -->
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <!-- US Realm Header template ID -->
  <templateId root="2.16.840.1.113883.10.20.22.1.1" extension="2015-08-01"/>
  <!-- Consultation Note template ID (Preoperative Evaluation) -->
  <templateId root="2.16.840.1.113883.10.20.22.1.4" extension="2015-08-01"/>
  
  <id root="2.16.840.1.113883.19.5.99999.1" extension="${docId}"/>
  <!-- LOINC 83807-8: Preoperative evaluation and management note -->
  <code code="83807-8" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Preoperative evaluation and management note"/>
  <title>Pre-Surgical Safety Gate Clearance &amp; Clinical Checklist</title>
  <effectiveTime value="${effectiveTime}"/>
  <confidentialityCode code="N" codeSystem="2.16.840.1.113883.5.25"/>
  <languageCode code="en-US"/>
  
  <recordTarget>
    <patientRole>
      <id root="2.16.840.1.113883.4.1" extension="${escapeXml(patient.mrn || patient.id)}"/>
      <addr use="HP">
        <streetAddressLine>Hospital Operating Wing</streetAddressLine>
        <city>Clinical Center</city>
        <state>MD</state>
        <postalCode>00000</postalCode>
        <country>US</country>
      </addr>
      <patient>
        <name>
          <given>${escapeXml((patient.name || 'Unknown Patient').split(' ')[0])}</given>
          <family>${escapeXml((patient.name || 'Unknown Patient').split(' ').slice(1).join(' '))}</family>
        </name>
        <administrativeGenderCode code="${genderCode}" codeSystem="2.16.840.1.113883.5.1" displayName="${genderDisplay}"/>
        <birthTime value="${birthTime}"/>
      </patient>
    </patientRole>
  </recordTarget>
  
  <author>
    <time value="${effectiveTime}"/>
    <assignedAuthor>
      <id root="2.16.840.1.113883.4.6" extension="9999999999"/>
      <assignedPerson>
        <name>
          <prefix>Dr.</prefix>
          <given>Attending</given>
          <family>Surgeon, MD</family>
        </name>
      </assignedPerson>
      <representedOrganization>
        <name>Operating Theater Clinical Safety Gate</name>
      </representedOrganization>
    </assignedAuthor>
  </author>
  
  <custodian>
    <assignedCustodian>
      <representedCustodianOrganization>
        <id root="2.16.840.1.113883.19.5"/>
        <name>Hospital Healthcare System</name>
      </representedCustodianOrganization>
    </assignedCustodian>
  </custodian>
  
  <component>
    <structuredBody>
      <!-- SECTION 1: Procedures Section (USCDI Procedures) -->
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.7.1" extension="2014-06-09"/>
          <code code="29554-3" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Procedure Narrative"/>
          <title>Scheduled Surgical Procedure</title>
          <text>
            <paragraph><strong>Status:</strong> ${escapeXml(procCheck?.status || 'Unknown')}</paragraph>
            <paragraph><strong>Summary:</strong> ${escapeXml(procCheck?.summary || '')}</paragraph>
            <list>
              ${procCheck?.details?.map(d => `<item>${escapeXml(d.message)}</item>`).join('\n              ') || ''}
            </list>
          </text>
        </section>
      </component>

      <!-- SECTION 2: Problem List / Diagnoses (USCDI Problems) -->
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.5.1" extension="2015-08-01"/>
          <code code="11450-4" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Problem List"/>
          <title>Pre-Op Diagnosis Verification (SNOMED CT Cross-Check)</title>
          <text>
            <paragraph><strong>Verification Result:</strong> ${escapeXml(diagCheck?.status || 'Unknown')}</paragraph>
            <paragraph>${escapeXml(diagCheck?.summary || '')}</paragraph>
            <list>
              ${diagCheck?.details?.map(d => `<item>${escapeXml(d.message)}</item>`).join('\n              ') || ''}
            </list>
          </text>
        </section>
      </component>

      <!-- SECTION 3: Allergies & Adverse Reactions (USCDI Allergies and Intolerances) -->
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.6.1" extension="2015-08-01"/>
          <code code="48765-2" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Allergies and other adverse reactions"/>
          <title>Surgical Antibiotic Allergies &amp; Intolerances</title>
          <text>
            <paragraph><strong>Status:</strong> ${escapeXml(allergyCheck?.status || 'Unknown')}</paragraph>
            <paragraph>${escapeXml(allergyCheck?.summary || '')}</paragraph>
            <list>
              ${allergyCheck?.details?.map(d => `<item>${escapeXml(d.message)}</item>`).join('\n              ') || ''}
            </list>
          </text>
        </section>
      </component>

      <!-- SECTION 4: Diagnostic Laboratory Tests (USCDI Laboratory / LOINC) -->
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.3.1" extension="2015-08-01"/>
          <code code="30954-2" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Relevant diagnostic tests/laboratory data"/>
          <title>Pre-Surgical Safety Blood Labs (LOINC Standardized)</title>
          <text>
            <paragraph><strong>Panel Status:</strong> ${escapeXml(labCheck?.status || 'Unknown')}</paragraph>
            <paragraph>${escapeXml(labCheck?.summary || '')}</paragraph>
            <list>
              ${labCheck?.details?.map(d => `<item>${escapeXml(d.message)}</item>`).join('\n              ') || ''}
            </list>
          </text>
        </section>
      </component>

      <!-- SECTION 5: Surgical Clearance / Plan of Care (USCDI Assessment & Plan) -->
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.10" extension="2014-06-09"/>
          <code code="18776-5" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Plan of care note"/>
          <title>Safety Gate Clearance Decision</title>
          <text>
            <paragraph><strong>Surgical Consent Status:</strong> ${escapeXml(consentCheck?.summary || '')}</paragraph>
            <paragraph><strong>Gate Decision:</strong> ${escapeXml(report.override ? 'OVERRIDE AUTHORIZED (SAFE TO PROCEED)' : report.overallDecision.toUpperCase())}</paragraph>
            <paragraph><strong>Safety Message:</strong> ${escapeXml(report.override ? `Clinical override authorized by ${report.override.clinicianName} (${report.override.role}).` : report.overallMessage)}</paragraph>
          </text>
        </section>
      </component>
      ${report.override ? `
      <!-- SECTION 6: Clinician Safety Override & Attestation -->
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.10" extension="2014-06-09"/>
          <code code="77278-0" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Provider attestation"/>
          <title>Attending Clinician Safety Override &amp; Justification</title>
          <text>
            <paragraph><strong>Override Status:</strong> AUTHORIZED</paragraph>
            <paragraph><strong>Authorizing Clinician:</strong> ${escapeXml(report.override.clinicianName)} (${escapeXml(report.override.role)})</paragraph>
            <paragraph><strong>Attestation Timestamp:</strong> ${escapeXml(new Date(report.override.timestamp).toLocaleString())}</paragraph>
            <paragraph><strong>Clinical Rationale:</strong> ${escapeXml(report.override.reason)}</paragraph>
            <paragraph><strong>Acknowledged Flagged Warnings:</strong></paragraph>
            <list>
              ${report.override.acknowledgedWarnings.map(w => `<item>${escapeXml(w)}</item>`).join('\n              ')}
            </list>
          </text>
        </section>
      </component>` : ''}
    </structuredBody>
  </component>
</ClinicalDocument>`;
}
