import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { BarChart } from './bar-chart.js';
import type { ChartDatum } from './chart-format.js';
import { LineChart, type LineChartSeries, type LineChartX } from './line-chart.js';

const series: LineChartSeries[] = [
  {
    id: 'a',
    label: 'First',
    points: [
      { x: 0, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  { id: 'b', label: 'Second', points: [{ x: 2, y: 3 }] },
];

describe('chart derivations', () => {
  it('UIC-CHART-1.5 builds the table only while it shows, from every series', async () => {
    const user = userEvent.setup();
    const formatValue = vi.fn((datum: ChartDatum<LineChartX>) => String(datum.value));
    render(
      <LineChart
        aria-label="Counts"
        series={series}
        formatValue={formatValue}
        defaultHiddenKeys={['b']}
      />,
    );
    // The drawing names its two shown values; no table cell was written.
    expect(formatValue).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    const rows = within(screen.getByRole('table'))
      .getAllByRole('row')
      .map((row) => row.textContent);
    expect(rows).toEqual(['CategoryFirstSecond', '01', '12', '23']);
    expect(formatValue.mock.calls.map(([datum]) => datum.seriesId)).toContain('b');
  });

  it('UIC-CHART-1.5 reuses the drawing when only the frame around it changes', () => {
    const formatValue = vi.fn((datum: ChartDatum) => String(datum.value));
    const props = {
      'aria-label': 'Crates',
      categories: ['Jan', 'Feb'],
      series: [{ id: 'apples', label: 'Apples', values: [12, 18] }],
      formatValue,
    };
    const { rerender } = render(<BarChart {...props} />);
    const calls = formatValue.mock.calls.length;
    const bar = screen.getByRole('img', { name: 'Apples, Jan: 12' });
    rerender(<BarChart {...props} showSummary />);
    expect(formatValue).toHaveBeenCalledTimes(calls);
    expect(screen.getByRole('img', { name: 'Apples, Jan: 12' })).toBe(bar);
    rerender(
      <BarChart {...props} series={[{ id: 'apples', label: 'Apples', values: [12, 20] }]} />,
    );
    expect(screen.getByRole('img', { name: 'Apples, Feb: 20' })).toBeInTheDocument();
  });

  it('UIC-CHART-1.5 follows a change of format options or locale', () => {
    const { rerender } = render(
      <LineChart
        aria-label="Counts"
        series={[{ id: 'a', label: 'A', points: [{ x: 0, y: 1234.5 }] }]}
      />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName('A, 0: 1,234.5');
    rerender(
      <LineChart
        aria-label="Counts"
        formatOptions={{ minimumFractionDigits: 2 }}
        series={[{ id: 'a', label: 'A', points: [{ x: 0, y: 1234.5 }] }]}
      />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName('A, 0: 1,234.50');
    rerender(
      <UiProvider locale="de-DE">
        <LineChart
          aria-label="Counts"
          formatOptions={{ minimumFractionDigits: 2 }}
          series={[{ id: 'a', label: 'A', points: [{ x: 0, y: 1234.5 }] }]}
        />
      </UiProvider>,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName('A, 0: 1.234,50');
  });
});
