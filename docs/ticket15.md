# T-015: Deployment Configuration

| Field | Value |
|-------|-------|
| **ID** | T-015 |
| **Title** | Deployment Configuration |
| **Phase** | 6 - Polish & Deploy |
| **Priority** | High |
| **Depends On** | T-013, T-014 |
| **Blocks** | None |
| **Estimated Effort** | 2-3 hours |

---

## Objective

Configure the application for production deployment on static hosting (Vercel, Netlify, or GitHub Pages) with proper build optimization, caching, and CI/CD.

---

## Context

The dashboard is a static SPA with no server-side requirements:
- Pre-computed CSV data files served statically
- Client-side rendering only
- No authentication or user data
- Read-only visualization of research data

Recommended hosting: Vercel (free tier, excellent performance, easy setup)

---

## Requirements

### 1. Production Build Configuration

**Update `vite.config.ts`:**

```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    
    base: env.VITE_BASE_PATH || '/',
    
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
    
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-charts': ['chart.js', 'react-chartjs-2'],
            'vendor-data': ['papaparse', 'lodash-es'],
            'vendor-state': ['zustand'],
          },
          // Consistent chunk naming for caching
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
        },
      },
    },
    
    server: {
      port: 3000,
      open: true,
      // Proxy for development if needed
      // proxy: {}
    },
    
    preview: {
      port: 4173,
    },
  }
})
```

### 2. Environment Configuration

**Create `.env.example`:**

```bash
# Base path for deployment (e.g., /scandat-dashboard/ for GitHub Pages)
VITE_BASE_PATH=/

# Optional: Analytics
VITE_GA_ID=

# Optional: Error tracking
VITE_SENTRY_DSN=
```

**Create `.env.production`:**

```bash
VITE_BASE_PATH=/
```

### 3. Vercel Configuration

**Create `vercel.json`:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/data/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=604800" }
      ]
    },
    {
      "source": "/(.*).html",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

### 4. Netlify Configuration

**Create `netlify.toml`:**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/data/*"
  [headers.values]
    Cache-Control = "public, max-age=604800"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### 5. GitHub Pages Configuration

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        env:
          VITE_BASE_PATH: /scandat-dashboard/
        run: npm run build
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 6. CI/CD Pipeline

**Create `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Lint
        run: npm run lint
        
      - name: Type check
        run: npm run typecheck
        
      - name: Build
        run: npm run build
        
      - name: Check bundle size
        run: |
          MAX_SIZE=500000  # 500KB gzipped
          ACTUAL_SIZE=$(find dist/assets -name "*.js" -exec gzip -c {} \; | wc -c)
          echo "Bundle size: ${ACTUAL_SIZE} bytes (gzipped)"
          if [ $ACTUAL_SIZE -gt $MAX_SIZE ]; then
            echo "Bundle size exceeds ${MAX_SIZE} bytes!"
            exit 1
          fi

  lighthouse:
    runs-on: ubuntu-latest
    needs: lint-and-test
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
          configPath: ./lighthouserc.json
```

**Create `lighthouserc.json`:**

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": ["http://localhost/"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.8 }]
      }
    }
  }
}
```

### 7. Docker Configuration (Optional)

**Create `Dockerfile`:**

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Create `nginx.conf`:**

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml text/csv;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Cache data files
        location /data/ {
            expires 7d;
            add_header Cache-Control "public";
        }

        # Security headers
        add_header X-Frame-Options "DENY";
        add_header X-Content-Type-Options "nosniff";
        add_header Referrer-Policy "strict-origin-when-cross-origin";
    }
}
```

**Create `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

### 8. README Updates

**Add deployment section to `README.md`:**

```markdown
## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Vercel auto-detects Vite and configures build settings
3. Push to `main` branch to deploy

### Netlify

1. Connect your GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

### GitHub Pages

1. Go to repository Settings > Pages
2. Source: GitHub Actions
3. Push to `main` triggers automatic deployment

### Docker

```bash
docker build -t scandat-dashboard .
docker run -p 8080:80 scandat-dashboard
```

### Manual Deployment

```bash
npm run build
# Upload contents of `dist/` to your web server
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BASE_PATH` | Base URL path for deployment | `/` |
```

### 9. Pre-deployment Checklist

**Create `DEPLOY_CHECKLIST.md`:**

```markdown
# Pre-deployment Checklist

## Before Every Deploy

- [ ] All tests pass: `npm run lint && npm run typecheck`
- [ ] Production build succeeds: `npm run build`
- [ ] Preview build locally: `npm run preview`
- [ ] Lighthouse audit passes (score > 90)
- [ ] No console errors in production build
- [ ] All CSV data files present in `public/data/`

## First-time Setup

- [ ] Copy all CSV files to `public/data/`
- [ ] Verify file case matches (uppercase/lowercase)
- [ ] Set correct `VITE_BASE_PATH` if needed
- [ ] Configure custom domain (if applicable)
- [ ] Set up error tracking (optional)
- [ ] Set up analytics (optional)

## Post-deployment Verification

- [ ] Visit production URL
- [ ] Verify all four tabs load correctly
- [ ] Test theme toggle
- [ ] Test chart interactions
- [ ] Test SVG export
- [ ] Check browser console for errors
- [ ] Run Lighthouse on production URL
```

---

## Acceptance Criteria

- [ ] `npm run build` produces optimized production bundle
- [ ] Vercel deployment works with `vercel.json`
- [ ] Netlify deployment works with `netlify.toml`
- [ ] GitHub Pages deployment works with Actions workflow
- [ ] Docker image builds and runs correctly
- [ ] Cache headers are set correctly for assets/data
- [ ] SPA routing works (direct URL access to any tab)
- [ ] CI pipeline passes lint, typecheck, and build
- [ ] Lighthouse CI assertions pass
- [ ] README includes deployment instructions

---

## Deployment Steps (Vercel)

1. **Push code to GitHub**

2. **Connect to Vercel**:
   - Go to vercel.com
   - Import your GitHub repository
   - Vercel auto-detects Vite

3. **Configure**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Deploy**:
   - Click Deploy
   - Wait for build to complete
   - Visit generated URL

5. **Custom Domain** (optional):
   - Add domain in Vercel dashboard
   - Update DNS records

---

## Notes for Agent

1. **Base Path**: Only change `VITE_BASE_PATH` if deploying to a subdirectory (e.g., GitHub Pages with project name).

2. **Data Files**: Ensure all CSV files are copied to `public/data/` before building. They are NOT committed to git by default.

3. **Environment Variables**: Vite only exposes variables prefixed with `VITE_`.

4. **Cache Busting**: Vite adds content hashes to filenames automatically. Assets are safely cacheable.

5. **SPA Routing**: All hosting configs include SPA fallback to `index.html` for client-side routing.