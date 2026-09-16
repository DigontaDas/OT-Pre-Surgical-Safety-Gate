import type Client from 'fhirclient/lib/Client';
import type { SafetyReport } from '../../types/safety';

/**
 * Builds a FHIR Composition resource representing the Pre-Surgical Safety Gate document.
 */
export function buildComposition(client: Client, report: SafetyReport): any {
  const patientId = client.patient.id;
  
  return {
    resourceType: 'Composition',
    status: 'final',
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '11488-4',
          display: 'Consult note'
        }
      ]
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    date: report.timestamp,
    title: 'Pre-Surgical Safety Gate Report',
    section: report.checks.map(check => ({
      title: check.title,
      code: {
        coding: [{ display: check.title }]
      },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">
          <p><strong>Status:</strong> ${check.status}</p>
          <p><strong>Summary:</strong> ${check.summary}</p>
          <ul>
            ${check.details.map(d => `<li>${d.message} ${d.code ? `(${d.code.display})` : ''}</li>`).join('')}
          </ul>
        </div>`
      }
    }))
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
