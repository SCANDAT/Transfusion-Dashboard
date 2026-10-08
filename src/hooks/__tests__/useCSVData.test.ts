import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useAsyncData } from '../useCSVData'

afterEach(cleanup)

describe('asynchronous data selection', () => {
  it('does not fetch a disabled optional resource and starts when enabled', async () => {
    const fetcher = vi.fn().mockResolvedValue([1])
    const { result, rerender } = renderHook(({ enabled }) => useAsyncData(fetcher, [], { enabled }), {
      initialProps: { enabled: false },
    })
    expect(fetcher).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
    rerender({ enabled: true })
    await waitFor(() => expect(result.current.data).toEqual([1]))
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('clears an old result while a new selection loads and ignores late responses', async () => {
    const finish = new Map<string, (value: string) => void>()
    const { result, rerender } = renderHook(({ key }) => useAsyncData(
      () => new Promise<string>(resolve => finish.set(key, resolve)), [key]
    ), { initialProps: { key: 'old' } })
    await act(async () => finish.get('old')!('old result'))
    expect(result.current.data).toBe('old result')
    rerender({ key: 'slow' })
    expect(result.current.data).toBeNull()
    rerender({ key: 'latest' })
    await act(async () => finish.get('latest')!('latest result'))
    await act(async () => finish.get('slow')!('stale result'))
    expect(result.current.data).toBe('latest result')
  })

  it('ignores a response that arrives after an optional resource is disabled', async () => {
    let finish: (value: number) => void = () => undefined
    const fetcher = () => new Promise<number>(resolve => { finish = resolve })
    const { result, rerender } = renderHook(({ enabled }) => useAsyncData(fetcher, [], { enabled }), {
      initialProps: { enabled: true },
    })
    rerender({ enabled: false })
    await act(async () => finish(5))
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
