# OT Pre-Surgical Safety Gate

A SMART on FHIR application designed to act as an automated safety gate for patients entering the operating theater. The app aggregates FHIR data and evaluates safety rules in real-time.

## Features
- **SMART on FHIR Launch**: Secure OAuth2 + PKCE authorization via `fhirclient`.
- **Terminology Checks**: Validates safety rules using SNOMED CT and LOINC standard codes.
- **Automated Dashboard**: Fetches Procedures, Conditions, Lab Results (Observations), Consents, and Allergies.
- **Safety Engine**: A robust rule engine that outputs Safe / Conditional / Blocked decisions.
- **Audit Logging**: Generates FHIR `AuditEvent` records when patient records are viewed.
- **Document Generation**: Builds and exports FHIR `Composition` / `Bundle` documents back to the EHR.

## Tech Stack
- React + TypeScript
- Vite
- Tanstack React Query (for caching and state management)
- `fhirclient` (for SMART OAuth flows)
- CSS Variables / BEM for styling

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Local HAPI FHIR Server (for testing without a live EHR)

### 2. Installation
```bash
git clone <repo-url>
cd ot-safety-gate
npm install
```

### 3. Local Development (with SMART App Launcher)
To test the SMART on FHIR flow without setting up a full EHR:
1. Start the dev server:
   ```bash
   npm run dev
   ```
2. Navigate to [SMART App Launcher](https://launch.smarthealthit.org/).
3. Set the "App Launch URL" to: `http://localhost:5173/launch.html`
4. Set FHIR Version to R4.
5. Launch the app.

### 4. Running Tests
The safety engine logic is developed using TDD. Run tests via:
```bash
npm run test
```

## Security Overview
- **Data Minimization:** Retrieves only necessary resources (no broad bulk data fetches).
- **Authentication:** Enforces PKCE validation in the OAuth flow via `fhirclient`.
- **Storage:** Strict usage of `sessionStorage` (managed by `fhirclient`); no `localStorage` is used for PHI.
- **Logging:** Console logs have been sanitized to remove PHI, logging only resource identifiers or actions.
- **Auditing:** The app generates FHIR `AuditEvent` resources indicating an information recipient read action.

## Demo Flow
1. Load demo data for synthetic patient "Sarah Johnson" into your FHIR server (or use SMART sandbox patients).
2. Launch the application from the EHR context.
3. Observe the dashboard aggregating missing consents, abnormal labs, and active conditions.
4. Preview the document bundle in the Export Note tab.
