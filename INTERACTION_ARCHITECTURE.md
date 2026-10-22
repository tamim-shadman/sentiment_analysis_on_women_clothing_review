# Interaction Architecture (Prompt 06)
## Women's Clothing Review Intelligence (Atelier Platform)

**Document Version:** 1.0.0  
**Phase:** Prompt 06 — Next-Generation Interactive Workspace  
**Status:** Implemented & Verified  

---

### 1. Architectural Philosophy

Prior to this iteration, the *Atelier Review Intelligence* platform comprised visually distinct, feature-rich pages that operated largely in isolation. When navigating between batch analysis and analytical insights, context was lost; review filters were siloed; and users lacked global control over workspace ergonomics.

This architecture elevates the platform into a **unified, interactive, task-oriented workspace** where data state, filter parameters, and user preferences are preserved across the entire session lifecycle:

```
+--------------------------------------------------------------------------------------------------+
|                                    GLOBAL APPLICATION SHELL                                      |
|  [Header]: Brand Mark | Navigation Tabs | Command Trigger (Ctrl+K) | Health Pill | Prefs (Ctrl+,) |
|  [Contextual Bar]: Active Corpus Badge | Active Filter Breadcrumb Chips [x] | Quick Cross-View Jumps |
+--------------------------------------------------------------------------------------------------+
                                                 |
             +-----------------------------------+-----------------------------------+
             |                                   |                                   |
             v                                   v                                   v
+-------------------------+         +-------------------------+         +-------------------------+
|     REVIEW EXPLORER     |         |     CORPUS INSIGHTS     |         |     COHORT WORKSPACE    |
| • Multi-facet filters   | <-----> | • Clickable Aspect Bars | <-----> | • Side-by-side cohorts  |
| • Compact/Airy density  |         | • Clickable Matrix Cells|         | • Empirical delta shift |
| • Slide-over drawer     |         | • Drilldown to Explorer |         | • P(Rec), Length, Conf  |
+-------------------------+         +-------------------------+         +-------------------------+
             |                                   |                                   |
             +-----------------------------------+-----------------------------------+
                                                 |
                                                 v
+--------------------------------------------------------------------------------------------------+
|                                 CLIENT PERSONALIZATION ENGINE                                    |
|   localStorage ('atelier_workspace_prefs'): Theme (Light/Dark), Table Density (Comfortable/Compact)|
|   Default Landing View, Page Size (10/25/50) with safe fallback to system preferences             |
+--------------------------------------------------------------------------------------------------+
```

---

### 2. Contextual Shell & Analytical State Preservation

#### 2.1 State Elevation to `App.tsx`
- **Active Dataset State (`batchData`):** Elevating `BatchPredictionResponse` to application root ensures that navigating from `Batch Analysis` to `Insights`, `Analyze Review`, or `Model Lab` never wipes out an uploaded or analyzed dataset.
- **Unified Multi-Facet Filter State (`activeFilters`):**
  ```ts
  export interface ActiveFiltersState {
    recommendation: 'all' | '1' | '0';
    polarity: 'all' | 'Positive' | 'Neutral' | 'Negative';
    department: string;
    aspect: string;
    rating: string;
    searchQuery: string;
  }
  ```
- **Contextual Status Bar (`ContextualBar.tsx`):**
  - Renders directly underneath the header whenever an active dataset is present.
  - Displays:
    1. Active corpus scope pill: `Active Batch Corpus: 25 Reviews`
    2. Real-time active filter chips with `[x]` dismiss icons (e.g. `Aspect: Fit & Sizing [x]`, `Polarity: Negative [x]`, `Search: "dress" [x]`)
    3. One-click `Clear all` filter reset action
    4. Fast cross-view jump links (`Review Explorer`, `Corpus Insights`, `Compare Cohorts`)

#### 2.2 Cross-View Data Synchronization (Insights &rarr; Batch)
- Clicking any of the 6 **Apparel Aspect Mention bars** (e.g., *Fabric & Material*) in `InsightsView` calls `onDrilldownToBatch({ aspect: 'Fabric & Material' })`.
- Clicking any cell in the **Recommendation vs. Sentiment Polarity Matrix** (e.g., *Negative Polarity & Recommended*) filters the active review explorer table to precisely those reviews.
- Active filter selections are synchronized instantaneously and reflected in both the Contextual Bar and the Review Explorer table.

---

### 3. Global Command Center (`Ctrl+K`)

Accessible globally via `Ctrl+K` / `Cmd+K` or the header search trigger, the Command Center provides keyboard-first actions across 4 functional domains without hijacking standard input forms:

1. **Navigation:** Jump to Overview (`G O`), Single Analyzer (`G A`), Batch Explorer (`G B`), Insights (`G I`), Model Lab (`G L`), and Methodology (`G M`).
2. **Workspace Configuration:**
   - Open Workspace Preferences (`Ctrl+,`)
   - Toggle Table Density between Comfortable (airy `0.85rem` padding) and Compact (`0.42rem` spreadsheet height)
   - Toggle Visual Theme between Editorial Light and Obsidian Plum Dark
3. **Analytical Operations:**
   - Clear Active Review Filters
   - Open Interactive Cohort Comparison Workspace
   - Load Curated Sample Batch (15 / 25 reviews with metadata)
4. **Presets:** Direct injection of 5-star fit/fabric, 1-star defect/returns, and mixed-sizing customer feedback into Single Analyzer.

---

### 4. Advanced Review Explorer & Facet Architecture

The Review Explorer (`BatchView.tsx`) has been transformed into a full faceted exploration grid:
- **Primary Recommendation Filter:** All Recs, Recommended (`Class 1`), Not Recommended (`Class 0`).
- **Sentiment Polarity Facet:** Positive, Neutral, Negative.
- **Department Facet:** Dynamically extracted from dataset headers (`Tops`, `Dresses`, `Bottoms`, `Intimate`, etc.).
- **Apparel Aspect Facet:** Domain-specific apparel topics (`Fit & Sizing`, `Fabric & Material`, `Quality & Durability`, `Style & Cut`, `Comfort & Wearability`, `Value & Pricing`).
- **Rating Facet:** 5★, 4★, 3★, 2★, 1★ (extracted from metadata when available).
- **Search Query:** Instant in-memory text search with zero delay.
- **Contextual Review Detail Drawer:**
  - Full review body with zero truncation.
  - Recommendation decision badge with class definition ($1 = \text{Recommended}, 0 = \text{Not Recommended}$).
  - Aspect tags discovered within the text.
  - Full metadata key-value table.
  - Direct 1-click drilldown: `"Open in Single-Review Analyzer (Token Attribution)"`.

---

### 5. Interactive Cohort Comparison Workspace

Implemented in `CohortCompareModal.tsx`, this component enables rigorous empirical comparison between two subsets of customer reviews within the active corpus:
- **Comparison Dimensions:**
  - Recommendation Decision (Class 1 vs. Class 0)
  - Sentiment Polarity (Positive vs. Negative / Neutral)
  - Product Department (e.g. Tops vs. Dresses)
  - Apparel Aspect (e.g. Fit & Sizing vs. Fabric & Material)
- **Empirical Measures Calculated Live:**
  - Cohort Sample Sizes ($N_A$ vs. $N_B$) and % of total dataset.
  - Recommendation Rates ($P(\text{Rec} = 1)$).
  - Average review character lengths and $\Delta \text{Length}$.
  - Average Naive Bayes prediction confidence.
  - Sentiment Polarity Breakdown ($+\text{Pos}, \sim\text{Neu}, -\text{Neg}$).
  - Top discriminating apparel aspects.
- **Actionable Outcomes:**
  - One-click `"Filter Table to Cohort A"` or `"Filter Table to Cohort B"` buttons directly transition to the Review Explorer pre-filtered by the selected cohort.

---

### 6. Client Personalization & Ergonomics

Stored under `atelier_workspace_prefs` in browser `localStorage`:
- **Theme:** `'light'` (Warm alabaster editorial aesthetic) vs. `'dark'` (Obsidian plum slate aesthetic).
- **Table Density:**
  - `comfortable`: Standard `0.85rem` padding, relaxed vertical spacing.
  - `compact`: `0.42rem` cell padding, condensed typography, tight badges, optimized for multi-row data browsing.
- **Default Landing View:** Users can set their primary entry route (`overview`, `analyzer`, `batch`, `insights`, `lab`, `methodology`).
- **Default Table Page Size:** 10, 25, or 50 records per page.
- **Reset to Defaults:** Restores clean default configuration immediately.
