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
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Understanding RBC Transfusion Effects in ICU Patients
        </h1>
        <p className={styles.subtitle}>
          The <span className={styles.highlight}>SCANDAT</span> ICU Transfusion Data Dashboard serves to
          interactively present the findings of the <span className={styles.highlight}>SCANDAT</span> research
          group's analysis of 14,655 RBC transfusions administered to 6,736 unique ICU patients in four
          Stockholm-region hospitals between January 2014 – November 2018. Our study investigates how
          continuously monitored vital parameters change following RBC transfusions and whether variations
          in RBC component factors alter these trajectories.
        </p>
      </section>

      {/* Study At A Glance */}
      <section className={styles.studyGlance}>
        <h2 className={styles.sectionTitle}>The Study at a Glance</h2>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>6,736</span>
            <span className={styles.statLabel}>ICU Patients</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>14,655</span>
            <span className={styles.statLabel}>RBC Transfusions</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>4</span>
            <span className={styles.statLabel}>Stockholm Hospitals</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>2014–2018</span>
            <span className={styles.statLabel}>Study Period</span>
          </div>
        </div>
        <p className={styles.studyDescription}>
          This dashboard presents findings from the <span className={styles.highlight}>SCANDAT</span> research
          group's analysis of continuously monitored vital parameters in ICU patients before and after
          receiving red blood cell (RBC) transfusions. We examined whether patient outcomes varied based
          on characteristics of the donated blood, including donor hemoglobin levels, storage time,
          donor sex, and donor parity.
        </p>
      </section>

      {/* Key Findings */}
      <section className={styles.keyFindings}>
        <h2 className={styles.sectionTitle}>Key Findings</h2>
        <p className={styles.findingsIntro}>
          Our analysis reveals several important patterns in how vital signs respond to transfusion:
        </p>

        <div className={styles.findingsGrid}>
          <div className={styles.findingCard}>
            <div className={styles.findingIcon} style={{ color: 'var(--color-accent-highlight)' }}>
              <HeartIcon />
            </div>
            <h3 className={styles.findingTitle}>Heart Rate Decreases</h3>
            <p className={styles.findingText}>
              Following transfusion, heart rate shows a consistent <strong>decrease of approximately
              2-3 beats per minute</strong>, suggesting reduced cardiovascular stress as oxygen
              delivery improves.
            </p>
            <div className={styles.findingMeta}>
              <span className={styles.significance}>Statistically significant</span>
            </div>
          </div>

          <div className={styles.findingCard}>
            <div className={styles.findingIcon} style={{ color: 'var(--color-accent-primary)' }}>
              <TrendUpIcon />
            </div>
            <h3 className={styles.findingTitle}>Blood Pressure Increases</h3>
            <p className={styles.findingText}>
              Mean arterial pressure shows a <strong>modest increase of 1-2 mmHg</strong> following
              transfusion, reflecting improved circulatory volume and vascular tone.
            </p>
            <div className={styles.findingMeta}>
              <span className={styles.significance}>Statistically significant</span>
            </div>
          </div>

          <div className={styles.findingCard}>
            <div className={styles.findingIcon} style={{ color: 'var(--color-chart-3)' }}>
              <ActivityIcon />
            </div>
            <h3 className={styles.findingTitle}>Oxygen Saturation Stable</h3>
            <p className={styles.findingText}>
              SpO2 levels remain <strong>relatively unchanged</strong> after transfusion, which is
              expected as most ICU patients already receive supplemental oxygen to maintain saturation.
            </p>
            <div className={styles.findingMeta}>
              <span className={styles.neutral}>No significant change</span>
            </div>
          </div>

          <div className={styles.findingCard}>
            <div className={styles.findingIcon} style={{ color: 'var(--color-accent-secondary)' }}>
              <DropletIcon />
            </div>
            <h3 className={styles.findingTitle}>Component Factors: Minimal Impact</h3>
            <p className={styles.findingText}>
              <strong>Donor characteristics</strong> (hemoglobin, sex, parity) and <strong>storage
              time</strong> showed <strong>no clinically significant effects</strong> on vital
              parameter trajectories in our adjusted models.
            </p>
            <div className={styles.findingMeta}>
              <span className={styles.neutral}>Reassuring for transfusion practice</span>
            </div>
          </div>
        </div>
      </section>

      {/* What This Means */}
      <section className={styles.interpretation}>
        <h2 className={styles.sectionTitle}>What This Means</h2>
        <div className={styles.interpretationContent}>
          <div className={styles.interpretationCard}>
            <h3>For Clinicians</h3>
            <p>
              These findings support current transfusion practices. While vital signs show measurable
              changes following RBC transfusion, the lack of significant effects from component factors
              suggests that standard blood bank protocols for donor selection and storage are appropriate.
            </p>
          </div>
          <div className={styles.interpretationCard}>
            <h3>For Researchers</h3>
            <p>
              The observed physiological responses provide benchmarks for future studies. The absence
              of component factor effects in this large cohort may help refine hypotheses about which
              patient subgroups, if any, might benefit from specific blood product selection.
            </p>
          </div>
          <div className={styles.interpretationCard}>
            <h3>For Patients & Families</h3>
            <p>
              This research confirms that blood transfusions generally have the expected beneficial
              effects on circulation, and that the specific characteristics of donated blood do not
              appear to make a meaningful difference in how patients respond.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Guide */}
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

      {/* Methodology Note */}
      <section className={styles.methodology}>
        <div className={styles.methodologyHeader}>
          <InfoIcon />
          <h3>About the Analysis</h3>
        </div>
        <p>
          Results are based on linear mixed-effects models with random intercepts for patient ID,
          adjusted for time relative to transfusion (cubic spline), patient demographics, ICU ward,
          and concurrent treatments. The "Fully Adjusted Model" additionally controls for crystalloid
          fluids, vasopressors, and sedatives administered before transfusion.
        </p>
        <p className={styles.methodologyFooter}>
          For complete methodology, see the peer-reviewed publication.
        </p>
      </section>
    </div>
  )
}
