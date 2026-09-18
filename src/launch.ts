import FHIR from 'fhirclient';

FHIR.oauth2.authorize({
  clientId: 'ot-safety-gate',
  scope: [
    'launch',
    'openid',
    'fhirUser',
    'patient/Patient.read',
    'patient/Procedure.read',
    'patient/Condition.read',
    'patient/Consent.read',
    'patient/AllergyIntolerance.read',
    'patient/Observation.read',
    'patient/ServiceRequest.read',
    'patient/Composition.write',
    'patient/DocumentReference.write'
  ].join(' '),
  redirectUri: './index.html',
  completeInTarget: true
});
