import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ScatterChart, type ScatterChartSeries } from './scatter-chart.js';

const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

const samples: ScatterChartSeries[] = [
  {
    id: 'north',
    label: 'North',
    points: [
      { id: 'n2', x: 4, y: 12, label: 'Plot B' },
      { id: 'n1', x: 1, y: 10, label: 'Plot A' },
      { id: 'n3', x: null, y: 30 },
    ],
  },
  {
    id: 'south',
    label: 'South',
    tone: 'success',
    points: [
      { id: 's1', x: 1, y: 10 },
      { id: 's2', x: 5, y: 20 },
    ],
  },
];

const names = () => screen.getAllByRole('img').map((point) => point.getAttribute('aria-label'));

describe('ScatterChart', () => {
  it('UIC-CHART-10.1 UIC-CHART-10.2 draws named observations on two axes', () => {
    render(<ScatterChart label="Yield" series={samples} xLabel="Rain" yLabel="Crop" />);
    const figure = screen.getByRole('figure', { name: 'Yield' });
    expect(figure).toHaveClass('ui-chart', 'ui-scatter-chart');
    expect(names()).toEqual([
      'North, Plot A: Rain 1, Crop 10',
      'North, Plot B: Rain 4, Crop 12',
      'South: Rain 1, Crop 10',
      'South: Rain 5, Crop 20',
    ]);
    const points = [...document.querySelectorAll('.ui-scatter-chart__point')];
    expect(points[2]).toHaveAttribute('data-tone', 'success');
    expect(points[0]?.getAttribute('cx')).toBe(points[2]?.getAttribute('cx'));
    expect(document.querySelectorAll('.ui-chart-axis')).toHaveLength(2);
    expectHooksMatchSpec(document.body, 'CHART', { slots: ['plot', 'ui-scatter-chart__point'] });
  });

  it('UIC-CHART-10.2 moves by keyboard and shows the coordinates in the tooltip', async () => {
    const user = userEvent.setup();
    render(<ScatterChart aria-label="Yield" series={samples} showLegend={false} />);
    await user.tab();
    await user.tab();
    expect(document.activeElement).toHaveAccessibleName('North, Plot A: x 1, y 10');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toHaveAccessibleName('North, Plot B: x 4, y 12');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('South: x 5, y 20');
    expect(tooltip()).toHaveTextContent('South');
    expect(tooltip()).toHaveTextContent('x 5, y 20');
  });

  it('UIC-CHART-10.2 hides series from the legend and lists every observation in the table', async () => {
    const user = userEvent.setup();
    render(<ScatterChart aria-label="Yield" series={samples} />);
    await user.click(screen.getByRole('button', { name: 'South' }));
    expect(names()).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    expect(
      within(screen.getByRole('table'))
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual([
      'PointSeriesxy',
      'Plot BNorth412',
      'Plot ANorth110',
      'n3North30',
      's1South110',
      's2South520',
    ]);
  });

  it('UIC-CHART-10.1 shows no data when nothing draws', () => {
    render(
      <ScatterChart
        aria-label="Yield"
        series={[{ id: 'a', label: 'A', points: [{ id: 1, x: Number.NaN, y: 2 }] }]}
      />,
    );
    expect(screen.getByRole('figure')).toHaveAttribute('data-empty');
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});
