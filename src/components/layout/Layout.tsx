import { ReactNode } from 'react'
import { Header } from './Header'
import { TabNavigation } from './TabNavigation'
import { MobileNav } from './MobileNav'
import { LoadingOverlay } from './LoadingOverlay'
import { ErrorToast } from './ErrorToast'
import { SkipLink } from './SkipLink'
import { LiveRegion } from './LiveRegion'
import styles from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <SkipLink />
      <LiveRegion />
      <Header />
      <MobileNav />
      <TabNavigation />
      <main className={styles.main} id="main-content" role="main" tabIndex={-1}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
      <LoadingOverlay />
      <ErrorToast />
    </div>
  )
}
