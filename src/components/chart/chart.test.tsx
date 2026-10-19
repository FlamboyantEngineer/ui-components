import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Chart } from './chart.js';
import { ChartAxis } from './chart-axis.js';
import { ChartLegend } from './chart-legend.js';

const table = {
  columns: ['Fruit', 'Crates'],
  rows: [
    ['Apples', '12'],
    ['Pears', '7'],
  ],
};

const fruits = [
  { id: 'apples', label: 'Apples' },
  { id: 'pears', label: 'Pears', tone: 'success' as const },
  { id: 'plums', label: 'Plums' },
];

describe('Chart', () => {
  it('UIC-CHART-1.1 UIC-CHART-1.2 UIC-CHART-8.1 is a named figure described by its summary', () => {
    render(
      <Chart label="Harvest" summary="Two fruits, from 7 to 12" table={table}>
        <svg role="img" aria-label="Drawing" />
      </Chart>,
    );
    const figure = screen.getByRole('figure', { name: 'Harvest' });
    expect(figure).toHaveClass('ui-chart');
    expect(figure).toHaveAttribute('data-view', 'chart');
    expect(figure).toHaveAccessibleDescription('Two fruits, from 7 to 12');
    expect(
      figure.querySelector('.ui-chart__summary')?.closest('.ui-visually-hidden'),
    ).not.toBeNull();
    expect(screen.getByRole('img', { name: 'Drawing', hidden: true }).parentElement).toHaveClass(
      'ui-chart__body',
    );
    expect(figure.querySelector('.ui-chart__header .ui-chart__title')).toHaveTextContent('Harvest');
    expectHooksMatchSpec(document.body, 'CHART', {
      slots: ['header', 'title', 'view-toggle', 'summary', 'body'],
    });
  });

  it('UIC-CHART-1.2 shows the summary and keeps the caller description after it', () => {
    render(
      <>
        <p id="note">Counted on Friday</p>
        <Chart
          aria-label="Harvest"
          aria-describedby="note"
          summary="Two fruits"
          showSummary
          table={table}
        />
      </>,
    );
    const figure = screen.getByRole('figure', { name: 'Harvest' });
    expect(figure).toHaveAccessibleDescription('Two fruits Counted on Friday');
    expect(figure.querySelector('.ui-chart__summary')?.closest('.ui-visually-hidden')).toBeNull();
    expect(figure.querySelector('.ui-chart__title')).toBeNull();
  });

  it('UIC-CHART-1.3 switches to a table of the values with its toggle', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(
      <Chart label="Harvest" summary="Two fruits" table={table} onViewChange={onViewChange}>
        <svg role="img" aria-label="Drawing" />
      </Chart>,
    );
    const toggle = screen.getByRole('button', { name: 'Show as table' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle.querySelector('[data-glyph="table"]')).not.toBeNull();
    await user.click(toggle);
    expect(onViewChange).toHaveBeenCalledWith('table');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('figure')).toHaveAttribute('data-view', 'table');
    expect(screen.queryByRole('img', { name: 'Drawing', hidden: true })).not.toBeInTheDocument();
    const grid = screen.getByRole('table', { name: 'Harvest' });
    expect(grid).toHaveClass('ui-prose-table', 'ui-chart__table');
    expect(
      within(grid)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Fruit', 'Crates']);
    expect(
      within(grid)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Apples', 'Pears']);
    expectHooksMatchSpec(document.body, 'CHART', { slots: ['table'] });
  });

  it('UIC-CHART-1.3 keeps a controlled view', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(
      <Chart
        aria-label="Harvest"
        summary="Two fruits"
        table={table}
        view="table"
        onViewChange={onViewChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    expect(onViewChange).toHaveBeenCalledWith('chart');
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('UIC-CHART-1.4 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Chart
        aria-label="Harvest"
        summary="Two fruits"
        table={table}
        className="caller"
        id="harvest"
        ref={ref}
        data-owner="harvest"
        data-view="caller"
      />,
    );
    const figure = screen.getByRole('figure', { name: 'Harvest' });
    expect(figure).toHaveClass('ui-chart', 'caller');
    expect(figure).toHaveAttribute('data-owner', 'harvest');
    expect(figure).toHaveAttribute('id', 'harvest');
    expect(figure).toHaveAttribute('data-view', 'chart');
    expect(ref.current).toBe(figure);
  });
});

describe('ChartLegend', () => {
  it('UIC-CHART-2.1 toggles series with one pressed button per shown series', async () => {
    const user = userEvent.setup();
    const onHiddenKeysChange = vi.fn();
    render(
      <ChartLegend
        items={fruits}
        defaultHiddenKeys={['plums']}
        onHiddenKeysChange={onHiddenKeysChange}
      />,
    );
    const legend = screen.getByRole('toolbar', { name: 'Legend' });
    expect(legend).toHaveClass('ui-chart-legend');
    const items = within(legend).getAllByRole('button');
    expect(items.map((item) => item.getAttribute('aria-pressed'))).toEqual([
      'true',
      'true',
      'false',
    ]);
    expect(items.map((item) => item.getAttribute('data-series'))).toEqual(['0', '1', '2']);
    expect(items[1]).toHaveAttribute('data-tone', 'success');
    expect(items[1]?.querySelector('.ui-chart-legend__swatch')).toHaveAttribute(
      'data-tone',
      'success',
    );
    expect(items[0]).toHaveAccessibleName('Apples');
    await user.click(items[0]!);
    expect(onHiddenKeysChange).toHaveBeenLastCalledWith(new Set(['apples', 'plums']));
    expect(items[0]).toHaveAttribute('aria-pressed', 'false');
    expectHooksMatchSpec(document.body, 'CHART', {
      slots: ['ui-chart-legend__item', 'ui-chart-legend__label'],
    });
  });

  it('UIC-CHART-2.1 follows controlled hidden series', async () => {
    const user = userEvent.setup();
    const onHiddenKeysChange = vi.fn();
    render(
      <ChartLegend items={fruits} hiddenKeys={['pears']} onHiddenKeysChange={onHiddenKeysChange} />,
    );
    const pears = screen.getByRole('button', { name: 'Pears' });
    expect(pears).toHaveAttribute('aria-pressed', 'false');
    await user.click(pears);
    expect(onHiddenKeysChange).toHaveBeenCalledWith(new Set());
    expect(pears).toHaveAttribute('aria-pressed', 'false');
  });

  it('UIC-CHART-2.2 keeps the only shown series shown', async () => {
    const user = userEvent.setup();
    render(
      <ChartLegend items={fruits} defaultHiddenKeys={['apples', 'plums']} aria-label="Fruits" />,
    );
    const pears = screen.getByRole('button', { name: 'Pears' });
    await user.click(pears);
    expect(pears).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('toolbar', { name: 'Fruits' })).toBeInTheDocument();
  });

  it('UIC-CHART-2.3 takes one tab stop and moves between items with the arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ChartLegend items={fruits} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Apples' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Pears' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });
});

describe('ChartAxis', () => {
  const ticks = [
    { value: 0, position: 10, label: '0' },
    { value: 5, position: 110, label: '5' },
  ];

  it('UIC-CHART-3.1 UIC-CHART-3.2 UIC-CHART-8.2 draws a bottom axis with marks, labels and grid lines', () => {
    const { container } = render(
      <svg>
        <ChartAxis position="bottom" ticks={ticks} offset={100} range={[10, 110]} gridLength={80} />
      </svg>,
    );
    const axis = container.querySelector('.ui-chart-axis')!;
    expect(axis).toHaveAttribute('data-position', 'bottom');
    expect(axis).toHaveAttribute('aria-hidden', 'true');
    const line = axis.querySelector('.ui-chart-axis__line')!;
    expect(['x1', 'y1', 'x2', 'y2'].map((name) => line.getAttribute(name))).toEqual([
      '10',
      '100',
      '110',
      '100',
    ]);
    const tick = axis.querySelectorAll('.ui-chart-axis__tick')[1]!;
    expect(['x1', 'y1', 'x2', 'y2'].map((name) => tick.getAttribute(name))).toEqual([
      '110',
      '100',
      '110',
      '104',
    ]);
    const label = axis.querySelectorAll('.ui-chart-axis__label')[1]!;
    expect([
      label.getAttribute('x'),
      label.getAttribute('y'),
      label.getAttribute('text-anchor'),
    ]).toEqual(['110', '108', 'middle']);
    expect(label).toHaveTextContent('5');
    const grid = axis.querySelectorAll('.ui-chart-axis__grid')[0]!;
    expect(['x1', 'y1', 'x2', 'y2'].map((name) => grid.getAttribute(name))).toEqual([
      '10',
      '100',
      '10',
      '20',
    ]);
    expectHooksMatchSpec(container, 'CHART', {
      slots: ['ui-chart-axis__line', 'ui-chart-axis__grid'],
    });
  });

  it('UIC-CHART-3.1 draws a left axis without grid lines by default', () => {
    const { container } = render(
      <svg>
        <ChartAxis
          position="left"
          ticks={ticks}
          offset={40}
          range={[110, 10]}
          className="caller"
          data-testid="axis"
        />
      </svg>,
    );
    const axis = container.querySelector('.ui-chart-axis')!;
    expect(axis).toHaveClass('caller');
    expect(axis).toHaveAttribute('data-testid', 'axis');
    expect(axis.querySelector('.ui-chart-axis__grid')).toBeNull();
    const label = axis.querySelectorAll('.ui-chart-axis__label')[0]!;
    expect([
      label.getAttribute('x'),
      label.getAttribute('y'),
      label.getAttribute('text-anchor'),
    ]).toEqual(['32', '10', 'end']);
    const tick = axis.querySelectorAll('.ui-chart-axis__tick')[0]!;
    expect([tick.getAttribute('x1'), tick.getAttribute('x2')]).toEqual(['40', '36']);
  });
});
