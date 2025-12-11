import type { Plugin } from 'chart.js'

/**
 * SCANDAT Red color for the vertical line
 */
const SCANDAT_RED = '#E82127'

/**
 * Chart.js plugin that draws a vertical red line at x=0 (transfusion time)
 *
 * This plugin adds a visual indicator at the time of transfusion (time 0)
 * to help users distinguish pre-transfusion and post-transfusion periods.
 *
 * Usage:
 * - Enable by setting `showVerticalLine: true` in chart options
 * - Customize position with `verticalLinePosition: number` (defaults to 0)
 */
export const verticalLinePlugin: Plugin = {
  id: 'verticalLine',

  afterDraw: (chart, _args, _options) => {
    try {
      // Check if plugin is enabled for this chart
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const showLine = (chart.options as any)?.showVerticalLine
      if (!showLine) {
        return
      }

      const ctx = chart.ctx
      const chartArea = chart.chartArea
      const xScale = chart.scales.x
      const yScale = chart.scales.y

      if (!xScale || !yScale || !chartArea) {
        return
      }

      // Get the x position (defaults to 0 for transfusion time)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const position = (chart.options as any)?.verticalLinePosition ?? 0

      // Convert data value to pixel position
      const xPixel = xScale.getPixelForValue(position)

      // Only draw if the line is within the chart area
      if (xPixel < chartArea.left || xPixel > chartArea.right) {
        return
      }

      // Save the current context state
      ctx.save()

      // Draw the vertical line
      ctx.beginPath()
      ctx.strokeStyle = SCANDAT_RED
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5]) // Dashed line pattern
      ctx.moveTo(xPixel, chartArea.top)
      ctx.lineTo(xPixel, chartArea.bottom)
      ctx.stroke()

      // Restore the context state
      ctx.restore()
    } catch (e) {
      console.warn('VerticalLinePlugin error:', e)
    }
  },
}

export default verticalLinePlugin
