// Existing installations must finish retiring the old offline fallback before
// result requests start. Fresh installations do not register an offline worker.
export async function retireLegacyServiceWorker(basePath: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  const scope = new URL(basePath, window.location.origin)
  const existing = await navigator.serviceWorker.getRegistration(scope.href)
  // getRegistration can return a broader parent registration on a shared origin.
  // Only migrate this dashboard's exact scope.
  if (!existing || existing.scope !== scope.href) return

  let timeout: ReturnType<typeof setTimeout> | undefined
  let finished = false
  let dispose = () => {}
  const migration = async () => {
    const registration = await navigator.serviceWorker.register(
      new URL('sw.js', scope).href,
      { scope: scope.pathname, updateViaCache: 'none' }
    )
    // register() can return the existing active registration without a fresh
    // update check. Explicitly complete that check before choosing a worker.
    try {
      await registration.update()
    } catch (error) {
      // A fast replacement may already have unregistered itself. It must still
      // prove completed retirement below; other update failures remain fatal.
      if (!(error instanceof DOMException) || error.name !== 'InvalidStateError') throw error
    }
    if (finished) throw new Error('Dashboard update timed out.')
    const worker = registration.installing ?? registration.waiting ?? registration.active
    if (!worker) throw new Error('Dashboard update is unavailable.')

    if (worker.state !== 'activated') {
      await new Promise<void>((resolve, reject) => {
        const check = () => {
          if (worker.state === 'activated' || worker.state === 'redundant') {
            worker.removeEventListener('statechange', check)
            if (worker.state === 'activated') resolve()
            else reject(new Error('Dashboard update could not activate.'))
          }
        }
        dispose = () => worker.removeEventListener('statechange', check)
        worker.addEventListener('statechange', check)
        check()
      })
    }

    if (finished) throw new Error('Dashboard update timed out.')
    await new Promise<void>((resolve) => {
      const channel = new MessageChannel()
      dispose = () => {
        channel.port1.close()
        channel.port2.close()
      }
      channel.port1.onmessage = event => {
        if (event.data?.type !== 'transfusion-cache-retirement-complete') return
        channel.port1.close()
        resolve()
      }
      worker.postMessage({ type: 'transfusion-cache-retirement-check' }, [channel.port2])
    })
  }

  try {
    await Promise.race([
      migration(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Dashboard update timed out.')), 10000)
      }),
    ])
  } finally {
    finished = true
    clearTimeout(timeout)
    dispose()
  }
}
