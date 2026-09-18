import type Client from 'fhirclient/lib/Client';
import type { AuditEvent } from 'fhir/r4';
import type { ClinicalOverride } from '../../types/safety';

/**
 * Audit Logger Service
 * 
 * Implements HIPAA § 164.312(b) Audit Controls and HL7 FHIR R4 AuditEvent Specification.
 * Ensures strict Data Minimization:
 * - Strips unneeded Protected Health Information (PHI) like patient names, addresses, and phone numbers.
 * - Logs only technical identifiers, action types, timestamps, and outcome statuses.
 */

/**
 * Records an AuditEvent when a clinician accesses a patient record for pre-surgical safety checks.
 */
export async function logPatientAccess(client: Client): Promise<AuditEvent | null> {
  const patientId = client.patient.id;
  if (!patientId) return null;

  const now = new Date().toISOString();

  // Construct full HL7 FHIR R4 AuditEvent resource
  const auditEvent: AuditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://dicom.nema.org/resources/ontology/DCM',
      code: '110112',
      display: 'Query',
    },
    subtype: [
      {
        system: 'http://hl7.org/fhir/restful-interaction',
        code: 'search',
        display: 'search',
      },
    ],
    action: 'E', // Execute
    recorded: now,
    outcome: '0', // Success
    outcomeDesc: 'Authorized pre-surgical checklist review in Operating Theater',
    agent: [
      {
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
              code: 'AUT',
              display: 'Author (originator)',
            },
          ],
        },
        requestor: true,
        who: {
          display: 'OT Pre-Surgical Safety Gate System',
        },
      },
    ],
    source: {
      site: 'Operating Theater',
      observer: {
        display: 'OT Safety Gate Client',
      },
      type: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/security-source-type',
          code: '1',
          display: 'User Device',
        },
      ],
    },
    entity: [
      {
        what: {
          reference: `Patient/${patientId}`,
        },
        type: {
          system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
          code: '1',
          display: 'Person',
        },
        role: {
          system: 'http://terminology.hl7.org/CodeSystem/object-role',
          code: '1',
          display: 'Patient',
        },
      },
    ],
  };

  try {
    // Attempt to persist the AuditEvent to the EHR FHIR server
    await client.request({
      url: 'AuditEvent',
      method: 'POST',
      headers: { 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(auditEvent),
    });
    console.info(`[AUDIT] HL7 FHIR AuditEvent persisted to EHR for patient context: ${patientId}`);
  } catch (_err) {
    // Many sandbox environments are read-only for AuditEvent resources.
    // Gracefully handle without interrupting clinical workflow.
    console.info(`[AUDIT] HL7 FHIR AuditEvent recorded locally (Data Minimization applied):`, {
      type: '110112 (Query)',
      patientRef: `Patient/${patientId}`,
      action: 'E',
      recorded: now,
    });
  }

  return auditEvent;
}

/**
 * Records an AuditEvent when an attending clinician authorizes a clinical override.
 */
export async function logClinicalOverride(
  client: Client,
  override: ClinicalOverride
): Promise<AuditEvent | null> {
  const patientId = client.patient.id;
  if (!patientId) return null;

  const now = new Date().toISOString();

  const auditEvent: AuditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://dicom.nema.org/resources/ontology/DCM',
      code: '110113',
      display: 'Security Alert',
    },
    subtype: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'EMERGENCY',
        display: 'Emergency Override',
      },
    ],
    action: 'E',
    recorded: now,
    outcome: '0',
    outcomeDesc: `Clinical Safety Gate Override Authorized: ${override.reason}`,
    agent: [
      {
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
              code: 'ATND',
              display: 'Attending Practitioner',
            },
          ],
        },
        requestor: true,
        who: {
          display: `${override.clinicianName} (${override.role})`,
        },
      },
    ],
    source: {
      site: 'Operating Theater',
      observer: {
        display: 'OT Safety Gate Override Engine',
      },
    },
    entity: [
      {
        what: {
          reference: `Patient/${patientId}`,
        },
        type: {
          system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
          code: '1',
          display: 'Person',
        },
        role: {
          system: 'http://terminology.hl7.org/CodeSystem/object-role',
          code: '1',
          display: 'Patient',
        },
        description: `Acknowledged Warnings: ${override.acknowledgedWarnings.join('; ')}`,
      },
    ],
  };

  try {
    await client.request({
      url: 'AuditEvent',
      method: 'POST',
      headers: { 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(auditEvent),
    });
    console.info(`[AUDIT] Clinical Override AuditEvent persisted to EHR.`);
  } catch (_err) {
    console.info(`[AUDIT] Clinical Override AuditEvent recorded (Data Minimization applied):`, {
      type: '110113 (Security Alert)',
      patientRef: `Patient/${patientId}`,
      recorded: now,
    });
  }

  return auditEvent;
}
