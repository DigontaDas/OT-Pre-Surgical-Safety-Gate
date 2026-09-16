import * as dotenv from 'dotenv';
import { sarahJohnsonBundle } from '../src/demo/sarahJohnsonBundle';

// Load env if running locally
dotenv.config();

const HAPI_URL = process.env.VITE_FHIR_BASE_URL || 'http://localhost:8080/fhir';

async function loadDemoData() {
  console.log(`Loading demo data into HAPI FHIR at ${HAPI_URL}...`);
  
  try {
    const response = await fetch(`${HAPI_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sarahJohnsonBundle)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
    }

    const result = await response.json();
    console.log('Successfully loaded demo bundle!');
    console.log(`Bundle Response ID: ${result.id}`);
    
    // Find the Patient ID assigned by HAPI
    const patientEntry = result.entry?.find((e: any) => e.response?.location?.includes('Patient/'));
    if (patientEntry) {
      const location = patientEntry.response.location;
      const patientId = location.split('/')[1];
      console.log(`\n==============================================`);
      console.log(`Patient ID for testing: ${patientId}`);
      console.log(`==============================================\n`);
    } else {
      console.log('Could not parse Patient ID from response.');
    }

  } catch (error) {
    console.error('Failed to load demo data:', error);
    process.exit(1);
  }
}

loadDemoData();
