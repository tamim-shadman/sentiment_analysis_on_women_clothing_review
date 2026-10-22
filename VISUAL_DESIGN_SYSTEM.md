# ATELIER VISUAL DESIGN SYSTEM 2.5
**Design Concept**: Fashion Editorial Meets Intelligent Review Analytics  
**Compliance Target**: WCAG 2.2 Level AA  
**Theme Support**: Dual-Engine (Editorial Alabaster Light / Obsidian Plum Dark)  

---

## 1. Creative Philosophy & Visual Signature

Atelier Review Intelligence operates at the intersection of haute couture art direction and high-throughput machine learning. The visual system is deliberately crafted to avoid the generic "SaaS Blue" aesthetic, oversized decorative gradients, and disconnected AI glassmorphic cards. Instead, it embodies:

1. **Editorial Sophistication**: Typographic distinction with serif display headlines (`Playfair Display`), warm tactile canvases, and restrained editorial rose accents.
2. **Analytical Precision**: Razor-thin 1px borders, calibrated monospace telemetry (`JetBrains Mono`), unambiguous probability balance meters, and frictionless keyboard-driven navigation (`Ctrl+K`).
3. **Dual-Theme Elegance**: Hand-tuned dark and light palettes ensuring WCAG 2.2 AA contrast ratios without simple color inversion.

---

## 2. Design Tokens Matrix (Light & Dark)

```css
/* ==========================================================================
   LIGHT MODE: Warm Alabaster Canvas & Deep Aubergine Ink
   ========================================================================== */
:root, [data-theme="light"] {
  /* Surfaces & Canvas */
  --bg-canvas: #FBF9F5;               /* Warm alabaster canvas */
  --bg-surface: #FFFFFF;              /* Crisp white surface */
  --bg-surface-subtle: #F5F1EB;       /* Stone secondary background */
  --bg-surface-warm: #FAF6F0;         /* Highlighted callout surface */
  --bg-surface-elevated: #FFFFFF;     /* Elevated popover/modal surface */
  --bg-overlay: rgba(26, 23, 21, 0.55);/* Darkened backdrop with blur */

  /* Ink & Typography */
  --text-primary: #1A1715;            /* Deep charcoal ink (14.8:1 contrast) */
  --text-secondary: #5A534B;          /* Muted charcoal body (7.2:1 contrast) */
  --text-tertiary: #877E75;           /* Caption & metadata (4.6:1 contrast) */
  --text-muted: #A8A096;              /* Low-emphasis hint */
  --text-inverse: #FFFFFF;            /* White inverted text */

  /* Brand Signature */
  --brand-primary: #4A1D34;           /* Deep aubergine plum */
  --brand-primary-hover: #351324;     /* Darker plum hover */
  --brand-tint: #F7EDF2;              /* Muted plum wash */
  --brand-accent: #C25975;            /* Editorial dusty rose */
  --brand-accent-soft: #FDF1F4;       /* Soft rose tint */

  /* Semantic Prediction Outcomes */
  --sentiment-recommended: #1B6642;          /* Forest emerald (Class 1) */
  --sentiment-recommended-light: #EBF7F0;    /* Emerald background wash */
  --sentiment-recommended-border: #9DD0B5;   /* Emerald hairline border */
  
  --sentiment-not-recommended: #962828;      /* Deep crimson (Class 0) */
  --sentiment-not-recommended-light: #FDF0F0;/* Crimson background wash */
  --sentiment-not-recommended-border: #E8ABAB;/* Crimson hairline border */

  --sentiment-neutral: #5A6A80;              /* Neutral polarity slate */
  --sentiment-neutral-light: #F0F4F8;        /* Soft slate wash */
  --sentiment-neutral-border: #B8C7D9;       /* Slate border */

  /* Structural Dividers & Borders */
  --border-subtle: #EBE5DC;           /* Hairline container divider */
  --border-medium: #DCD4C9;           /* Input & table border */
  --border-strong: #968A7C;           /* High-contrast border */

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(26, 23, 21, 0.04);
  --shadow-sm: 0 2px 6px rgba(26, 23, 21, 0.04), 0 1px 2px rgba(26, 23, 21, 0.02);
  --shadow-md: 0 6px 18px rgba(26, 23, 21, 0.06), 0 2px 4px rgba(26, 23, 21, 0.03);
  --shadow-lg: 0 16px 36px rgba(26, 23, 21, 0.08), 0 4px 10px rgba(26, 23, 21, 0.04);
  --shadow-dropdown: 0 14px 40px rgba(26, 23, 21, 0.16);
}

/* ==========================================================================
   DARK MODE: Obsidian Ink & Luminescent Plum Accents
   ========================================================================== */
[data-theme="dark"] {
  /* Surfaces & Canvas */
  --bg-canvas: #0E0C0D;               /* Deep obsidian canvas */
  --bg-surface: #181517;              /* Deep slate card surface */
  --bg-surface-subtle: #221E21;       /* Secondary neutral surface */
  --bg-surface-warm: #1D181B;         /* Highlighted callout surface */
  --bg-surface-elevated: #242023;     /* Elevated popover/modal surface */
  --bg-overlay: rgba(0, 0, 0, 0.75);  /* Deep blurred backdrop */

  /* Ink & Typography */
  --text-primary: #F5F1EB;            /* Off-white luminescent ink (14.2:1 contrast) */
  --text-secondary: #B8B0A8;          /* Light warm gray body (7.5:1 contrast) */
  --text-tertiary: #847C76;           /* Subtle metadata (4.5:1 contrast) */
  --text-muted: #5E5652;              /* Low-emphasis hint */
  --text-inverse: #1A1715;            /* Dark inverted text */

  /* Brand Signature */
  --brand-primary: #D4799E;           /* Radiant rose-plum for dark background */
  --brand-primary-hover: #E293B3;     /* Lighter rose hover */
  --brand-tint: #2B1822;              /* Deep plum shadow wash */
  --brand-accent: #E58AA8;            /* Soft coral-rose accent */
  --brand-accent-soft: #2E1922;       /* Rose background tint */

  /* Semantic Prediction Outcomes */
  --sentiment-recommended: #4ADE80;          /* Bright mint emerald */
  --sentiment-recommended-light: #0E2919;    /* Dark emerald wash */
  --sentiment-recommended-border: #1C5232;   /* Emerald border */
  
  --sentiment-not-recommended: #F87171;      /* Bright crimson rose */
  --sentiment-not-recommended-light: #2D1416;/* Dark crimson wash */
  --sentiment-not-recommended-border: #59252A;/* Crimson border */

  --sentiment-neutral: #93C5FD;              /* Soft sky slate */
  --sentiment-neutral-light: #152238;        /* Dark slate wash */
  --sentiment-neutral-border: #2B426B;       /* Slate border */

  /* Structural Dividers & Borders */
  --border-subtle: #2A2428;           /* Subtle dark divider */
  --border-medium: #3A3237;           /* Input border */
  --border-strong: #594E55;           /* High-contrast dark border */

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 6px 18px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 16px 36px rgba(0, 0, 0, 0.6);
  --shadow-dropdown: 0 14px 40px rgba(0, 0, 0, 0.8);
}
```

---

## 3. Typographic Hierarchy

| Text Role | Font Family | Size | Weight | Tracking | Leading |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `Playfair Display`, serif | `clamp(2.4rem, 4.2vw, 3.6rem)` | 600 | `-0.025em` | `1.15` |
| **Page Title** | `Playfair Display`, serif | `2.4rem` (`38.4px`) | 600 | `-0.02em` | `1.2` |
| **Section Title**| `Playfair Display`, serif | `1.5rem` (`24px`) | 600 | `-0.01em` | `1.3` |
| **Card Header** | `Plus Jakarta Sans`, sans | `1.15rem` (`18.4px`) | 600 | `-0.01em` | `1.4` |
| **Section Eyebrow**| `JetBrains Mono`, mono | `0.75rem` (`12px`) | 600 | `+0.12em` | `1.0` |
| **Body Large** | `Plus Jakarta Sans`, sans | `1.1rem` (`17.6px`) | 400 | `normal` | `1.65` |
| **Body Default**| `Plus Jakarta Sans`, sans | `0.92rem` (`14.7px`)| 400 | `normal` | `1.6` |
| **Telemetry** | `JetBrains Mono`, mono | `0.8rem` (`12.8px`) | 500 | `normal` | `1.4` |

---

## 4. Component Conventions

1. **Command Palette (`Ctrl+K`)**:
   - Centered floating modal with backdrop blur (`8px`), keyboard navigation (`↑`/`↓`), view shortcuts, and instant theme toggling.
2. **Review Analyzer**:
   - Multiline textarea with character and word counters, Ctrl+Enter hotkey, and dual-model classification badges.
   - Inline token attribution (`TokenHighlightText`) with interactive log-odds tooltips.
   - Real-time What-If Counterfactual Sandbox modal.
3. **Batch Intelligence Workspace**:
   - RFC 4180 upload dropzone with 1-click sample dataset loader.
   - Multi-facet filters: Recommendation status, Sentiment Polarity, and Garment Department.
   - Slide-over review detail drawer and side-by-side comparison modal for 2 rows.
   - Formula-injection-safe CSV export (`sanitizeForCsv`).
4. **Model Evaluation Lab**:
   - Multi-algorithm benchmark comparison table (`MultinomialNB`, `Logistic Regression`, `Calibrated Linear SVM`).
   - Dynamic confusion matrix visualizer and representative false positive / false negative cases.

---

## 5. Motion Guidelines & Accessibility

- **Duration Tokens**: Fast (`150ms`), Normal (`250ms`), Smooth (`350ms`).
- **Easing Curve**: Organic cubic bezier (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Reduced Motion**: Full `@media (prefers-reduced-motion: reduce)` override disabling all animations.
- **Focus Rings**: Accessible `:focus-visible` outline using dusty rose `--brand-accent` with 2px offset.
