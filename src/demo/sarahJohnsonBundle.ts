/**
 * Creates a synthetic patient bundle for Sarah Johnson.
 * This represents a 65-year-old female scheduled for a total knee replacement,
 * with some concerning lab results and an active infection diagnosis.
 */
export const sarahJohnsonBundle: any = {
  resourceType: 'Bundle',
  type: 'transaction',
  entry: [
    {
      request: { method: 'POST', url: 'Patient' },
      resource: {
        resourceType: 'Patient',
        id: 'sarah-johnson',
        identifier: [{ system: 'urn:oid:1.2.36.146.595.217.0.1', value: '12345' }],
        name: [{ family: 'Johnson', given: ['Sarah', 'M'] }],
        gender: 'female',
        birthDate: '1958-05-15',
        active: true
      }
    },
    {
      request: { method: 'POST', url: 'Procedure' },
      resource: {
        resourceType: 'Procedure',
        id: 'proc-sarah-1',
        status: 'preparation',
        subject: { reference: 'Patient/sarah-johnson' },
        code: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '609588000',
            display: 'Total replacement of knee joint'
          }]
        }
      }
    },
    {
      request: { method: 'POST', url: 'Condition' },
      resource: {
        resourceType: 'Condition',
        id: 'cond-sarah-1',
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
        },
        subject: { reference: 'Patient/sarah-johnson' },
        code: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '195662009',
            display: 'Acute upper respiratory infection'
          }]
        }
      }
    },
    {
      request: { method: 'POST', url: 'Observation' },
      resource: {
        resourceType: 'Observation',
        id: 'obs-sarah-1',
        status: 'final',
        subject: { reference: 'Patient/sarah-johnson' },
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '33914-3',
            display: 'Estimated GFR'
          }]
        },
        valueQuantity: {
          value: 45, // Low (warning)
          unit: 'mL/min/1.73m2',
          system: 'http://unitsofmeasure.org'
        },
        effectiveDateTime: new Date().toISOString()
      }
    },
    {
      request: { method: 'POST', url: 'Consent' },
      resource: {
        resourceType: 'Consent',
        id: 'consent-sarah-1',
        status: 'active',
        scope: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }]
        },
        category: [{
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentcategorycodes', code: 'acd' }]
        }],
        patient: { reference: 'Patient/sarah-johnson' }
      }
    }
  ]
};
