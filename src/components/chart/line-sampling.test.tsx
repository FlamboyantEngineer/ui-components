import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LineChart, type LineChartSeries } from './line-chart.js';
import { sampleRun } from './line-sampling.js';

describe('sampleRun', () => {
  it('UIC-CHART-6.6 keeps each column’s first, lowest, highest and last point, in order', () => {
    const run = [
      { x: 0.1, y: 5 },
      { x: 0.4, y: 9 },
      { x: 0.5, y: 1 },
      { x: 0.6, y: 4 },
      { x: 0.9, y: 6 },
      { x: 1.2, y: 3 },
      { x: 1.2, y: 8 },
    ];
    const copy = run.map((point) => ({ ...point }));
    const kept = sampleRun(run);
    expect(kept).toEqual([run[0], run[1], run[2], run[4], run[5], run[6]]);
    expect(kept[0]).toBe(run[0]);
    expect(run).toEqual(copy);
    expect(sampleRun(run)).toEqual(kept);
    expect(sampleRun([])).toEqual([]);
  });
});

describe('LineChart downsample', () => {
  const dense: LineChartSeries[] = [
    {
      id: 'dense',
      label: 'Dense',
      points: Array.from({ length: 3000 }, (_, x) => ({
        x,
        y: x === 1500 ? null : x === 700 ? 999 : x % 10,
      })),
    },
  ];

  it('UIC-CHART-6.6 draws a bounded set of real points, keeping extremes, ends and breaks', async () => {
    const user = userEvent.setup();
    render(<LineChart aria-label="Dense" series={dense} downsample showLegend={false} />);
    const points = screen.getAllByRole('img');
    expect(points.length).toBeLessThan(3000);
    expect(points[0]).toHaveAccessibleName('Dense, 0: 0');
    expect(points.at(-1)).toHaveAccessibleName('Dense, 2,999: 9');
    expect(screen.getByRole('img', { name: 'Dense, 700: 999' })).toBeInTheDocument();
    expect(
      document.querySelector('.ui-line-chart__line')?.getAttribute('d')?.match(/M/g),
    ).toHaveLength(2);
    expect(screen.getByRole('figure')).toHaveAccessibleDescription(
      '1 series, 2,999 values, from 0 to 999',
    );
    await user.tab();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(points[1]).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3001);
  });

  it('UIC-CHART-6.6 leaves every point drawn by default', () => {
    render(<LineChart aria-label="Dense" series={dense} showLegend={false} />);
    expect(screen.getAllByRole('img')).toHaveLength(2999);
  });
});
