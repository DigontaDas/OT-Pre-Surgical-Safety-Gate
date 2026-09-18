import type Client from 'fhirclient/lib/Client';
import type { SafetyReport } from '../../types/safety';

/**
 * Builds a FHIR Composition resource representing the Pre-Surgical Safety Gate document.
 */
/**
 * Standard LOINC section codes for USCDI Clinical Notes
 */
const SECTION_LOINC_MAP: Record<string, { code: string; display: string }> = {
  procedure: { code: '29554-3', display: 'Procedure Narrative' },
  diagnosis: { code: '11450-4', display: 'Problem List' },
  consent: { code: '59284-0', display: 'Consent document' },
  allergy: { code: '48765-2', display: 'Allergies and adverse reactions Document' },
  labs: { code: '30954-2', display: 'Relevant diagnostic tests/laboratory data' },
};

/**
 * Builds a FHIR Composition resource adhering to the USCDI v3 Clinical Notes specification
 * and the HL7 US Core Composition Profile (http://hl7.org/fhir/us/core/StructureDefinition/us-core-composition).
 */
export function buildComposition(client: Client, report: SafetyReport): any {
  const patientId = client.patient.id;
  
  return {
    resourceType: 'Composition',
    meta: {
      profile: [
        'http://hl7.org/fhir/us/core/StructureDefinition/us-core-composition'
      ]
    },
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
            code: 'clinical-note',
            display: 'Clinical Note'
          }
        ]
      }
    ],
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '83807-8',
          display: 'Preoperative evaluation and management note'
        }
      ],
      text: 'Pre-Surgical Safety Gate Evaluation Note'
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    date: report.timestamp,
    author: [
      {
        reference: 'Practitioner/ot-safety-officer',
        display: 'Operating Theater Safety Gate System'
      }
    ],
    title: 'Pre-Surgical Safety Gate Clearance & Checklist Report',
    confidentiality: 'N',
    section: [
      ...report.checks.map(check => {
        const loinc = SECTION_LOINC_MAP[check.id] || { code: '18776-5', display: 'Plan of care note' };
        return {
          title: check.title,
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: loinc.code,
                display: loinc.display
              }
            ]
          },
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">
              <p><strong>Status:</strong> ${check.status.toUpperCase()}</p>
              <p><strong>Summary:</strong> ${check.summary}</p>
              <ul>
                ${check.details.map(d => `<li>${d.message} ${d.code ? `(${d.code.system.includes('cpt') ? 'CPT ' : d.code.system.includes('snomed') ? 'SNOMED ' : ''}${d.code.code})` : ''}</li>`).join('')}
              </ul>
            </div>`
          }
        };
      }),
      ...(report.override ? [{
        title: 'Attending Clinician Safety Override & Attestation',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '77278-0',
              display: 'Provider attestation'
            }
          ]
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">
            <p><strong>Override Status:</strong> AUTHORIZED</p>
            <p><strong>Authorizing Clinician:</strong> ${report.override.clinicianName} (${report.override.role})</p>
            <p><strong>Attestation Date:</strong> ${new Date(report.override.timestamp).toLocaleString()}</p>
            <p><strong>Clinical Rationale:</strong> ${report.override.reason}</p>
            <p><strong>Acknowledged Flagged Warnings:</strong></p>
            <ul>
              ${report.override.acknowledgedWarnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>`
        }
      }] : [])
    ]
  };
}

/**
 * Wraps the Composition into a FHIR Document Bundle.
 */
export function buildDocumentBundle(_client: Client, report: SafetyReport, composition: any): any {
  return {
    resourceType: 'Bundle',
    type: 'document',
    timestamp: report.timestamp,
    entry: [
      {
        fullUrl: `urn:uuid:${crypto.randomUUID()}`,
        resource: composition
      }
      // In a real implementation, you would also include the referenced resources 
      // (Patient, Practitioner, Observations, etc.) here.
    ]
  };
}

/**
 * Exports the document by POSTing it to the FHIR Server.
 */
export async function exportDocument(_client: Client, bundle: any): Promise<any> {
  // In a real implementation, you might POST to the root or a specific endpoint
  // return client.request({ url: '', method: 'POST', body: JSON.stringify(bundle) });
  
  // For demo purposes, we'll just mock the success
  console.log('Exporting Bundle:', bundle);
  return new Promise(resolve => setTimeout(() => resolve({ id: 'doc-123', ...bundle }), 1000));
}
