import { Suspense, lazy, useEffect } from 'react'
import { Layout, TabPanel, ErrorBoundary } from '@/components/layout'
import { GlossaryProvider } from '@/components/ui'
import { useDashboardStore, useThemeSync } from '@/stores/dashboardStore'
import { preloadData } from '@/services/dataService'
import './styles/global.css'

// Lazy load tab components for code splitting
const OverviewTab = lazy(() =>
  import('@/components/tabs/Overview/index').then(m => ({ default: m.OverviewTab }))
)
const MainFindingsTab = lazy(() =>
  import('@/components/tabs/MainFindings/index').then(m => ({ default: m.MainFindingsTab }))
)
const RBCTransfusionsTab = lazy(() =>
  import('@/components/tabs/RBCTransfusions/index').then(m => ({ default: m.RBCTransfusionsTab }))
)
const ComponentFactorEffectsTab = lazy(() =>
  import('@/components/tabs/ComponentFactorEffects/index').then(m => ({ default: m.ComponentFactorEffectsTab }))
)
const DescriptiveStatisticsTab = lazy(() =>
  import('@/components/tabs/DescriptiveStatistics/index').then(m => ({ default: m.DescriptiveStatisticsTab }))
)

function TabFallback() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '300px',
      color: 'var(--color-text-muted)'
    }}>
      Loading tab...
    </div>
  )
}

function App() {
  // Sync theme to DOM (sets data-theme attribute and light-theme class)
  useThemeSync()

  const activeTab = useDashboardStore(state => state.activeTab)

  // Preload critical data on mount
  useEffect(() => {
    preloadData().catch(console.error)
  }, [])

  return (
    <GlossaryProvider>
    <Layout>
      <TabPanel tabId="overview" isActive={activeTab === 'overview'}>
        <ErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            <OverviewTab />
          </Suspense>
        </ErrorBoundary>
      </TabPanel>

      <TabPanel tabId="descriptive-statistics" isActive={activeTab === 'descriptive-statistics'}>
        <ErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            <DescriptiveStatisticsTab />
          </Suspense>
        </ErrorBoundary>
      </TabPanel>

      <TabPanel tabId="main-findings" isActive={activeTab === 'main-findings'}>
        <ErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            <MainFindingsTab />
          </Suspense>
        </ErrorBoundary>
      </TabPanel>

      <TabPanel tabId="rbc-transfusions" isActive={activeTab === 'rbc-transfusions'}>
        <ErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            <RBCTransfusionsTab />
          </Suspense>
        </ErrorBoundary>
      </TabPanel>

      <TabPanel tabId="component-factor-effects" isActive={activeTab === 'component-factor-effects'}>
        <ErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            <ComponentFactorEffectsTab />
          </Suspense>
        </ErrorBoundary>
      </TabPanel>
    </Layout>
    </GlossaryProvider>
  )
}

export default App
