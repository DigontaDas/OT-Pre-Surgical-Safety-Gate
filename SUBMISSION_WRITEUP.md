# OT Pre-Surgical Safety Gate — Candidate Submission Write-Up

## 1. Approach Overview

The **OT Pre-Surgical Safety Gate** is built as an enterprise-grade, zero-trust clinical safety application operating directly inside the Electronic Health Record (EHR) environment.

* **Authentication & Architecture:** Implemented the official **SMART on FHIR App Launch Framework** using OAuth 2.0 with **PKCE (Proof Key for Code Exchange via S256 challenge)**. Tokens and clinical state are kept strictly in ephemeral session memory (`sessionStorage`) and purged upon session disconnect. No credentials or patient IDs are ever hardcoded or stored in `localStorage`.
* **Zero String Matching (Standardized Terminology):** 
  * **Lab Panels:** Blood labs are queried directly from the FHIR server filtering strictly by standardized **LOINC codes** (`777-3` Platelets, `6301-6` INR, `3173-2` aPTT, `2823-3` Potassium).
  * **Procedure & Diagnosis:** Scheduled procedures are retrieved by official **AMA CPT codes** (`27447`, `27130`, `44970`) and verified against active clinical conditions using **SNOMED CT concepts** (`239873007`, `74400008`).
  * **Allergies:** Cross-checks patient allergies against surgical antibiotic prophylaxis classes (Penicillins, Cephalosporins like Cefazolin, Sulfonamides, Fluoroquinolones) using both **SNOMED CT** and **NLM RxNorm** standard codes.
* **Safety Gate State Machine & Override Flow:** Evaluates all safety checks deterministically (`proceed`, `conditional`, `blocked`). If a critical safety failure occurs (e.g. elevated INR or missing consent), the gate locks down surgical clearance. A structured **Clinical Override Workflow** allows an attending clinician to provide clinical justification and digital attestation (LOINC `77278-0`), unblocking export while maintaining an audit trail.
* **Dual Standardized Document Export & Clinical PDF:**
  * **USCDI v3 Clinical Note:** Assembles a FHIR `Composition` inside a `Bundle` of type `document` using LOINC `83807-8` (*Preoperative evaluation and management note*).
  * **HL7 CDA Core 2.0 (C-CDA R2.1 XML):** Builds a structured XML document matching ONC Health IT Certification standards.
  * **Print & PDF Generation:** Integrated client-side vector PDF generation (`jsPDF`) and clean `@media print` paper styling for the operating room clipboard.
* **HIPAA Audit Controls (§ 164.312(b)):** Automatically generates **HL7 FHIR R4 `AuditEvent`** records (DICOM `110112` Query and DICOM `110113` Security Alert) with strict PHI data minimization.

---

## 2. Assumptions Made & Ambiguity Handling

| Area of Ambiguity | Assumption Made | Clinical & Engineering Rationale |
| :--- | :--- | :--- |
| **Procedure-Diagnosis Cross-Check (CPT vs SNOMED)** | Established a curated CPT-to-SNOMED ontological cross-walk table (e.g., CPT `27447` Knee Arthroplasty ↔ SNOMED `239873007` Osteoarthritis) with support for direct SNOMED procedure codes. | In real clinical practice, CPT codes (AMA billing terminology) and SNOMED CT (clinical terminology) originate from different authorities. A deterministic mapping ensures reliable verification without risking semantic mismatches in an emergency setting. |
| **Surgical Antibiotic Prophylaxis Scope** | Focused screening on four core perioperative antibiotic classes: Penicillins, Cephalosporins (specifically Cefazolin), Sulfonamides, and Fluoroquinolones, matching both SNOMED CT and RxNorm codes. | Perioperative surgical guidelines (ASHP/IDSA) specifically mandate first-line cephalosporins (Cefazolin). Screening both SNOMED substance codes and RxNorm drug codes prevents medication administration errors. |
| **Pre-Operative Lab Reference Thresholds** | Defined evidence-based surgical bleeding risk cut-offs: Platelets $\ge 100\text{ K}/\mu\text{L}$, $\text{INR} \le 1.5$, $\text{aPTT} \le 35\text{s}$, and Potassium $3.5 - 5.0\text{ mEq/L}$. | Elective and major orthopedic surgeries carry severe coagulopathy risks. Setting conservative thresholds ensures any bleeding anomaly triggers a gate pause before incision. |
| **Emergency Clinical Overrides** | Built an authorized clinical override mechanism that requires physician signature, role, and rationale, appending a LOINC `77278-0` Attestation section to the document. | A software system must never physically trap a patient in an emergent trauma situation. An emergency override honors clinical judgment while enforcing HIPAA accountability. |
| **Sandbox EHR Server Permissions** | Handled `POST /AuditEvent` and `POST /DocumentReference` requests defensively with graceful local audit logging fallback. | Public testing sandboxes (like `launch.smarthealthit.org`) are frequently configured with read-only scopes or lack audit logging endpoints. The app attempts the write, but gracefully falls back so clinical workflows never break. |

---

## 3. What I'd Improve with More Time

1. **Dynamic Terminology Server Integration (`$subsumes` / `$validate-code`):**
   * Connect to an active FHIR Terminology Service (such as NLM VSAC or a Snowstorm SNOMED CT server) to evaluate concept subsumption dynamically. This would allow automated verification across thousands of procedural sub-types without static lookup tables.
2. **Clinical Decision Support (CDS Hooks Integration):**
   * Expose the safety engine as a **CDS Hooks Service** listening to `patient-view` and `order-select` EHR events. Surgeons would receive actionable pre-op clearance guidance directly inside Epic/Cerner when ordering surgery, days before the patient enters the OR.
3. **WHO Surgical Safety Time-Out Multi-Signature Flow:**
   * Expand the digital attestation flow into a full WHO Surgical Safety Checklist sequence (Sign-in, Time-out, Sign-out) requiring tripartite digital signatures from the Attending Surgeon, Anesthesiologist, and Circulating Nurse.
4. **Direct EHR Document Media Filing:**
   * Implement automated binary attachments (`POST /Binary` + `POST /DocumentReference`) to transmit both the C-CDA XML and vector PDF directly into the patient's permanent EHR chart and hospital media archive.
5. **End-to-End Synthetic HAPI FHIR Test Harness:**
   * Add automated Playwright end-to-end tests running against a containerized HAPI FHIR JPA server populated with diverse synthetic edge-case patients (pediatric, trauma, mismatched consents, critical lab panics).
