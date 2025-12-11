import { saveAs } from 'file-saver'
import type { Chart } from 'chart.js'

/**
 * Export a Chart.js chart as SVG
 *
 * This function converts a Chart.js chart instance to SVG format and downloads it.
 * It temporarily switches to light theme for better print quality, then restores
 * the original theme after export.
 *
 * The export process:
 * 1. Saves current chart state
 * 2. Applies light theme colors for better print quality
 * 3. Re-renders the chart
 * 4. Converts canvas to PNG data URL
 * 5. Wraps in SVG for vector-like export
 * 6. Downloads the file
 * 7. Restores original theme
 *
 * @param chart - The Chart.js chart instance to export
 * @param filename - The desired filename (without extension)
 *
 * @example
 * ```ts
 * const chart = chartRef.current
 * if (chart) {
 *   exportChartAsSVG(chart, 'MAP_vs_DonorHb')
 * }
 * ```
 */
export function exportChartAsSVG(chart: Chart, filename: string): void {
  if (!chart || !chart.canvas) {
    console.error('Invalid chart instance provided to exportChartAsSVG')
    return
  }

  const canvas = chart.canvas
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    console.error('Could not get canvas context')
    return
  }

  // Store original theme settings
  const originalOptions = chart.options

  try {
    // Apply light theme for better print quality
    const lightThemeOptions = {
      ...originalOptions,
      plugins: {
        ...originalOptions.plugins,
        legend: {
          ...originalOptions.plugins?.legend,
          labels: {
            ...originalOptions.plugins?.legend?.labels,
            color: '#1f2937', // Dark gray for text
          },
        },
        title: {
          ...originalOptions.plugins?.title,
          color: '#1f2937',
        },
        tooltip: {
          ...originalOptions.plugins?.tooltip,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#111827',
          bodyColor: '#374151',
          borderColor: '#d1d5db',
        },
      },
      scales: originalOptions.scales ? {
        ...originalOptions.scales,
        x: originalOptions.scales?.x ? {
          ...originalOptions.scales.x,
          ticks: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(originalOptions.scales.x as any)?.ticks,
            color: '#6b7280',
          },
          grid: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(originalOptions.scales.x as any)?.grid,
            color: 'rgba(209, 213, 219, 0.5)',
          },
          border: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(originalOptions.scales.x as any)?.border,
            color: '#d1d5db',
          },
        } : undefined,
        y: originalOptions.scales?.y ? {
          ...originalOptions.scales.y,
          ticks: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(originalOptions.scales.y as any)?.ticks,
            color: '#6b7280',
          },
          grid: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(originalOptions.scales.y as any)?.grid,
            color: 'rgba(209, 213, 219, 0.5)',
          },
          border: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(originalOptions.scales.y as any)?.border,
            color: '#d1d5db',
          },
        } : undefined,
      } : undefined,
    }

    // Update chart with light theme
    chart.options = lightThemeOptions
    chart.update('none') // Update without animation

    // Give the chart a moment to render
    setTimeout(() => {
      try {
        // Convert canvas to PNG data URL
        const dataUrl = canvas.toDataURL('image/png', 1.0)

        // Create SVG wrapper with embedded PNG
        const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvas.width}"
     height="${canvas.height}"
     viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image xlink:href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`

        // Create blob and download
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
        const svgFilename = filename.endsWith('.svg') ? filename : `${filename}.svg`

        saveAs(blob, svgFilename)

        // Restore original theme
        chart.options = originalOptions
        chart.update('none')
      } catch (innerError) {
        console.error('Error during SVG export:', innerError)

        // Ensure we restore original options even on error
        chart.options = originalOptions
        chart.update('none')
      }
    }, 100)
  } catch (error) {
    console.error('Error exporting chart as SVG:', error)

    // Restore original options if error occurred
    chart.options = originalOptions
    chart.update('none')
  }
}

export default exportChartAsSVG
