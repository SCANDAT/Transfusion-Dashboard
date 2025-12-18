# SCANDAT ICU Transfusion Dashboard

Interactive visualization dashboard for peer-reviewed research on RBC transfusions in ICU patients.

## About

This dashboard presents findings from a study of 6,736 ICU patients who received 14,655 RBC transfusions across four Stockholm-region hospitals (January 2014 - November 2018). It visualizes how transfusions affect patient vital signs, with analyses by donor characteristics and storage duration.

## Features

- **Overview**: Summary of study population and key findings
- **Descriptive Statistics**: Patient and donor demographics
- **Main Findings**: Summary tables and forest plots
- **RBC Transfusion Effects**: Time-series visualization of vital parameter changes
- **Component Factor Effects**: Interactive exploration by donor/storage factors

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run preview
```

## Technology

- React 18 + TypeScript
- Vite
- Chart.js
- Zustand (state management)

## Documentation

See [docs/architecture.md](docs/architecture.md) for technical documentation.

## License

This project accompanies a peer-reviewed scientific publication. See the associated article for data usage terms.
