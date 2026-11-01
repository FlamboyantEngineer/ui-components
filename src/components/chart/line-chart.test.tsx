import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { LineChart, type LineChartSeries } from './line-chart.js';

const defects: LineChartSeries[] = [
  {
    id: 'open',
    label: 'Open',
    points: [
      { x: '2026-03-02', y: 8 },
      { x: '2026-03-09', y: 5 },
      { x: '2026-03-16', y: Number.NaN },
      { x: '2026-03-23', y: 3 },
    ],
  },
  {
    id: 'closed',
    label: 'Closed',
    tone: 'success',
    points: [
      { x: '2026-03-23', y: 9 },
      { x: '2026-03-02', y: 1 },
      { x: '2026-03-09', y: 4 },
    ],
  },
];

const lines = () => [...document.querySelectorAll('.ui-line-chart__line')];

describe('LineChart', () => {
  it('UIC-CHART-6.1 UIC-CHART-6.2 UIC-CHART-4.1 UIC-CHART-4.2 UIC-CHART-8.2 draws named points on a time axis', () => {
    render(<LineChart label="Defects" series={defects} timeZone="UTC" />);
    const figure = screen.getByRole('figure', { name: 'Defects' });
    expect(figure).toHaveClass('ui-chart', 'ui-line-chart');
    expect(figure).toHaveAttribute('data-variant', 'line');
    expect(lines().map((line) => line.getAttribute('data-series'))).toEqual(['0', '1']);
    expect(lines()[0]?.getAttribute('d')?.match(/M/g)).toHaveLength(2);
    expect(lines()[1]).toHaveAttribute('data-tone', 'success');
    expect(lines()[0]).toHaveAttribute('fill', 'none');
    expect(lines()[0]).not.toHaveAttribute('role');
    expect(document.querySelector('.ui-line-chart__area')).toBeNull();
    expect(screen.getAllByRole('img').map((point) => point.getAttribute('aria-label'))).toEqual([
      'Open, Mar 2, 2026: 8',
      'Open, Mar 9, 2026: 5',
      'Open, Mar 23, 2026: 3',
      'Closed, Mar 2, 2026: 1',
      'Closed, Mar 9, 2026: 4',
      'Closed, Mar 23, 2026: 9',
    ]);
    for (const axis of document.querySelectorAll('.ui-chart-axis')) {
      expect(axis).toHaveAttribute('aria-hidden', 'true');
    }
    expectHooksMatchSpec(document.body, 'CHART', {
      slots: ['plot', 'ui-line-chart__line', 'ui-line-chart__point', 'ui-chart-axis__label'],
    });
  });

  it('UIC-CHART-6.2 fills areas under the lines', () => {
    render(<LineChart aria-label="Defects" series={defects} timeZone="UTC" variant="area" />);
    expect(screen.getByRole('figure')).toHaveAttribute('data-variant', 'area');
    const areas = [...document.querySelectorAll('.ui-line-chart__area')];
    expect(areas.map((area) => area.getAttribute('data-series'))).toEqual(['0', '1']);
    expect(areas[0]?.getAttribute('d')).toMatch(/Z$/);
    expect(
      requireDefined(areas[1]).compareDocumentPosition(requireDefined(lines()[0])) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expectHooksMatchSpec(document.body, 'CHART', { slots: ['ui-line-chart__area'] });
  });

  it('UIC-CHART-6.1 draws numbers on a linear axis', () => {
    render(
      <LineChart
        aria-label="Build time"
        series={[
          {
            id: 'build',
            label: 'Minutes',
            points: [
              { x: 1200, y: 4 },
              { x: 1201, y: 6.5 },
            ],
          },
        ]}
        formatOptions={{ maximumFractionDigits: 1 }}
      />,
    );
    expect(screen.getAllByRole('img').map((point) => point.getAttribute('aria-label'))).toEqual([
      'Minutes, 1,200: 4',
      'Minutes, 1,201: 6.5',
    ]);
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('UIC-CHART-4.3 moves focus along a series and to the nearest point of the next', async () => {
    const user = userEvent.setup();
    render(<LineChart aria-label="Defects" series={defects} timeZone="UTC" showLegend={false} />);
    await user.tab();
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(document.activeElement).toHaveAccessibleName('Open, Mar 23, 2026: 3');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Closed, Mar 23, 2026: 9');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Closed, Mar 23, 2026: 9');
    expect(document.activeElement).toHaveAttribute('data-active', 'true');
  });

  it('UIC-CHART-4.3 moves between unequally sampled series by x, not by point order', async () => {
    const user = userEvent.setup();
    const sparse = [
      {
        id: 'alpha',
        label: 'Alpha',
        points: [
          { x: 0, y: 1 },
          { x: 100, y: 3 },
        ],
      },
      {
        id: 'blue',
        label: 'Blue',
        points: [
          { x: 0, y: 2 },
          { x: 1, y: 4 },
          { x: Number.NaN, y: 6 },
          { x: 100, y: 5 },
        ],
      },
      {
        id: 'gamma',
        label: 'Gamma',
        points: [
          { x: 40, y: 7 },
          { x: 70, y: 8 },
        ],
      },
    ];
    render(<LineChart aria-label="Samples" series={sparse} showLegend={false} />);
    screen.getByRole('img', { name: 'Alpha, 100: 3' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Blue, 100: 5');
    await user.keyboard('{ArrowLeft}{ArrowDown}');
    // From x=1 the nearest Gamma point is x=40; from x=100 it is x=70.
    expect(document.activeElement).toHaveAccessibleName('Gamma, 40: 7');
    await user.keyboard('{End}{ArrowUp}');
    expect(document.activeElement).toHaveAccessibleName('Blue, 100: 5');
    await user.keyboard('{ArrowUp}{Home}');
    expect(document.activeElement).toHaveAccessibleName('Alpha, 0: 1');
  });

  it('UIC-CHART-4.3 compares dates between series with different ranges', async () => {
    const user = userEvent.setup();
    const day = (date: number) => `2026-03-${String(date).padStart(2, '0')}`;
    const ranges = [
      {
        id: 'weekly',
        label: 'Weekly',
        points: [
          { x: day(2), y: 1 },
          { x: day(30), y: 2 },
        ],
      },
      {
        id: 'daily',
        label: 'Daily',
        points: [27, 28, 29, 30, 31].map((date) => ({ x: day(date), y: date })),
      },
    ];
    render(<LineChart aria-label="Ranges" series={ranges} timeZone="UTC" showLegend={false} />);
    screen.getByRole('img', { name: 'Weekly, Mar 30, 2026: 2' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Daily, Mar 30, 2026: 30');
    await user.keyboard('{Home}{ArrowUp}');
    expect(document.activeElement).toHaveAccessibleName('Weekly, Mar 30, 2026: 2');
  });

  it('UIC-CHART-6.4 keeps numeric table rows with every series hidden', async () => {
    const user = userEvent.setup();
    const sampled = [
      {
        id: 'a',
        label: 'Alpha',
        points: [
          { x: 0, y: 1 },
          { x: 100, y: 3 },
        ],
      },
      {
        id: 'b',
        label: 'Blue',
        points: [
          { x: 0, y: 2 },
          { x: 1, y: 4 },
          { x: 100, y: 5 },
        ],
      },
    ];
    const rows = () =>
      within(screen.getByRole('table'))
        .getAllByRole('row')
        .map((row) => row.textContent);
    const expected = ['CategoryAlphaBlue', '012', '14', '10035'];
    const { rerender } = render(
      <LineChart
        aria-label="Samples"
        series={sampled}
        defaultHiddenKeys={['a', 'b']}
        defaultView="table"
      />,
    );
    expect(rows()).toEqual(expected);
    rerender(
      <LineChart
        aria-label="Samples"
        series={sampled}
        hiddenKeys={new Set(['a'])}
        defaultView="table"
      />,
    );
    expect(rows()).toEqual(expected);
    // Hiding the last drawn series while the chart shows, then switching views, keeps the rows.
    rerender(
      <LineChart
        aria-label="Samples"
        series={sampled}
        hiddenKeys={new Set(['a', 'b'])}
        defaultView="table"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    expect(rows()).toEqual(expected);
  });

  it('UIC-CHART-6.4 keeps date table rows with every series hidden', () => {
    const { rerender } = render(
      <LineChart aria-label="Defects" series={defects} timeZone="UTC" defaultView="table" />,
    );
    const rows = () =>
      within(screen.getByRole('table'))
        .getAllByRole('row')
        .map((row) => row.textContent);
    const shown = rows();
    rerender(
      <LineChart
        aria-label="Defects"
        series={defects}
        timeZone="UTC"
        defaultView="table"
        hiddenKeys={new Set(defects.map((entry) => entry.id))}
      />,
    );
    expect(rows()).toEqual(shown);
    expect(shown.length).toBeGreaterThan(1);
  });

  it('UIC-CHART-4.5 summarises the drawn values and marks a chart without any', () => {
    const { rerender } = render(<LineChart aria-label="Defects" series={defects} timeZone="UTC" />);
    expect(screen.getByRole('figure')).toHaveAccessibleDescription(
      '2 series, 6 values, from 1 to 9',
    );
    rerender(<LineChart aria-label="Defects" series={[]} />);
    expect(screen.getByRole('figure')).toHaveAttribute('data-empty', 'true');
    expect(document.querySelector('.ui-chart__empty')).toHaveTextContent('No data');
  });

  it('UIC-CHART-6.4 lists each date of any series in its table', async () => {
    const user = userEvent.setup();
    render(<LineChart aria-label="Defects" series={defects} timeZone="UTC" categoryLabel="Week" />);
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    const table = screen.getByRole('table', { name: 'Defects' });
    expect(
      within(table)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual([
      'WeekOpenClosed',
      'Mar 2, 202681',
      'Mar 9, 202654',
      'Mar 16, 2026',
      'Mar 23, 202639',
    ]);
  });
});
