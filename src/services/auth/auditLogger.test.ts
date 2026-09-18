import { describe, it, expect, vi } from 'vitest';
import { logPatientAccess, logClinicalOverride } from './auditLogger';
import type Client from 'fhirclient/lib/Client';

describe('auditLogger', () => {
  it('generates a compliant HL7 FHIR AuditEvent for patient access with data minimization', async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    const mockClient = {
      patient: { id: 'patient-test-123' },
      request: mockRequest
    } as unknown as Client;

    const auditEvent = await logPatientAccess(mockClient);

    expect(auditEvent).not.toBeNull();
    expect(auditEvent?.resourceType).toBe('AuditEvent');
    expect(auditEvent?.type.code).toBe('110112'); // Query
    expect(auditEvent?.entity?.[0].what?.reference).toBe('Patient/patient-test-123');
    
    // Check that no personal phone or address is leaked
    const jsonStr = JSON.stringify(auditEvent);
    expect(jsonStr).not.toContain('phone');
    expect(jsonStr).not.toContain('address');
    expect(jsonStr).not.toContain('ssn');
  });

  it('generates a compliant AuditEvent for clinical overrides', async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    const mockClient = {
      patient: { id: 'patient-test-123' },
      request: mockRequest
    } as unknown as Client;

    const auditEvent = await logClinicalOverride(mockClient, {
      clinicianName: 'Dr. John Doe',
      role: 'Attending Surgeon',
      reason: 'Urgent surgery required despite lab anomaly',
      acknowledgedWarnings: ['Elevated INR 2.1'],
      timestamp: new Date().toISOString()
    });

    expect(auditEvent).not.toBeNull();
    expect(auditEvent?.resourceType).toBe('AuditEvent');
    expect(auditEvent?.type.code).toBe('110113'); // Security Alert
    expect(auditEvent?.subtype?.[0].code).toBe('EMERGENCY');
  });
});
