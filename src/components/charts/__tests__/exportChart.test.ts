import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Chart } from 'chart.js'
import { saveAs } from 'file-saver'
import { exportChartAsPNG } from '../exportChart'

vi.mock('file-saver', () => ({ saveAs: vi.fn() }))

function makeChart() {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 800
  const options = { plugins: { title: { color: '#ffffff' } } }
  return {
    canvas,
    config: { options },
    options,
    update: vi.fn(),
  } as unknown as Chart
}

describe('chart raster downloads', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '',
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,iVBORw0KGgo='
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('downloads PNG bytes and extension, never a raster disguised as SVG', () => {
    const chart = makeChart()
    const originalOptions = chart.options
    exportChartAsPNG(chart, 'trajectory.svg')
    vi.runAllTimers()

    expect(saveAs).toHaveBeenCalledTimes(1)
    const [blob, filename] = vi.mocked(saveAs).mock.calls[0]!
    expect(blob).toBeInstanceOf(Blob)
    expect((blob as Blob).type).toBe('image/png')
    expect((blob as Blob).size).toBe(8)
    expect(filename).toBe('trajectory.png')
    expect(chart.options).toBe(originalOptions)
  })

  it('keeps the original theme across repeated exports', () => {
    const chart = makeChart()
    const originalOptions = chart.config.options
    exportChartAsPNG(chart, 'first')
    exportChartAsPNG(chart, 'second')
    expect(saveAs).toHaveBeenCalledTimes(2)
    expect(chart.options).toBe(originalOptions)
  })

  it('restores the display options even if image encoding fails', () => {
    const chart = makeChart()
    const originalOptions = chart.options
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockImplementation(() => {
      throw new Error('Synthetic encoding failure')
    })
    exportChartAsPNG(chart, 'trajectory')
    vi.runAllTimers()
    expect(saveAs).not.toHaveBeenCalled()
    expect(chart.options).toBe(originalOptions)
  })
})
