/**
 * FHIR Scope Configuration
 * Scopes requested during the SMART on FHIR OAuth2 authorization.
 */

export const SMART_SCOPES = [
  'launch',                          // Required for EHR launch context
  'openid',                          // User identity
  'fhirUser',                        // FHIR user resource
  'patient/Patient.read',            // Read patient demographics
  'patient/Procedure.read',          // Read scheduled procedures
  'patient/Condition.read',          // Read diagnoses
  'patient/Consent.read',            // Read consent records
  'patient/AllergyIntolerance.read', // Read allergy information
  'patient/Observation.read',        // Read lab results
  'patient/ServiceRequest.read',     // Read procedure orders
  'patient/Composition.write',       // Write clinical summaries
  'patient/DocumentReference.write', // Write document references
].join(' ');

/**
 * SMART on FHIR launch configuration for fhirclient
 */
export const SMART_LAUNCH_CONFIG = {
  clientId: 'ot-safety-gate',         // Public client ID (registered with sandbox)
  scope: SMART_SCOPES,
  redirectUri: './index.html',         // Same-origin redirect
  completeInTarget: true,              // Complete auth in same window
};
