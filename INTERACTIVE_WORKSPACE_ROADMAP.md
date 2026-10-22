# Interactive Workspace Roadmap (Prompt 06)
## Women's Clothing Review Intelligence (Atelier Platform)

**Document Version:** 1.0.0  
**Phase:** Prompt 06 — Next-Generation Interactive Workspace  
**Status:** In Active Execution  

---

### 1. Executive Summary & Audit Findings

Following deep inspection of the current live application (ML v2.2.0, dual light/dark themes, batch processing, single analyzer with token highlights, and model evaluation benchmarks), this roadmap addresses the transition from a collection of isolated analytical pages into a **unified, interactive, task-oriented workspace**.

#### Key Opportunities Identified in Audit:
1. **Analytical State Dissociation:** When switching tabs from `Batch` to `Insights` or `Analyzer`, the uploaded/analyzed dataset and active filters were stored in local component state in `BatchView`. Navigating away and back reset the table state.
2. **Missing Cross-View Interactivity:** In `InsightsView`, aspect bars and cross-tabulation cells displayed static distributions without allowing users to drill down into the underlying reviews in `BatchView`.
3. **No Central Preferences / Density Control:** High-density review tables required manual scrolling without a compact mode, and user view preferences were not persisted beyond simple theme toggling.
4. **Command Palette Underutilization:** The palette (`Ctrl+K`) lacked direct access to table density controls, filter clearing, cohort comparison, or preset batch operations.
5. **Cohort Comparison Depth:** While review-to-review comparison existed, cohort-level analytical comparison (e.g. Recommended vs Not Recommended, or Department A vs Department B) was missing.

---

### 2. Prioritized Roadmap & Task Matrix

| Priority | Feature / Module | Affected Files | Expected Behavior | Verification Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | **Analytical State Preservation in Shell** | `App.tsx`, `BatchView.tsx` | Elevate `batchResult`, `activeFilters`, and selected review context to `App.tsx`. Switching tabs preserves dataset, table page, and applied filters without data loss. | Navigate between Batch → Insights → Analyzer → Batch; verify data and filter persistence. | Planned |
| **P0** | **User Preferences & Personalization** | `App.tsx`, `index.css`, `Header.tsx`, `PreferencesModal.tsx` | Store preferences (`theme`, `density: comfortable/compact`, `defaultTab`, `pageSize: 10/25/50`) in `localStorage` under `atelier_workspace_prefs`. Apply compact table styles dynamically. | Toggle compact mode; verify table padding tightens; reload page; verify settings persist. | Planned |
| **P0** | **Cross-View Drilldown (Insights → Batch)** | `InsightsView.tsx`, `BatchView.tsx`, `App.tsx` | Clicking an Aspect bar (e.g. *Fabric & Material*) or a cell in the Recommendation vs Polarity matrix navigates to `BatchView` with corresponding filters active. | Click "Fabric & Material" bar; verify tab switches to Batch and table filters to reviews mentioning fabric. | Planned |
| **P1** | **Advanced Review Explorer & Multi-Facet Filters** | `BatchView.tsx` | Add Aspect facet filter, Rating facet filter, and an Active Filter Removable Pill Bar. Provide clear empty states and one-click reset. | Filter by Aspect + Polarity; verify active filter chips show; click chip [x] to remove. | Planned |
| **P1** | **Interactive Cohort Comparison Workspace** | `BatchView.tsx`, `CohortCompareModal.tsx` | Allow users to compare two cohorts (e.g., Recommended vs Not Recommended, or Department X vs Department Y) with empirical metric shifts (N, % recommended, length, aspect frequency). | Select two cohorts; inspect side-by-side metrics; verify mathematical consistency. | Planned |
| **P1** | **Global Command Center Enhancement** | `CommandPalette.tsx` | Expand `Ctrl+K` with Table Density toggles, Active Filter clear, Sample Batch trigger, and Preferences modal trigger. | Press `Ctrl+K`, search "compact", press Enter; verify table density toggles immediately. | Planned |
| **P2** | **Contextual Header & Dataset Status** | `Header.tsx`, `ContextualBar.tsx` | Display current active dataset name, record count, and active filter pill summary directly below the header or within views. | Load sample batch; observe dataset status badge in header and contextual breadcrumb. | Planned |
| **P2** | **Full Accessibility & Viewport Audit** | All components, `index.css` | Test viewports (320px to 1920px), ensure WCAG 2.2 AA visible focus, accessible ARIA labels, escape key listeners, and reduced-motion support. | Run headless CDP inspection across viewports; verify no overflow or focus trapping. | Planned |

---

### 3. Architecture & Data Integrity Guardrails

- **Zero Breaking ML Changes:** Binary recommendation semantics ($1 = \text{Recommended}, 0 = \text{Not Recommended}$) and 3-class sentiment polarity ($Positive, Neutral, Negative$) remain distinct and mathematically rigorous.
- **RFC 4180 & CSV Formula Injection Protection:** Preserved across all CSV parsing and exports.
- **Debounced Text Search:** In-memory search is instant, avoiding extraneous debouncing delays for small batches, while maintaining smooth 60fps rendering.
- **Fail-Safe Fallbacks:** Corrupted or empty `localStorage` values fallback gracefully to safe default preferences (`light` or system theme, `comfortable` density, `overview` landing, `10` page size).
