import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ModelVitalSummaryRow, VitalSummaryRow } from '@/types'
import { SummaryTableA } from '../SummaryTableA'

const observed: VitalSummaryRow = {
  Abbreviation: 'ARTm', Pre_Mean: 70, Pre_SD: 10, Post_Mean: 74, Post_SD: 11,
  Diff_Mean: 3.25, Diff_LCL: -98765, Diff_UCL: 98765,
}
const model: ModelVitalSummaryRow = {
  Abbreviation: 'ARTm', Base_Pre: 71, Base_Post: 73, Base_Diff: 1.75,
  Base_Diff_SE: 45678, Base_Diff_LCL: -87654, Base_Diff_UCL: 87654,
  Full_Pre: 72, Full_Post: 73, Full_Diff: 0,
  Full_Diff_SE: 56789, Full_Diff_LCL: -76543, Full_Diff_UCL: 76543,
}

afterEach(cleanup)

describe('main point-estimate table', () => {
  it('uses exported differences including zero without reconstructing inference', () => {
    render(<SummaryTableA observedData={[observed]} modelData={[model]} />)
    const table = screen.getByRole('table')
    expect(within(table).getByText('3.25')).toBeDefined()
    expect(within(table).getByText('1.75')).toBeDefined()
    expect(within(table).getByText('0.00')).toBeDefined()
    expect(table.textContent).not.toMatch(/98765|87654|76543|45678|56789/)
    expect(within(table).queryByText(/95% CI|Diff \(SE\)/)).toBeNull()
    expect(screen.getByText(/Change confidence intervals and standard errors are omitted/)).toBeDefined()
  })

  it('retains an available model row when its observed summary is absent', () => {
    render(<SummaryTableA observedData={[]} modelData={[model]} />)
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    const cells = within(rows[2]!).getAllByRole('cell')
    expect(cells.map(cell => cell.textContent)).toEqual(['—', '—', '—', '—', '—', '1.75', '0.00'])
  })

  it('does not display non-finite or missing values as zero or valid numbers', () => {
    render(<SummaryTableA observedData={[{ ...observed, Diff_Mean: Number.NaN }]} modelData={[{ ...model, Full_Diff: Number.POSITIVE_INFINITY }]} />)
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    const cells = within(rows[2]!).getAllByRole('cell')
    expect(cells[4]!.textContent).toBe('—')
    expect(cells[6]!.textContent).toBe('—')
    expect(screen.getByRole('table').textContent).not.toMatch(/Infinity|NaN/)
  })
})
