import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { retireLegacyServiceWorker } from './services/serviceWorker'

async function startDashboard() {
  const root = document.getElementById('root')!
  if (import.meta.env.PROD) {
    try {
      await retireLegacyServiceWorker(import.meta.env.BASE_URL)
    } catch {
      // Do not request scientific results while a legacy cache may control them.
      const message = document.createElement('p')
      message.textContent = 'Unable to refresh the dashboard. Check your connection and reload.'
      message.setAttribute('role', 'alert')
      const reload = document.createElement('button')
      reload.textContent = 'Reload dashboard'
      reload.addEventListener('click', () => window.location.reload())
      root.replaceChildren(message, reload)
      return
    }
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

void startDashboard()
