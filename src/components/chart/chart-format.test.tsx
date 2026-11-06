import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BarChart } from './bar-chart.js';
import type { ChartDatum, ChartTooltipContext } from './chart-format.js';
import { LineChart, type LineChartSeries, type LineChartX } from './line-chart.js';

const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

const readings: LineChartSeries[] = [
  {
    id: 'heat',
    label: 'Heat',
    points: [
      { x: 0, y: 21.5 },
      { x: 1, y: null },
      { x: 2, y: 2400 },
    ],
  },
  {
    id: 'damp',
    label: 'Damp',
    points: [
      { x: 0, y: 0.42 },
      { x: 2, y: 0.58 },
    ],
  },
];

const units = (datum: ChartDatum<LineChartX>) =>
  datum.seriesId === 'heat' ? `${datum.value.toFixed(1)} kJ` : `${Math.round(datum.value * 100)}%`;

describe('chart formatters and tooltips', () => {
  it('UIC-CHART-4.7 writes values per series and axis labels compactly', async () => {
    const user = userEvent.setup();
    const formatValue = vi.fn(units);
    render(
      <LineChart
        aria-label="Readings"
        series={readings}
        formatValue={formatValue}
        formatAxisValue={(value) => `${value / 1000}k`}
        showLegend={false}
      />,
    );
    expect(screen.getAllByRole('img').map((point) => point.getAttribute('aria-label'))).toEqual([
      'Heat, 0: 21.5 kJ',
      'Heat, 2: 2400.0 kJ',
      'Damp, 0: 42%',
      'Damp, 2: 58%',
    ]);
    const labels = [...document.querySelectorAll('.ui-chart-axis[data-position="left"] text')];
    expect(labels.at(-1)?.textContent).toMatch(/k$/);
    for (const [datum] of formatValue.mock.calls) {
      expect(Number.isFinite(datum.value)).toBe(true);
    }
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    expect(
      within(screen.getByRole('table'))
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['CategoryHeatDamp', '021.5 kJ42%', '1', '22400.0 kJ58%']);
  });

  it('UIC-CHART-4.7 renders custom tooltip content from the same datum by pointer and keyboard', async () => {
    const user = userEvent.setup();
    const renderTooltip = vi.fn(({ datum, value, at }: ChartTooltipContext) => (
      <span data-custom>
        {datum.seriesLabel} sold {value} in {at}
      </span>
    ));
    render(
      <BarChart
        aria-label="Crates"
        categories={['Jan', 'Feb']}
        series={[{ id: 'apples', label: 'Apples', values: [12, 18] }]}
        formatValue={(datum) => `${datum.value} crates`}
        renderTooltip={renderTooltip}
      />,
    );
    const bar = screen.getByRole('img', { name: 'Apples, Feb: 18 crates' });
    await user.hover(bar);
    expect(tooltip()).toHaveTextContent('Apples sold 18 crates in Feb');
    const byPointer = renderTooltip.mock.lastCall?.[0];
    await user.unhover(bar);
    await user.tab();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(bar).toHaveFocus();
    expect(tooltip()).toHaveTextContent('Apples sold 18 crates in Feb');
    expect(tooltip()?.querySelector('.ui-chart__tooltip-value')).toBeNull();
    expect(renderTooltip.mock.lastCall?.[0]).toEqual(byPointer);
    expect(byPointer?.datum).toEqual({
      seriesId: 'apples',
      seriesLabel: 'Apples',
      series: 0,
      at: 'Feb',
      value: 18,
    });
  });

  it('UIC-CHART-4.7 falls back to the default tooltip when the content is empty', async () => {
    const user = userEvent.setup();
    render(
      <BarChart
        aria-label="Crates"
        categories={['Jan']}
        series={[{ id: 'apples', label: 'Apples', values: [12] }]}
        renderTooltip={() => null}
      />,
    );
    await user.hover(screen.getByRole('img', { name: 'Apples, Jan: 12' }));
    expect(tooltip()?.querySelector('.ui-chart__tooltip-value')).toHaveTextContent('12');
  });
});
