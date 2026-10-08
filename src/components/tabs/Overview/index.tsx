import { useDashboardStore } from '@/stores/dashboardStore'
import type { TabId } from '@/types/store'
import styles from './Overview.module.css'

// Icons for key findings
function TrendUpIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function DropletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export function OverviewTab() {
  const setActiveTab = useDashboardStore(state => state.setActiveTab)

  const navigateTo = (tab: TabId) => {
    setActiveTab(tab)
  }

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Vital Signs Around RBC Transfusion in Intensive Care
        </h1>
        <p className={styles.subtitle}>
          This dashboard presents an observational study of vital signs and respiratory parameters
          around red blood cell transfusion in Stockholm intensive care units. It displays modelled
          trajectories and comparisons by donor and component characteristics. The manuscript and
          statistical interpretation are undergoing review before publication.
        </p>
      </section>

      <section className={styles.studyGlance}>
        <h2 className={styles.sectionTitle}>The Study at a Glance</h2>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>6,736</span>
            <span className={styles.statLabel}>ICU Patients</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>14,655</span>
            <span className={styles.statLabel}>Included RBC Units</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>3</span>
            <span className={styles.statLabel}>Hospital Sites</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>2014–2018</span>
            <span className={styles.statLabel}>Study Period</span>
          </div>
        </div>
        <p className={styles.studyDescription}>
          This dashboard presents findings from the <span className={styles.highlight}>SCANDAT</span> research
          group's analysis of recorded vital parameters in ICU patients before and after
          receiving red blood cell (RBC) transfusions. We examined whether these trajectories varied based
          on characteristics of the donated blood, including donor hemoglobin levels, storage time,
          donor sex, and donor parity.
        </p>
      </section>

      <section className={styles.keyFindings}>
        <h2 className={styles.sectionTitle}>Key Findings</h2>
        <p className={styles.findingsIntro}>
          The fitted trajectories describe patterns before and after transfusion start:
        </p>

        <div className={styles.findingsGrid}>
          <div className={styles.findingCard}>
            <div className={styles.findingIcon} style={{ color: 'var(--color-accent-highlight)' }}>
              <HeartIcon />
            </div>
            <h3 className={styles.findingTitle}>Heart Rate</h3>
            <p className={styles.findingText}>
              The fitted heart-rate trajectory falls around transfusion start. The decline begins before transfusion; its timing alone does not establish a transfusion effect.
            </p>
            <div className={styles.findingMeta}>
              <span className={styles.significance}>Modelled trajectory</span>
            </div>
          </div>

          <div className={styles.findingCard}>
            <div className={styles.findingIcon} style={{ color: 'var(--color-accent-primary)' }}>
              <TrendUpIcon />
            </div>
            <h3 className={styles.findingTitle}>Blood Pressure</h3>
            <p className={styles.findingText}>
              The fitted blood-pressure trajectories rise around transfusion start. Pre-transfusion trends and subsequent treatments are relevant to their interpretation.
            </p>
            <div className={styles.findingMeta}>
              <span className={styles.significance}>Modelled trajectory</span>
            </div>
          </div>

          <div className={styles.findingCard}>
            <div className={styles.findingIcon} style={{ color: 'var(--color-chart-3)' }}>
              <ActivityIcon />
            </div>
            <h3 className={styles.findingTitle}>Oxygen Saturation</h3>
            <p className={styles.findingText}>
              The fitted oxygen-saturation trajectory shows a small change on its native percentage scale. Interpret its size separately from statistical uncertainty.
            </p>
            <div className={styles.findingMeta}>
              <span className={styles.neutral}>Modelled trajectory</span>
            </div>
          </div>

          <div className={styles.findingCard}>
            <div className={styles.findingIcon} style={{ color: 'var(--color-accent-secondary)' }}>
              <DropletIcon />
            </div>
            <h3 className={styles.findingTitle}>Donor and Component Comparisons</h3>
            <p className={styles.findingText}>
              The dashboard compares trajectories across donor and component categories. Between-category contrasts and their uncertainty require reconciliation before drawing conclusions about effect modification.
            </p>
            <div className={styles.findingMeta}>
              <span className={styles.neutral}>Exploratory comparison</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.interpretation}>
        <h2 className={styles.sectionTitle}>What This Means</h2>
        <div className={styles.interpretationContent}>
          <div className={styles.interpretationCard}>
            <h3>For Clinicians</h3>
            <p>
              These observational trajectories describe physiology around transfusion. They do not establish a causal treatment benefit or determine which donor or component characteristics should guide clinical selection.
            </p>
          </div>
          <div className={styles.interpretationCard}>
            <h3>For Researchers</h3>
            <p>
              Interpret the trajectories alongside their time window, adjustment variables and reference covariate profile. A difference between whole trajectories and a difference in change between two time points answer different questions.
            </p>
          </div>
          <div className={styles.interpretationCard}>
            <h3>For Patients & Families</h3>
            <p>
              The curves summarise a research analysis across many transfusions. An individual patient can follow a different course, depending on illness and other treatments.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.navigationGuide}>
        <h2 className={styles.sectionTitle}>Explore the Data</h2>
        <p className={styles.navIntro}>
          This dashboard lets you explore the findings in detail. Here's what each section contains:
        </p>

        <div className={styles.navCards}>
          <button
            className={styles.navCard}
            onClick={() => navigateTo('descriptive-statistics')}
          >
            <div className={styles.navCardContent}>
              <h3>Study Population</h3>
              <p>
                Who was included in this study? View demographics, age distributions, and
                characteristics of the transfused blood products.
              </p>
              <span className={styles.navLink}>
                View population data <ArrowRightIcon />
              </span>
            </div>
          </button>

          <button
            className={styles.navCard}
            onClick={() => navigateTo('main-findings')}
          >
            <div className={styles.navCardContent}>
              <h3>Key Results</h3>
              <p>
                Summary tables and LOESS trajectory plots showing how each vital parameter
                changes in the hours surrounding transfusion.
              </p>
              <span className={styles.navLink}>
                View results <ArrowRightIcon />
              </span>
            </div>
          </button>

          <button
            className={styles.navCard}
            onClick={() => navigateTo('rbc-transfusions')}
          >
            <div className={styles.navCardContent}>
              <h3>Vital Trajectories</h3>
              <p>
                Interactive charts showing vital parameter trends over time. Compare different
                vital signs and adjust the time window.
              </p>
              <span className={styles.navLink}>
                Explore trajectories <ArrowRightIcon />
              </span>
            </div>
          </button>

          <button
            className={styles.navCard}
            onClick={() => navigateTo('component-factor-effects')}
          >
            <div className={styles.navCardContent}>
              <h3>Component Factors</h3>
              <p>
                Do donor characteristics matter? Explore how donor hemoglobin, sex, parity,
                and storage time relate to transfusion outcomes.
              </p>
              <span className={styles.navLink}>
                Analyze factors <ArrowRightIcon />
              </span>
            </div>
          </button>
        </div>
      </section>

      <section className={styles.methodology}>
        <div className={styles.methodologyHeader}>
          <InfoIcon />
          <h3>About the Analysis</h3>
        </div>
        <p>
          Results are based on linear mixed-effects models with random intercepts for patient ID,
          adjusted for time relative to transfusion (cubic spline), patient demographics, ICU ward,
          and other recorded covariates. The fully adjusted model adds crystalloid and noradrenaline
          volumes and medication indicators for periods preceding each vital-sign measurement.
        </p>
        <p className={styles.methodologyFooter}>
          The manuscript and analysis documentation are being reconciled before publication.
        </p>
      </section>
    </div>
  )
}
