// Migration worker: retire the former offline result cache.
// Keep this URL available so existing installations can receive the update.
// There is deliberately no fetch handler: unavailable results must not fall
// back to a potentially different analysis release.
const LEGACY_CACHE_NAME = 'transfusion-dashboard-v1'
let retirement = Promise.resolve()

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  retirement = (async () => {
    await self.clients.claim()
    const cacheNames = await caches.keys()
    if (cacheNames.includes(LEGACY_CACHE_NAME)) {
      const cache = await caches.open(LEGACY_CACHE_NAME)
      const scope = new URL(self.registration.scope)
      const requests = await cache.keys()
      await Promise.all(requests.filter((request) => {
        const url = new URL(request.url)
        return url.origin === scope.origin && url.pathname.startsWith(scope.pathname)
      }).map((request) => cache.delete(request)))
    }
    // The old name was shared across this origin. Preserve other applications'
    // entries, including the original repository when running at its new URL.
    await self.registration.unregister()
  })()
  event.waitUntil(retirement)
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'transfusion-cache-retirement-check') return
  event.waitUntil(retirement.then(() => {
    event.ports[0]?.postMessage({ type: 'transfusion-cache-retirement-complete' })
  }))
})
