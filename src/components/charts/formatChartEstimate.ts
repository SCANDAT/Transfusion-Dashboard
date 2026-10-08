export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Format exported results without inventing missing estimates or limits. */
export function formatChartEstimate(
  label: string,
  value: number | null | undefined,
  lower: number | null | undefined,
  upper: number | null | undefined
): string {
  if (!isFiniteNumber(value)) return `${label}: unavailable`
  const estimate = `${label}: ${value.toFixed(2)}`
  return isFiniteNumber(lower) && isFiniteNumber(upper)
    ? `${estimate} [${lower.toFixed(2)}, ${upper.toFixed(2)}]`
    : `${estimate} (CI unavailable)`
}
