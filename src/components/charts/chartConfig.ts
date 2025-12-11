import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { verticalLinePlugin } from './plugins/verticalLinePlugin'

/**
 * Register all Chart.js components and plugins
 *
 * This module should be imported once at the application entry point
 * to ensure all necessary Chart.js components are registered globally.
 *
 * Registered components:
 * - CategoryScale: For categorical x-axes
 * - LinearScale: For linear numeric axes
 * - PointElement: For scatter and line chart points
 * - LineElement: For line charts
 * - LineController: Controller for line charts
 * - BarElement: For bar charts
 * - BarController: Controller for bar charts
 * - ArcElement: For pie/doughnut charts
 * - DoughnutController: Controller for doughnut charts
 * - Title: For chart titles
 * - Tooltip: For interactive tooltips
 * - Legend: For chart legends
 * - Filler: For area fills (confidence intervals)
 *
 * Custom plugins:
 * - verticalLinePlugin: Draws vertical line at transfusion time (x=0)
 */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
  verticalLinePlugin
)

export { ChartJS }
