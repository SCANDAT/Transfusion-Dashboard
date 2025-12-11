# T-002: Design Token Migration

| Field | Value |
|-------|-------|
| **ID** | T-002 |
| **Title** | Design Token Migration |
| **Phase** | 1 - Foundation |
| **Priority** | Critical |
| **Depends On** | None |
| **Blocks** | T-006, T-007, T-008 |
| **Estimated Effort** | 2-3 hours |

---

## Objective

Extract and migrate the complete CSS design system from the legacy `styles.css` (32KB) and `componentFactors.css` (7.8KB) into a modular token-based system. Preserve all visual properties exactly.

---

## Context

The legacy application has a polished design system with:
- Dark theme (default) and light theme
- CSS custom properties for colors, spacing, typography
- Theme-aware Chart.js configurations
- Responsive breakpoints
- Custom fonts (Montserrat, Inter, Roboto)

The migration must preserve visual parity exactly. This is a peer-reviewed scientific visualization—aesthetics are part of the deliverable.

---

## Requirements

### 1. Create Token Files

**`src/styles/tokens.css`** — Core design tokens:

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     COLOR TOKENS - DARK THEME (DEFAULT)
     ═══════════════════════════════════════════════════════════════ */
  
  /* Background Colors */
  --color-bg-main: #0a0a0a;
  --color-bg-card: #141414;
  --color-bg-elevated: #1a1a1a;
  --color-bg-hover: rgba(255, 255, 255, 0.05);
  
  /* Text Colors */
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.78);
  --color-text-tertiary: rgba(255, 255, 255, 0.5);
  --color-text-muted: rgba(255, 255, 255, 0.38);
  
  /* Accent Colors */
  --color-accent-highlight: #E82127;  /* SCANDAT/Tesla Red */
  --color-accent-primary: #0A84FF;    /* Apple Blue */
  --color-accent-secondary: #635BFF;  /* Stripe Purple */
  --color-accent-tertiary: #E62B1E;   /* Orange-Red */
  
  /* Semantic Colors */
  --color-error: #FF4B59;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-info: #0A84FF;
  
  /* Border Colors */
  --color-border-default: rgba(255, 255, 255, 0.1);
  --color-border-subtle: rgba(255, 255, 255, 0.05);
  --color-border-emphasis: rgba(255, 255, 255, 0.2);
  
  /* Chart Colors (8-color palette) */
  --color-chart-1: #635BFF;  /* Purple */
  --color-chart-2: #E82127;  /* Red */
  --color-chart-3: #10B981;  /* Green */
  --color-chart-4: #F59E0B;  /* Orange */
  --color-chart-5: #0A84FF;  /* Blue */
  --color-chart-6: #8B5CF6;  /* Purple accent */
  --color-chart-7: #EC4899;  /* Pink */
  --color-chart-8: #06B6D4;  /* Cyan */
  
  /* ═══════════════════════════════════════════════════════════════
     SPACING TOKENS
     ═══════════════════════════════════════════════════════════════ */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  
  /* ═══════════════════════════════════════════════════════════════
     TYPOGRAPHY TOKENS
     ═══════════════════════════════════════════════════════════════ */
  
  /* Font Families */
  --font-heading: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Roboto Mono', 'SF Mono', Consolas, monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* ═══════════════════════════════════════════════════════════════
     LAYOUT TOKENS
     ═══════════════════════════════════════════════════════════════ */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.4);
  
  /* Container widths */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
  
  /* Chart dimensions */
  --chart-height-sm: 300px;
  --chart-height-md: 400px;
  --chart-height-lg: 500px;
  --chart-max-width: 1056px;
  
  /* ═══════════════════════════════════════════════════════════════
     TRANSITION TOKENS
     ═══════════════════════════════════════════════════════════════ */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
  
  /* ═══════════════════════════════════════════════════════════════
     Z-INDEX SCALE
     ═══════════════════════════════════════════════════════════════ */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-toast: 500;
  --z-tooltip: 600;
}

/* ═══════════════════════════════════════════════════════════════
   LIGHT THEME OVERRIDES
   ═══════════════════════════════════════════════════════════════ */
.light-theme {
  /* Background Colors */
  --color-bg-main: #f8f9fa;
  --color-bg-card: #ffffff;
  --color-bg-elevated: #ffffff;
  --color-bg-hover: rgba(0, 0, 0, 0.05);
  
  /* Text Colors */
  --color-text-primary: #111827;
  --color-text-secondary: rgba(0, 0, 0, 0.7);
  --color-text-tertiary: rgba(0, 0, 0, 0.5);
  --color-text-muted: rgba(0, 0, 0, 0.38);
  
  /* Border Colors */
  --color-border-default: rgba(0, 0, 0, 0.1);
  --color-border-subtle: rgba(0, 0, 0, 0.05);
  --color-border-emphasis: rgba(0, 0, 0, 0.2);
  
  /* Shadows - lighter for light theme */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

### 2. Create Reset File

**`src/styles/reset.css`:**

```css
/* Modern CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;
}

p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}

#root {
  isolation: isolate;
}
```

### 3. Create Global Styles

**`src/styles/global.css`:**

```css
@import './reset.css';
@import './tokens.css';

/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@400&display=swap');

/* ═══════════════════════════════════════════════════════════════
   BASE STYLES
   ═══════════════════════════════════════════════════════════════ */
html {
  font-size: 16px;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  color: var(--color-text-primary);
  background-color: var(--color-bg-main);
  transition: background-color var(--transition-normal), color var(--transition-normal);
}

/* ═══════════════════════════════════════════════════════════════
   TYPOGRAPHY
   ═══════════════════════════════════════════════════════════════ */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--font-medium);
  line-height: var(--leading-tight);
  color: var(--color-text-primary);
}

h1 { font-size: var(--text-4xl); }
h2 { font-size: var(--text-3xl); }
h3 { font-size: var(--text-2xl); }
h4 { font-size: var(--text-xl); }
h5 { font-size: var(--text-lg); }
h6 { font-size: var(--text-base); }

p {
  color: var(--color-text-secondary);
}

a {
  color: var(--color-accent-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-accent-secondary);
}

code, pre {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

/* ═══════════════════════════════════════════════════════════════
   COMMON COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
.card {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2) var(--spacing-4);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background-color: var(--color-accent-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-accent-secondary);
}

.btn-secondary {
  background-color: transparent;
  border-color: var(--color-border-emphasis);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background-color: var(--color-bg-hover);
}

/* ═══════════════════════════════════════════════════════════════
   FORM ELEMENTS
   ═══════════════════════════════════════════════════════════════ */
select, input {
  background-color: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--text-sm);
  transition: border-color var(--transition-fast);
}

select:focus, input:focus {
  outline: none;
  border-color: var(--color-accent-primary);
}

input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent-primary);
}

input[type="range"] {
  accent-color: var(--color-accent-primary);
}

/* ═══════════════════════════════════════════════════════════════
   UTILITY CLASSES
   ═══════════════════════════════════════════════════════════════ */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.text-center { text-align: center; }
.text-right { text-align: right; }

.text-muted { color: var(--color-text-muted); }
.text-secondary { color: var(--color-text-secondary); }

.mt-1 { margin-top: var(--spacing-1); }
.mt-2 { margin-top: var(--spacing-2); }
.mt-4 { margin-top: var(--spacing-4); }
.mt-6 { margin-top: var(--spacing-6); }

.mb-1 { margin-bottom: var(--spacing-1); }
.mb-2 { margin-bottom: var(--spacing-2); }
.mb-4 { margin-bottom: var(--spacing-4); }
.mb-6 { margin-bottom: var(--spacing-6); }

/* ═══════════════════════════════════════════════════════════════
   SCROLLBAR STYLING
   ═══════════════════════════════════════════════════════════════ */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-main);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-emphasis);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

/* ═══════════════════════════════════════════════════════════════
   LOADING SPINNER
   ═══════════════════════════════════════════════════════════════ */
.loading-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: var(--z-modal-backdrop);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--color-border-default);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ═══════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════════════ */
.toast {
  position: fixed;
  bottom: var(--spacing-6);
  right: var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-toast);
  animation: slideIn 0.3s ease;
}

.toast-error {
  border-left: 4px solid var(--color-error);
}

.toast-success {
  border-left: 4px solid var(--color-success);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### 4. Create Chart Theme Hook

**`src/hooks/useChartTheme.ts`:**

```typescript
import { useMemo } from 'react'

export interface ChartTheme {
  gridColor: string
  tickColor: string
  legendColor: string
  tooltipBackground: string
  tooltipText: string
  fontFamily: string
}

export function useChartTheme(): ChartTheme {
  // This will be connected to the theme store in T-005
  // For now, detect from DOM
  const isLightTheme = typeof document !== 'undefined' 
    && document.body.classList.contains('light-theme')

  return useMemo(() => ({
    gridColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    tickColor: isLightTheme ? '#333333' : '#ffffff',
    legendColor: isLightTheme ? '#333333' : '#ffffff',
    tooltipBackground: isLightTheme ? '#ffffff' : '#1a1a1a',
    tooltipText: isLightTheme ? '#111827' : '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  }), [isLightTheme])
}

export const CHART_COLORS = [
  '#635BFF', // Purple
  '#E82127', // Red
  '#10B981', // Green
  '#F59E0B', // Orange
  '#0A84FF', // Blue
  '#8B5CF6', // Purple accent
  '#EC4899', // Pink
  '#06B6D4', // Cyan
] as const

export const SCANDAT_RED = '#E82127'
```

### 5. Update index.html

Ensure fonts are loaded:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="SCANDAT ICU Transfusion Data Dashboard - Visualizing peer-reviewed scientific findings about RBC transfusions in ICU patients" />
    <title>SCANDAT ICU Transfusion Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Acceptance Criteria

- [ ] All CSS custom properties from legacy `styles.css` are migrated to `tokens.css`
- [ ] Dark theme renders correctly (dark background, light text)
- [ ] Light theme renders correctly when `.light-theme` class is on body
- [ ] All 8 chart colors are defined and exported
- [ ] Typography scale matches legacy (Montserrat headings, Inter body)
- [ ] `useChartTheme` hook returns correct colors for both themes
- [ ] Scrollbar styling matches legacy
- [ ] Loading spinner and toast styles are implemented
- [ ] No visual regression from legacy CSS

---

## Verification

Create a test component to verify all tokens:

```tsx
// src/components/TokenTest.tsx (temporary, delete after verification)
export function TokenTest() {
  return (
    <div style={{ padding: 'var(--spacing-6)' }}>
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <p>Body text with secondary color</p>
      <div className="card">
        <p>Card component</p>
      </div>
      <button className="btn btn-primary">Primary Button</button>
      <button className="btn btn-secondary">Secondary Button</button>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        {[1,2,3,4,5,6,7,8].map(n => (
          <div 
            key={n}
            style={{ 
              width: 40, 
              height: 40, 
              backgroundColor: `var(--color-chart-${n})`,
              borderRadius: 'var(--radius-md)'
            }} 
          />
        ))}
      </div>
    </div>
  )
}
```

---

## Notes for Agent

1. **Exact Color Matching**: Colors must match the legacy implementation exactly. The SCANDAT red (#E82127) is a brand color.

2. **Font Loading**: Fonts are loaded via Google Fonts in `global.css`. The `@import` approach is used for simplicity; preconnect hints are in `index.html` for performance.

3. **CSS Variable Naming**: Use `--color-*` prefix for colors, `--spacing-*` for spacing, etc. This matches modern conventions.

4. **Theme Detection**: The `useChartTheme` hook currently reads from DOM. This will be replaced with store state in T-005.

5. **No Breaking Changes**: The light-theme class on body is the toggle mechanism, matching legacy behavior.