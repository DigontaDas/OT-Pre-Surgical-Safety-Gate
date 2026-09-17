# OT Pre-Surgical Safety Gate

A SMART on FHIR application that acts as an automated safety gate for patients entering the operating theater. The app aggregates clinical FHIR data and evaluates safety rules in real-time before surgery.

> ⚠️ **FOR DEMONSTRATION PURPOSES ONLY** — Not validated for clinical use.

## Features

| Feature | Description |
|---|---|
| **SMART on FHIR Launch** | Secure OAuth2 + PKCE authorization via `fhirclient` — launches inside the EHR context |
| **Patient Context** | Automatically identifies the patient on the operating table from launch context |
| **Procedure Verification** | Cross-checks the scheduled procedure using SNOMED CT codes |
| **Diagnosis Match** | Validates that the patient's active conditions justify the procedure |
| **Consent Check** | Confirms the patient signed consent for the specific procedure |
| **Allergy Check** | Flags allergies to surgical antibiotics using coded lookups (not string matching) |
| **Lab Safety** | Fetches blood labs by LOINC codes (platelets, PT/INR, hemoglobin) and checks thresholds |
| **Audit Logging** | Generates FHIR `AuditEvent` records when patient records are viewed |
| **Document Export** | Builds FHIR `Composition` / `Bundle` documents following USCDI standards |

## Tech Stack

- **React 19** + **TypeScript 6** — type-safe UI
- **Vite 8** — fast dev server and bundler
- **TanStack React Query** — server-state caching
- **fhirclient** — official SMART on FHIR OAuth + FHIR client
- **Vitest** — unit testing (TDD for safety engine)
- **CSS Variables / BEM** — clinical-grade design system

## Architecture

```
src/
├── components/          # Reusable UI (PatientBanner, SafetyCard)
├── config/              # LOINC codes, SNOMED mappings, thresholds
├── demo/                # Synthetic patient data (Sarah Johnson)
├── features/
│   ├── dashboard/       # Main safety checklist page
│   └── export/          # FHIR document export page
├── hooks/               # React Query hooks for FHIR data
├── services/
│   ├── auth/            # FHIR context + audit logger
│   ├── document/        # Composition / Bundle builder
│   ├── fhir/            # Patient, Procedure, Condition, Consent, Allergy, Observation
│   ├── safety/          # Safety engine (core logic + tests)
│   └── terminology/     # Code validator (SNOMED/LOINC)
├── styles/              # CSS design system
└── types/               # TypeScript domain interfaces
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- (Optional) Docker — for running a local HAPI FHIR server

### Installation
```bash
git clone <repo-url>
cd ot-safety-gate
cp .env.example .env       # adjust values if needed
npm install
```

### Run Tests
```bash
npm run test
```

### Start Dev Server
```bash
npm run dev
# App runs at http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```

---

## How to Demo the Application

### Option A: SMART App Launcher (Recommended — No Docker Required)

This is the easiest way to show the app live:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the SMART App Launcher:**
   Go to [https://launch.smarthealthit.org/](https://launch.smarthealthit.org/)

3. **Configure the launcher:**
   - Set **App Launch URL** to: `http://localhost:5173/launch.html`
   - Set **FHIR Version** to: `R4`
   - Select a **Patient** from the sandbox (e.g., pick any sample patient)
   - Click **Launch**

4. **What happens:**
   - The launcher redirects to your `launch.html`
   - `fhirclient` starts the OAuth2 + PKCE flow automatically
   - After auth, you're redirected to the main app
   - The **Dashboard** shows the safety checklist for the selected patient
   - Click **Export Note** in the header to see the FHIR document generation

### Option B: Local HAPI FHIR Server + Custom Patient

If you want to demo with the Sarah Johnson synthetic patient:

1. **Start HAPI FHIR:**
   ```bash
   docker run -p 8080:8080 hapiproject/hapi:latest
   ```

2. **Load demo data:**
   ```bash
   npx tsx scripts/loadDemoData.ts
   ```

3. **Launch via SMART App Launcher** (same steps as Option A), pointing FHIR server to `http://localhost:8080/fhir`

---

## Security Posture (What Interviewers Will Look For)

| Criteria | How This App Handles It |
|---|---|
| **Data Querying** | Uses LOINC codes (`777-3`, `34714-6`, `718-7`) and SNOMED CT codes — never string-matching |
| **Authentication** | PKCE OAuth 2.0 via SMART on FHIR launch — no cleartext tokens, no hardcoded IDs |
| **Data Privacy** | `sessionStorage` only (not `localStorage`); PHI stripped from logs; data minimization enforced |
| **Audit Trail** | Generates FHIR `AuditEvent` resources every time patient records are accessed |
| **Clinical Disclaimer** | Prominent warning banner at the top of every page |

## Key Files to Walk Through in a Code Review

| File | Purpose |
|---|---|
| [`launch.html`](public/launch.html) | SMART on FHIR entry point — shows OAuth scopes and PKCE |
| [`main.tsx`](src/main.tsx) | `oauth2.ready()` completion — token exchange |
| [`safetyEngine.ts`](src/services/safety/safetyEngine.ts) | Core logic — 5 safety checks orchestrated |
| [`safetyEngine.test.ts`](src/services/safety/safetyEngine.test.ts) | TDD unit tests |
| [`loincCodes.ts`](src/config/loincCodes.ts) | Standard code lookups (not string matching) |
| [`snomedMappings.ts`](src/config/snomedMappings.ts) | Procedure↔Diagnosis mapping by SNOMED codes |
| [`allergyService.ts`](src/services/fhir/allergyService.ts) | Coded allergy lookup with surgical antibiotic detection |
| [`auditLogger.ts`](src/services/auth/auditLogger.ts) | AuditEvent generation |
| [`documentBuilder.ts`](src/services/document/documentBuilder.ts) | FHIR Composition / Bundle for USCDI export |
