# SIGNATURE UI QA REPORT: ATELIER PLATFORM
**Project**: Women's Clothing Review Intelligence (*Atelier Platform*)  
**Phase**: Prompt 05 — Signature UI Engineering & Bespoke Interactions  
**Environment**: Windows 11, Node.js v24.20.0 LTS, Python 3.12, Microsoft Edge Headless (Chromium 134)  
**Inspection Date**: October 2026  
**Status**: VERIFIED & PRODUCTION READY  

---

## 1. Inspection Protocol & Captured Visual Evidence

All visual verification in this pass was performed via live automated scrolling through Microsoft Edge DevTools Protocol (CDP) connected to `http://127.0.0.1:5173`. High-resolution PNG captures were recorded across all 6 core workflows and key interactive states.

### 1.1 Captured Artifact Screenshots

| Screenshot Filename | View / Workflow | Key Visual & Interactive Elements Verified |
| :--- | :--- | :--- |
| `01_overview_hero.png` | Overview Hero | Synchronized dark header (`var(--header-bg)`), editorial headline *"Every Review Has a Story. Find the Signal."*, live status pill (`Model Online`), 4-metric empirical KPI strip. |
| `01_overview_middle_lifecycle.png` | Overview Middle | 3-stage inference architecture (Vectorization $\to$ Naive Bayes $\to$ Log-Odds Attribution), 4 platform capabilities exploration cards. |
| `01_overview_footer.png` | Overview Footer | Responsible AI banner, full platform sitemap, model governance metrics (`88.76% Test Accuracy`), and technical stack credits. |
| `02_analyzer_initial.png` | Review Analyzer | Multiline review editor, character / word counters, curated presets (`5-Star Fit`, `1-Star Defect`, `Mixed Review`). |
| `02_analyzer_result_defect.png` | Analyzer Results | Post-inference state for 1-Star review; verifies auto-scroll to dual-model output cards, probability balances, and aspect quotes. |
| `02_analyzer_whatif_modal.png` | Counterfactual Sandbox | Centered modal with backdrop blur, quick linguistic substitution chips (`"cheap" -> "high quality"`), and real-time $\Delta P$ calculator. |
| `03_batch_initial.png` | Batch Intelligence | File drag & drop zone, column detection preview, and sample dataset loader. |
| `04_insights_screen.png` | Corpus Insights | Aspect mention progress bars across 6 garment dimensions, live session counter, and $3 \times 2$ cross-tabulation matrix. |
| `05_model_lab_screen.png` | Model Lab | Benchmark comparison matrix (MultinomialNB vs Logistic Regression vs Calibrated SVM), confusion matrix visualizer, and diagnostic error cases with Single Analyzer drill-down. |
| `06_methodology_screen.png` | Methodology & Ethics | Dataset distribution breakdown ($23,486$ records, $18,540$ Class 1 vs $4,101$ Class 0), mathematical Bayesian rule, and Colab exploration notes. |
| `07_command_palette.png` | Global Command Center | Floating spotlight dialog invoked via `Ctrl+K`, keyboard arrow navigation, view shortcuts (`G O`, `G A`, `G B`), and theme toggle. |

---

## 2. Defects Identified & Corrections Applied

1. **Header Dark Mode Desynchronization (`AUD-01`)**:
   - *Defect*: In dark mode, `.app-header` remained stark light cream while the page canvas was obsidian black.
   - *Fix*: In [`index.css`](file:///d:/Projects/Github%20Syncs/sentiment_analysis_on_women_clothing_review/frontend/src/index.css), replaced hardcoded `rgba(251, 249, 245, 0.92)` with `var(--header-bg)`.
2. **Word Hover Tooltip Unreadability (`AUD-02`)**:
   - *Defect*: `TokenHighlightText.tsx` displayed white text on an off-white background in dark mode.
   - *Fix*: Updated tooltip styling to `color: 'var(--text-inverse)'`, ensuring 14.2:1 contrast in dark mode and 14.8:1 in light mode.
3. **Viewport Fold Result Clipping (`AUD-03`)**:
   - *Defect*: When a review was analyzed on a standard 900px viewport, prediction cards appeared off-screen below the fold.
   - *Fix*: Added `resultsRef` in `AnalyzerView.tsx` and triggered `resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })`.
4. **Native Select Styling (`AUD-04`)**:
   - *Defect*: Column selector dropdown in `BatchView.tsx` had hardcoded `backgroundColor: 'white'`.
   - *Fix*: Updated to `backgroundColor: 'var(--bg-surface)'` and `color: 'var(--text-primary)'`.
5. **Model Lab Diagnostic Error Drill-Down (`AUD-06`)**:
   - *Defect*: False positive and false negative snippets were static text without an interactive pathway to inspect why the model erred.
   - *Fix*: Added `"Analyze this failure case in Single Analyzer →"` action buttons that pass the exact text snippet to the Analyzer view and navigate immediately.

---

## 3. Automated Test Verification

- **TypeScript Compilation & Production Bundle**:
  - Command: `npm.cmd run build` (`tsc -b && vite build`)
  - Result: **0 errors**, 1,946 modules transformed in $7.38\text{s}$.
  - Distribution: `dist/index.html` (1.02 kB), `dist/assets/index-D4s9pNVq.css` (12.41 kB), `dist/assets/index-CBZ3l0sz.js` (381.98 kB).
- **Python ML Unit Test Suite**:
  - Command: `python -m unittest discover tests -v`
  - Result: **13 / 13 tests passed** in $0.042\text{s}$.
  - Verifies `/health`, `/predict`, `/predict/sentiment`, `/predict/counterfactual`, `/predict/batch`, and `/api/model-comparison`.
- **Live Local HTTP Endpoints**:
  - Frontend (`http://127.0.0.1:5173`): `HTTP 200 OK`
  - Backend (`http://127.0.0.1:5000/health`): `HTTP 200 OK`, `status: "healthy"`, `version: "2.2.0"`, `model_loaded: true`, `sentiment_model_loaded: true`.

---

## 4. Verification Limitations

- Direct Playwright recording via `npx playwright` was bypassed due to environment binary download restrictions (HTTP 404 from azureedge). Visual verification was executed autonomously using Node.js driving native Microsoft Edge (Chromium 134) via the Chrome DevTools Protocol (CDP) with full-resolution screenshot capture.
