# Advanced Feature Test Matrix & Quality Assurance Plan
## Women's Clothing Review Intelligence

Comprehensive test matrix verifying all model endpoints, analytical workspaces, security boundaries, and responsive frontend components.

---

### 1. Backend API & Model Inference Test Matrix

| ID | Test Case | Target Endpoint / Module | Expected Input | Expected Outcome | Verification Status |
|---|---|---|---|---|---|
| **TC-01** | Health Readiness Probe | `GET /health` | Empty payload | HTTP 200, `status: "healthy"`, `model_loaded: true` | **PASSED** |
| **TC-02** | Model Metadata Inspection | `GET /api/model-info` | Empty payload | HTTP 200, empirical metrics match `model_evaluation.json` | **PASSED** |
| **TC-03** | Model Comparison Lab | `GET /api/model-comparison` | Empty payload | HTTP 200, returns comparison matrix for 3 models + error analysis | **PASSED** |
| **TC-04** | Single Recommendation (Pos) | `POST /predict` | Positive review text | HTTP 200, `recommended_ind: 1`, $P > 0.5$, positive token weights | **PASSED** |
| **TC-05** | Single Recommendation (Neg) | `POST /predict` | Critical defect review | HTTP 200, `recommended_ind: 0`, $P < 0.5$, negative token weights | **PASSED** |
| **TC-06** | Backward Compatibility | `POST /predict` | `{"review_text": "..."}` | Exact `recommended_ind` integer returned | **PASSED** |
| **TC-07** | Bounded Batch Inference | `POST /predict/batch` | Array of 15 reviews | HTTP 200, 15 individual predictions + summary counts | **PASSED** |
| **TC-08** | Batch Boundary Limit | `POST /predict/batch` | > 1,000 reviews | HTTP 400 with safe error message | **PASSED** |
| **TC-09** | 3-Class Sentiment Polarity | `POST /predict/sentiment` | Critical defect review | HTTP 200, `sentiment_polarity: "Negative"` with class probabilities | **PASSED** |
| **TC-10** | 3-Class Sentiment Neutral | `POST /predict/sentiment` | Mixed fit review | HTTP 200, returns 3-class probability distribution | **PASSED** |
| **TC-11** | Aspect Discovery & Evidence | `POST /predict/aspects` | Review discussing fit & fabric | HTTP 200, extracts `Fit & Sizing` and `Fabric & Material` with snippets | **PASSED** |
| **TC-12** | Counterfactual What-If | `POST /predict/counterfactual` | Base text + modified text | HTTP 200, returns baseline vs counterfactual delta and shift | **PASSED** |
| **TC-13** | Input Length Safeguard | `POST /predict` | Review > 10,000 chars | HTTP 400, "Review text exceeds maximum allowed length" | **PASSED** |
| **TC-14** | Malformed JSON Payload | All POST endpoints | Malformed body | HTTP 400, "Malformed or empty JSON body" | **PASSED** |

---

### 2. Security & Data Integrity Validations

| Security Domain | Risk Description | Mitigation Implemented | Verification Method | Status |
|---|---|---|---|---|
| **CSV Formula Injection** | User review text starting with `=`, `+`, `-`, or `@` executes malicious commands when opened in Microsoft Excel or Google Sheets. | Prepending single quote (`'`) to all exported string cells starting with formula trigger characters (`=`, `+`, `-`, `@`). | Tested in `sanitizeForCsv` export utility. | **PASSED** |
| **Untrusted Deserialization** | Loading arbitrary `.joblib` files supplied by untrusted user uploads. | Static trusted server-side loading only; zero user-supplied model artifact deserialization. | Audited in `app.py`. | **PASSED** |
| **Data Privacy & Exfiltration** | Client review texts being stored or transmitted to external third-party LLMs. | Pure local in-memory session processing; zero remote cloud tracking or LLM API calls. | Audited in `api.ts` and `App.tsx`. | **PASSED** |
| **Denial of Service (DoS)** | Giant batch uploads consuming CPU resources. | Hard upper limit of 1,000 rows and 10,000 characters per review. | Verified in unit tests. | **PASSED** |

---

### 3. Frontend Component & Accessibility Test Matrix

| Component | Target Interaction | Success Criterion | Status |
|---|---|---|---|
| **In-Text Highlighting** | View analyzed review | Tokens color-coded by log-odds attribution ($\Delta_w$); hover displays exact weight. | **PASSED** |
| **What-If Sandbox** | Toggle words on/off | Real-time counterfactual prediction recalculates with probability delta. | **PASSED** |
| **Batch Review Drawer** | Click row in batch table | Slide-over drawer reveals full review metadata, aspect mentions, and probabilities. | **PASSED** |
| **Side-by-Side Comparison** | Select 2 reviews | Modal renders comparative cards side-by-side with shared token influence. | **PASSED** |
| **Model Comparison Lab** | Navigate to `/evaluation` | Renders performance cards, confusion matrices, and error analysis samples. | **PASSED** |
| **Mobile Responsiveness** | Resize to 390px (Mobile) | Full usability, hamburger menu toggle, table scroll container, zero horizontal spill. | **PASSED** |
