# SCANDAT ICU Transfusion Dashboard

Interactive visualization dashboard for peer-reviewed research on RBC transfusions in ICU patients.

**Live Demo:** https://scandat.github.io/Transfusion-Dashboard/

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

## Citation

If you use this dashboard or its associated research, please cite:

> [Citation to be added upon publication]

## License

MIT License. See [LICENSE](LICENSE) for details.

The visualization code is open source. The underlying research data and methodology are described in the associated peer-reviewed publication.
