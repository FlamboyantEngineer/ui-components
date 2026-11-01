import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BarChartSeries } from './bar-chart.js';
import { BarChart } from './bar-chart.js';
import { DonutChart, type DonutChartSegment } from './donut-chart.js';
import { LineChart, type LineChartSeries } from './line-chart.js';

const categories = ['First', 'Second', 'Third'];
const alpha: BarChartSeries = { id: 'a', label: 'Alpha', values: [1, 2, 3] };
const blue: BarChartSeries = { id: 'b', label: 'Blue', values: [3, 4, 5] };

const focused = () => document.activeElement;

describe('chart value identities', () => {
  it('UIC-CHART-4.3 keeps a focused bar on its series when the series reorder', () => {
    const { rerender } = render(
      <BarChart aria-label="Values" categories={categories} series={[alpha, blue]} />,
    );
    const second = screen.getByRole('img', { name: 'Alpha, Second: 2' });
    second.focus();
    rerender(<BarChart aria-label="Values" categories={categories} series={[blue, alpha]} />);
    expect(focused()).toBe(second);
    expect(second).toHaveAccessibleName('Alpha, Second: 2');
    expect(second).toHaveAttribute('data-active', 'true');
    expect(second).toHaveAttribute('data-series', '1');
    expect(second).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('img', { name: 'Blue, Second: 4' })).toHaveAttribute('tabindex', '-1');
  });

  it('UIC-CHART-4.3 keeps numeric and text series ids with one spelling apart', () => {
    const numeric: BarChartSeries = { id: 1, label: 'Numeric', values: [1, 2, 3] };
    const text: BarChartSeries = { id: '1', label: 'Text', values: [4, 5, 6] };
    const { rerender } = render(
      <BarChart aria-label="Values" categories={categories} series={[numeric, text]} />,
    );
    const value = screen.getByRole('img', { name: 'Text, Third: 6' });
    value.focus();
    rerender(<BarChart aria-label="Values" categories={categories} series={[text, numeric]} />);
    expect(focused()).toBe(value);
    expect(value).toHaveAccessibleName('Text, Third: 6');
  });

  it('UIC-CHART-4.3 keeps a focused line point through insertions before it', () => {
    const series = (points: LineChartSeries['points']): LineChartSeries[] => [
      { id: 'level', label: 'Level', points },
    ];
    const { rerender } = render(
      <LineChart
        aria-label="Levels"
        series={series([
          { x: 2, y: 5 },
          { x: 4, y: 6 },
        ])}
      />,
    );
    const point = screen.getByRole('img', { name: 'Level, 4: 6' });
    point.focus();
    rerender(
      <LineChart
        aria-label="Levels"
        series={series([
          { x: 1, y: 3 },
          { x: 2, y: 5 },
          { x: 3, y: 4 },
          { x: 4, y: 6 },
        ])}
      />,
    );
    expect(focused()).toBe(point);
    expect(point).toHaveAccessibleName('Level, 4: 6');
    expect(point).toHaveAttribute('data-active', 'true');
    rerender(
      <LineChart
        aria-label="Levels"
        series={series([
          { x: 3, y: 4 },
          { x: 4, y: 6 },
        ])}
      />,
    );
    expect(focused()).toBe(point);
  });

  it('UIC-CHART-4.3 tells repeated line coordinates apart by their order', () => {
    render(
      <LineChart
        aria-label="Levels"
        series={[
          {
            id: 'level',
            label: 'Level',
            points: [
              { x: 1, y: 3 },
              { x: 1, y: 4 },
            ],
          },
        ]}
      />,
    );
    expect(screen.getAllByRole('img').map((point) => point.getAttribute('aria-label'))).toEqual([
      'Level, 1: 3',
      'Level, 1: 4',
    ]);
  });

  it('UIC-CHART-4.3 keeps a focused slice when the segments reorder', () => {
    const sold: DonutChartSegment[] = [
      { id: 'figs', label: 'Figs', value: 2 },
      { id: 'kiwis', label: 'Kiwis', value: 3 },
    ];
    const { rerender } = render(<DonutChart aria-label="Sold" segments={sold} />);
    const kiwis = screen.getByRole('img', { name: /^Kiwis/ });
    kiwis.focus();
    rerender(<DonutChart aria-label="Sold" segments={[...sold].reverse()} />);
    expect(focused()).toBe(kiwis);
    expect(kiwis).toHaveAccessibleName(/^Kiwis/);
    expect(kiwis).toHaveAttribute('data-active', 'true');
  });
});
