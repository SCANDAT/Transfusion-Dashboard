# T-001: Project Scaffold & Tooling

| Field | Value |
|-------|-------|
| **ID** | T-001 |
| **Title** | Project Scaffold & Tooling |
| **Phase** | 1 - Foundation |
| **Priority** | Critical |
| **Depends On** | None |
| **Blocks** | T-003, T-006 |
| **Estimated Effort** | 2-3 hours |

---

## Objective

Initialize a new React + TypeScript project using Vite with all required dependencies and configuration files. This establishes the foundation for all subsequent development.

---

## Context

We are migrating a legacy vanilla JavaScript dashboard to a modern React architecture. The existing application:
- Uses Chart.js 3.9.1 for visualizations
- Parses CSV files with PapaParse 5.3.2
- Uses Lodash 4.17.21 for data manipulation
- Uses FileSaver.js 2.0.5 for SVG export
- Serves static files from a Python dev server

The new architecture will use Vite for fast development and optimized production builds.

---

## Requirements

### 1. Initialize Vite Project

```bash
npm create vite@latest scandat-dashboard -- --template react-ts
cd scandat-dashboard
```

### 2. Install Dependencies

**Production Dependencies:**
```bash
npm install chart.js@3.9.1 react-chartjs-2 papaparse lodash-es file-saver zustand
```

**Development Dependencies:**
```bash
npm install -D @types/papaparse @types/lodash-es @types/file-saver
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 3. Configure TypeScript

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@stores/*": ["src/stores/*"],
      "@types/*": ["src/types/*"],
      "@styles/*": ["src/styles/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4. Configure Vite

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### 5. Create Directory Structure

```
src/
├── components/
│   ├── layout/
│   ├── charts/
│   ├── controls/
│   └── tabs/
│       ├── MainFindings/
│       ├── RBCTransfusions/
│       ├── ComponentFactorEffects/
│       └── DescriptiveStatistics/
├── hooks/
├── services/
├── stores/
├── types/
└── styles/
```

### 6. Create Placeholder Files

Create minimal placeholder files to ensure imports work:

**`src/types/index.ts`:**
```typescript
// Type definitions will be added in T-003
export {}
```

**`src/stores/dashboardStore.ts`:**
```typescript
// Store implementation will be added in T-005
export {}
```

**`src/services/dataService.ts`:**
```typescript
// Data service will be added in T-004
export {}
```

### 7. Setup ESLint

Create `.eslintrc.cjs`:
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}
```

### 8. Create Public Data Directory

```bash
mkdir -p public/data
```

Add a `.gitkeep` file. The actual CSV files will be copied from the legacy project.

### 9. Update package.json Scripts

Ensure these scripts exist:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 10. Create Basic App Shell

**`src/App.tsx`:**
```typescript
import './styles/global.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>SCANDAT ICU Transfusion Dashboard</h1>
      </header>
      <main className="main">
        <p>Dashboard loading...</p>
      </main>
    </div>
  )
}

export default App
```

**`src/styles/global.css`:**
```css
/* Placeholder - tokens will be added in T-002 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}

.app {
  min-height: 100vh;
}
```

---

## Acceptance Criteria

- [ ] `npm run dev` starts the development server without errors
- [ ] `npm run build` completes without TypeScript or build errors
- [ ] `npm run lint` passes with no errors
- [ ] `npm run typecheck` passes with no errors
- [ ] All path aliases resolve correctly (test with a sample import)
- [ ] Directory structure matches specification
- [ ] Chart.js, PapaParse, Lodash-es, and FileSaver are installed at correct versions
- [ ] Zustand is installed for state management
- [ ] `public/data/` directory exists for CSV files

---

## Output Files

```
scandat-dashboard/
├── public/
│   └── data/
│       └── .gitkeep
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── layout/
│   │   ├── charts/
│   │   ├── controls/
│   │   └── tabs/
│   │       ├── MainFindings/
│   │       ├── RBCTransfusions/
│   │       ├── ComponentFactorEffects/
│   │       └── DescriptiveStatistics/
│   ├── hooks/
│   ├── services/
│   │   └── dataService.ts
│   ├── stores/
│   │   └── dashboardStore.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── global.css
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .eslintrc.cjs
└── .gitignore
```

---

## Notes for Agent

1. **Version Pinning**: Chart.js must be exactly 3.9.1 to maintain compatibility with existing chart configurations. Do not upgrade.

2. **Lodash-es vs Lodash**: Use `lodash-es` for proper tree-shaking. The legacy code uses the full `lodash` package.

3. **Path Aliases**: These are critical for clean imports. Test that `@components/...` resolves correctly before marking complete.

4. **No Runtime Code Yet**: This ticket creates structure only. Actual implementations come in later tickets.

5. **Git Initialization**: Initialize git and create an initial commit after setup is complete.