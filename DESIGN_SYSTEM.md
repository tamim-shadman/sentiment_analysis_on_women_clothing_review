# ATELIER DESIGN SYSTEM SPECIFICATION
**Version**: 2.2.0  
**Design Language**: Editorial Fashion Intelligence  
**Target Compliance**: WCAG 2.2 Level AA  

---

## 1. Design Tokens Specification

### A. Color Palette & Functional Semantics
```css
:root {
  /* Surface Canvases */
  --bg-canvas: #FBF9F5;               /* Warm alabaster canvas */
  --bg-surface: #FFFFFF;              /* Clean white card surface */
  --bg-surface-subtle: #F5F1EB;       /* Secondary neutral surface */
  --bg-surface-warm: #FAF6F0;         /* Highlighted neutral container */
  --bg-overlay: rgba(26, 23, 21, 0.55);/* Darkened backdrop with blur */

  /* Ink & Typography */
  --text-primary: #1A1715;            /* Deep ink charcoal (contrast 14.8:1) */
  --text-secondary: #5A534B;          /* Muted charcoal body (contrast 7.2:1) */
  --text-tertiary: #877E75;           /* Caption & metadata (contrast 4.6:1) */
  --text-muted: #A8A096;              /* Subtle placeholder */
  --text-inverse: #FFFFFF;            /* Inverted text */

  /* Brand Signature */
  --brand-primary: #4A1D34;           /* Deep aubergine plum */
  --brand-primary-hover: #351324;     /* Deep hover state */
  --brand-tint: #F7EDF2;              /* Muted plum wash */
  --brand-accent: #C25975;            /* Dusty rose accent */
  --brand-accent-soft: #FDF1F4;       /* Soft rose tint */

  /* Semantic Prediction Outcomes */
  --sentiment-recommended: #1B6642;          /* Forest emerald (Class 1) */
  --sentiment-recommended-light: #EBF7F0;    /* Light green wash */
  --sentiment-recommended-border: #9DD0B5;   /* Green accent border */
  
  --sentiment-not-recommended: #962828;      /* Deep crimson (Class 0) */
  --sentiment-not-recommended-light: #FDF0F0;/* Light crimson wash */
  --sentiment-not-recommended-border: #E8ABAB;/* Crimson accent border */

  --sentiment-neutral: #5A6A80;              /* Neutral polarity blue-slate */
  --sentiment-neutral-light: #F0F4F8;        /* Soft neutral wash */
  --sentiment-neutral-border: #B8C7D9;       /* Slate border */

  /* Structural Dividers */
  --border-subtle: #EBE5DC;           /* Hairline card divider */
  --border-medium: #DCD4C9;           /* Interactive input borders */
  --border-strong: #968A7C;           /* High-contrast element borders */

  /* Elevation Shadows */
  --shadow-xs: 0 1px 2px rgba(26, 23, 21, 0.04);
  --shadow-sm: 0 2px 6px rgba(26, 23, 21, 0.04), 0 1px 2px rgba(26, 23, 21, 0.02);
  --shadow-md: 0 6px 18px rgba(26, 23, 21, 0.06), 0 2px 4px rgba(26, 23, 21, 0.03);
  --shadow-lg: 0 16px 36px rgba(26, 23, 21, 0.08), 0 4px 10px rgba(26, 23, 21, 0.04);
  --shadow-dropdown: 0 14px 40px rgba(26, 23, 21, 0.16);

  /* Geometry Radii */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Fonts */
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', Consolas, monospace;

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-smooth: 350ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 2. Typographic Scale & Hierarchy

| Role | Font Family | Size | Weight | Letter Spacing | Line Height |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | Serif (`Playfair Display`) | `clamp(2.4rem, 4vw, 3.4rem)` | 600 | `-0.02em` | `1.15` |
| **Page Title** | Serif (`Playfair Display`) | `2.4rem` (`38px`) | 600 | `-0.02em` | `1.2` |
| **Section Header** | Serif (`Playfair Display`) | `1.5rem` (`24px`) | 600 | `-0.01em` | `1.3` |
| **Card Header** | Sans (`Plus Jakarta Sans`) | `1.15rem` (`18px`) | 600 | `-0.01em` | `1.4` |
| **Section Eyebrow** | Monospace (`JetBrains Mono`) | `0.75rem` (`12px`) | 600 | `+0.12em` (caps) | `1.0` |
| **Body Large** | Sans (`Plus Jakarta Sans`) | `1.05rem` (`17px`) | 400 | `normal` | `1.65` |
| **Body Default** | Sans (`Plus Jakarta Sans`) | `0.92rem` (`15px`) | 400 | `normal` | `1.6` |
| **Body Small** | Sans (`Plus Jakarta Sans`) | `0.82rem` (`13px`) | 400 | `normal` | `1.5` |
| **Monospace Metric**| Monospace (`JetBrains Mono`) | `0.78rem` (`12.5px`)| 500 | `normal` | `1.4` |

---

## 3. Component Architecture & Conventions

### A. Navigation & Application Shell
- **Brand Mark**: Atelier serif logo with plum badge `ML v2.2`.
- **Navigation Tabs**: Pill style with subtle active elevation (`box-shadow: var(--shadow-xs)`), hover background (`--bg-surface-subtle`), and dark plum text on active.
- **Global Command Palette (`Ctrl+K` / `Cmd+K`)**:
  - Modal overlay with blurred background.
  - Quick fuzzy search across all application tabs and operations.
  - Shortcut keys displayed in monospaced tags (`Enter`, `Esc`, `↑`, `↓`).
- **Live Status Indicator**:
  - Real-time pulse ping indicator showing API latency and model connection health.

### B. Single-Review Analyzer
- **Editorial Text Area**:
  - Warm white input with subtle inner shadow, distinct focus ring (`0 0 0 3px rgba(74, 29, 52, 0.1)`).
  - Live character meter (`X / 10,000 characters`) and word counter with threshold color alerts.
  - Preset chips for 1-click loading of diverse customer reviews.
- **Dual-Model Results Card**:
  - Primary Recommendation Badge (`Recommended` vs `Not Recommended`) with exact posterior probabilities.
  - Separate 3-Class Sentiment Polarity Badge (`Positive`, `Neutral`, `Negative`) with 3-segment probability bar.
  - Inline token attribution text (`TokenHighlightText`) with hover tooltips displaying `Δ log-odds`.
  - Influential vocabulary token chips grouped into positive and negative pull.
  - Apparel aspect feedback cards with supporting review sentence quotes.
  - "Launch What-If Sandbox" launching the counterfactual editor.

### C. Batch Analysis Workspace
- **Dropzone & Preset Loader**:
  - Compact border with 1-click preset loader loading 25 real reviews with Department, Class, and Rating.
- **Multi-Facet Filters**:
  - Primary filter: Recommendation status (`All`, `Recommended`, `Not Recommended`).
  - Secondary filter: Sentiment polarity (`All`, `Positive`, `Neutral`, `Negative`).
  - Department filter: Dynamically detected garment departments (`Tops`, `Dresses`, `Bottoms`, `Intimate`, `Jackets`).
  - Search query box for full-text search.
- **Results Table**:
  - Checkboxes for selecting up to 2 rows for side-by-side comparison.
  - Sticky header with sort indicators (`Row #`, `Review Length`, `Confidence`).
  - Slide-over detail drawer on row click.
  - Formula-injection-safe CSV export (`sanitizeForCsv`).

### D. Model Evaluation Lab
- **Benchmark Comparison Table**:
  - Side-by-side metrics: Test Accuracy, Precision, Recall, F1-Score, ROC-AUC, Training Time, Inference Latency.
  - Deployed baseline (`MultinomialNB`) highlighted with emerald baseline badge.
- **Confusion Matrix Visualizer**:
  - $2 \times 2$ grid with True Negatives (578), False Positives (242), False Negatives (267), and True Positives (3,442).
- **Diagnostic Error Analysis**:
  - Real false-positive and false-negative review cards with empirical failure explanations.

---

## 4. Motion & Micro-Interactions

### Motion Principles
1. **Purposeful**: Motion only occurs to communicate state changes (drawer entry, tab switch, probability shift).
2. **Restrained**: Maximum duration is $350\text{ms}$; uses cubic-bezier curves (`cubic-bezier(0.16, 1, 0.3, 1)`) for organic deceleration.
3. **Reduced Motion**: Full `@media (prefers-reduced-motion: reduce)` override disables all non-essential transitions.

---

## 5. Accessibility Conventions
- **Contrast**: All text elements exceed the $4.5:1$ contrast requirement for normal text and $3:1$ for large headings.
- **Focus Indicators**: High-visibility `:focus-visible` outline using dusty rose `--brand-accent` with 2px offset.
- **Keyboard Traps**: All modals and drawers feature `Esc` dismissal, tab indexing, and focus trapping.
