import { afterEach, describe, expect, it, vi } from 'vitest'
import { runInNewContext } from 'node:vm'
import workerSource from '../../../public/sw.js?raw'
import { retireLegacyServiceWorker } from '../serviceWorker'

const scope = `${window.location.origin}/dashboard/`

class TestPort {
  onmessage: ((event: { data: unknown }) => void) | null = null
  peer?: TestPort
  close = vi.fn()
  postMessage(data: unknown) {
    this.peer?.onmessage?.({ data })
  }
}

class TestChannel {
  port1 = new TestPort()
  port2 = new TestPort()
  constructor() {
    this.port1.peer = this.port2
    this.port2.peer = this.port1
  }
}

function mockContainer(existingScope: string | null = scope) {
  const worker = {
    state: 'activated',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    postMessage: vi.fn((_message: unknown, ports: TestPort[]) => {
      ports[0]?.postMessage({ type: 'transfusion-cache-retirement-complete' })
    }),
  }
  const registration = { active: worker, installing: undefined as typeof worker | undefined, update: vi.fn().mockResolvedValue(undefined) }
  const container = {
    getRegistration: vi.fn().mockResolvedValue(existingScope ? { scope: existingScope } : undefined),
    register: vi.fn().mockResolvedValue(registration),
  }
  vi.stubGlobal('navigator', { serviceWorker: container })
  vi.stubGlobal('MessageChannel', TestChannel)
  return { container, worker, registration }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('legacy worker startup migration', () => {
  it('continues without registering a worker for a fresh installation', async () => {
    const { container } = mockContainer(null)
    await retireLegacyServiceWorker('/dashboard/')
    expect(container.register).not.toHaveBeenCalled()
  })

  it('does not replace a different application parent registration', async () => {
    const { container } = mockContainer(`${window.location.origin}/`)
    await retireLegacyServiceWorker('/dashboard/')
    expect(container.register).not.toHaveBeenCalled()
  })

  it('continues in browsers without service-worker support', async () => {
    vi.stubGlobal('navigator', {})
    await expect(retireLegacyServiceWorker('/dashboard/')).resolves.toBeUndefined()
  })

  it('requests a fresh worker and waits for an explicit cleanup acknowledgement', async () => {
    const { container, worker } = mockContainer()
    let acknowledge: (() => void) | undefined
    worker.postMessage.mockImplementation((_message: unknown, ports: TestPort[]) => {
      acknowledge = () => ports[0]?.postMessage({ type: 'transfusion-cache-retirement-complete' })
    })
    let ready = false
    const migration = retireLegacyServiceWorker('/dashboard/').then(() => { ready = true })
    await vi.waitFor(() => expect(worker.postMessage).toHaveBeenCalled())
    expect(ready).toBe(false)
    expect(container.register).toHaveBeenCalledWith(`${scope}sw.js`, {
      scope: '/dashboard/', updateViaCache: 'none',
    })
    acknowledge?.()
    await migration
    expect(ready).toBe(true)
  })

  it('waits until the replacement worker activates before checking cleanup', async () => {
    const { registration, worker } = mockContainer()
    worker.state = 'installing'
    let stateChange: (() => void) | undefined
    worker.addEventListener.mockImplementation((_type: string, callback: () => void) => {
      stateChange = callback
    })
    registration.installing = worker
    const migration = retireLegacyServiceWorker('/dashboard/')
    await vi.waitFor(() => expect(worker.addEventListener).toHaveBeenCalled())
    expect(worker.postMessage).not.toHaveBeenCalled()
    worker.state = 'activated'
    stateChange?.()
    await migration
    expect(worker.postMessage).toHaveBeenCalled()
    expect(worker.removeEventListener).toHaveBeenCalled()
  })

  it('checks for an updated worker even when register returns the old active worker', async () => {
    const { registration, worker } = mockContainer()
    const oldPostMessage = vi.fn()
    registration.active = { ...worker, postMessage: oldPostMessage }
    registration.update.mockImplementation(async () => { registration.installing = worker })
    await retireLegacyServiceWorker('/dashboard/')
    expect(registration.update).toHaveBeenCalledOnce()
    expect(worker.postMessage).toHaveBeenCalledOnce()
    expect(oldPostMessage).not.toHaveBeenCalled()
  })

  it('accepts a fast self-unregistered replacement only after its cleanup acknowledgement', async () => {
    const { registration, worker } = mockContainer()
    registration.update.mockRejectedValue(new DOMException('Already unregistered', 'InvalidStateError'))
    await retireLegacyServiceWorker('/dashboard/')
    expect(worker.postMessage).toHaveBeenCalledOnce()
  })

  it('does not mistake an update network failure for successful retirement', async () => {
    const { registration, worker } = mockContainer()
    registration.update.mockRejectedValue(new TypeError('Network unavailable'))
    await expect(retireLegacyServiceWorker('/dashboard/')).rejects.toThrow('Network unavailable')
    expect(worker.postMessage).not.toHaveBeenCalled()
  })

  it('rejects an update failure rather than allowing old-cache result requests', async () => {
    const { container } = mockContainer()
    container.register.mockRejectedValue(new Error('Network unavailable'))
    await expect(retireLegacyServiceWorker('/dashboard/')).rejects.toThrow('Network unavailable')
  })

  it('bounds an unresponsive legacy worker and closes its message ports', async () => {
    vi.useFakeTimers()
    const { worker } = mockContainer()
    let sentPort: TestPort | undefined
    worker.postMessage.mockImplementation((_message: unknown, ports: TestPort[]) => {
      sentPort = ports[0]
    })
    const result = expect(retireLegacyServiceWorker('/dashboard/')).rejects.toThrow('timed out')
    await vi.advanceTimersByTimeAsync(10000)
    await result
    expect(sentPort?.close).toHaveBeenCalled()
    expect(sentPort?.peer?.close).toHaveBeenCalled()
  })
})

type WorkerEvent = { waitUntil: (promise: Promise<unknown>) => void; data?: { type: string }; ports?: TestPort[] }

function loadMigrationWorker(requestUrls: string[]) {
  const listeners = new Map<string, (event: WorkerEvent) => void>()
  const cache = {
    keys: vi.fn().mockResolvedValue(requestUrls.map(url => ({ url }))),
    delete: vi.fn().mockResolvedValue(true),
  }
  const cacheStorage = {
    keys: vi.fn().mockResolvedValue(['transfusion-dashboard-v1', 'another-application']),
    open: vi.fn().mockResolvedValue(cache),
    delete: vi.fn(),
  }
  const self = {
    addEventListener: (type: string, callback: (event: WorkerEvent) => void) => listeners.set(type, callback),
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
    registration: { scope, unregister: vi.fn().mockResolvedValue(true) },
  }
  runInNewContext(workerSource, { self, caches: cacheStorage, URL })
  async function dispatch(type: string, rest: Partial<WorkerEvent> = {}) {
    let completion = Promise.resolve<unknown>(undefined)
    listeners.get(type)?.({ waitUntil: promise => { completion = promise }, ...rest })
    await completion
  }
  return { listeners, cache, cacheStorage, self, dispatch }
}

describe('migration worker lifecycle', () => {
  it('retires promptly without intercepting any result or page requests', async () => {
    const { listeners, self, dispatch } = loadMigrationWorker([])
    await dispatch('install')
    await dispatch('activate')
    expect(self.skipWaiting).toHaveBeenCalledOnce()
    expect(self.clients.claim).toHaveBeenCalledOnce()
    expect(self.registration.unregister).toHaveBeenCalledOnce()
    expect(listeners.has('fetch')).toBe(false)
  })

  it('deletes only this dashboard scope from its verified legacy cache', async () => {
    const matching = [`${scope}data/results.csv`, `${scope}index.html`]
    const others = [
      `${window.location.origin}/original-dashboard/data/results.csv`,
      `${window.location.origin}/dashboard-other/index.html`,
      'https://other.example/dashboard/data/results.csv',
    ]
    const { cache, cacheStorage, dispatch } = loadMigrationWorker([...matching, ...others])
    await dispatch('activate')
    expect(cacheStorage.open).toHaveBeenCalledTimes(1)
    expect(cacheStorage.open).toHaveBeenCalledWith('transfusion-dashboard-v1')
    expect(cache.delete.mock.calls.map(call => call[0].url)).toEqual(matching)
    expect(cacheStorage.delete).not.toHaveBeenCalled()
  })

  it('does not create a legacy cache when none exists', async () => {
    const { cacheStorage, dispatch } = loadMigrationWorker([])
    cacheStorage.keys.mockResolvedValue(['another-application'])
    await dispatch('activate')
    expect(cacheStorage.open).not.toHaveBeenCalled()
  })

  it('acknowledges completion only after cleanup and unregistration finish', async () => {
    const { self, dispatch } = loadMigrationWorker([])
    let finish: (() => void) | undefined
    self.registration.unregister.mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    const activation = dispatch('activate')
    await vi.waitFor(() => expect(self.registration.unregister).toHaveBeenCalled())
    const channel = new TestChannel()
    const received = vi.fn()
    channel.port1.onmessage = received
    const message = dispatch('message', {
      data: { type: 'transfusion-cache-retirement-check' }, ports: [channel.port2],
    })
    expect(received).not.toHaveBeenCalled()
    finish?.()
    await Promise.all([activation, message])
    expect(received).toHaveBeenCalledWith({ data: { type: 'transfusion-cache-retirement-complete' } })
  })
})
