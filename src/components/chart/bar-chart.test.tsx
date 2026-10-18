import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { BarChart, type BarChartSeries } from './bar-chart.js';

const months = ['Jan', 'Feb', 'Mar'];
const crates: BarChartSeries[] = [
  { id: 'apples', label: 'Apples', values: [12, 18, 9] },
  { id: 'pears', label: 'Pears', tone: 'success', values: [7, Number.NaN, 11] },
];

const bars = () => [...document.querySelectorAll('.ui-bar-chart__bar')];
const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

describe('BarChart', () => {
  it('UIC-CHART-5.1 UIC-CHART-4.1 UIC-CHART-4.2 UIC-CHART-1.4 draws a named bar per finite value', () => {
    render(<BarChart label="Crates by month" categories={months} series={crates} />);
    const figure = screen.getByRole('figure', { name: 'Crates by month' });
    expect(figure).toHaveClass('ui-chart', 'ui-bar-chart');
    expect(figure).toHaveAttribute('data-layout', 'grouped');
    expect(figure).toHaveAttribute('data-orientation', 'vertical');
    expect(bars()).toHaveLength(5);
    expect(bars().map((bar) => bar.getAttribute('data-series'))).toEqual(['0', '1', '0', '0', '1']);
    expect(bars()[1]).toHaveAttribute('data-tone', 'success');
    expect(bars()[0]).not.toHaveAttribute('data-tone');
    expect(screen.getAllByRole('img').map((bar) => bar.getAttribute('aria-label'))).toEqual([
      'Apples, Jan: 12',
      'Pears, Jan: 7',
      'Apples, Feb: 18',
      'Apples, Mar: 9',
      'Pears, Mar: 11',
    ]);
    expect(figure.querySelector('.ui-chart__plot')).toHaveAttribute('role', 'group');
    expectHooksMatchSpec(document.body, 'CHART', {
      slots: [
        'plot',
        'ui-bar-chart__bar',
        'ui-chart-axis__line',
        'ui-chart-axis__grid',
        'ui-chart-legend__item',
      ],
    });
  });

  it('UIC-CHART-4.6 UIC-CHART-5.2 sizes the drawing and leaves room for the value labels', () => {
    render(<BarChart aria-label="Crates" categories={months} series={crates} height={200} />);
    const plot = document.querySelector('.ui-chart__plot')!;
    expect([plot.getAttribute('width'), plot.getAttribute('height')]).toEqual(['480', '200']);
    const valueAxis = document.querySelector('.ui-chart-axis[data-position="left"]')!;
    expect(valueAxis.querySelector('.ui-chart-axis__line')).toHaveAttribute('x1', '26');
    expect(
      [...valueAxis.querySelectorAll('.ui-chart-axis__label')].map((label) => label.textContent),
    ).toEqual(['0', '5', '10', '15', '20']);
    expect(document.querySelector('.ui-chart-axis[data-position="bottom"]')).toHaveTextContent(
      'JanFebMar',
    );
  });

  it('UIC-CHART-5.1 UIC-CHART-5.2 stacks horizontal bars and formats values', () => {
    render(
      <BarChart
        aria-label="Crates"
        categories={months}
        series={crates}
        layout="stacked"
        orientation="horizontal"
        formatOptions={{ style: 'unit', unit: 'kilogram' }}
      />,
    );
    const figure = screen.getByRole('figure');
    expect(figure).toHaveAttribute('data-layout', 'stacked');
    expect(figure).toHaveAttribute('data-orientation', 'horizontal');
    expect(document.querySelector('.ui-chart-axis[data-position="left"]')).toHaveTextContent(
      'JanFebMar',
    );
    const [apples, pears] = bars();
    expect(pears?.getAttribute('x')).toBe(
      String(Number(apples?.getAttribute('x')) + Number(apples?.getAttribute('width'))),
    );
    expect(apples?.getAttribute('y')).toBe(pears?.getAttribute('y'));
    expect(screen.getAllByRole('img')[0]).toHaveAccessibleName('Apples, Jan: 12 kg');
  });

  it('UIC-CHART-4.3 moves focus along a series and between series with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<BarChart aria-label="Crates" categories={months} series={crates} />);
    await user.tab();
    await user.tab();
    await user.tab();
    const focused = () => document.activeElement?.getAttribute('aria-label');
    expect(focused()).toBe('Apples, Jan: 12');
    await user.keyboard('{ArrowRight}');
    expect(focused()).toBe('Apples, Feb: 18');
    await user.keyboard('{ArrowDown}');
    expect(focused()).toBe('Pears, Jan: 7');
    await user.keyboard('{End}');
    expect(focused()).toBe('Pears, Mar: 11');
    await user.keyboard('{ArrowUp}');
    expect(focused()).toBe('Apples, Mar: 9');
    await user.keyboard('{Home}');
    expect(focused()).toBe('Apples, Jan: 12');
    await user.keyboard('{ArrowLeft}');
    expect(focused()).toBe('Apples, Jan: 12');
    expect(bars().filter((bar) => bar.getAttribute('tabindex') === '0')).toHaveLength(1);
  });

  it('UIC-CHART-4.3 runs categories down the keyboard for horizontal bars', async () => {
    const user = userEvent.setup();
    render(
      <BarChart
        aria-label="Crates"
        categories={months}
        series={crates}
        orientation="horizontal"
        showLegend={false}
      />,
    );
    await user.tab();
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Apples, Feb: 18');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toHaveAccessibleName('Pears, Jan: 7');
  });

  it('UIC-CHART-4.4 shows a tooltip for the focused or hovered bar', async () => {
    const user = userEvent.setup();
    render(<BarChart aria-label="Crates" categories={months} series={crates} />);
    const [first, second] = bars();
    act(() => (first as SVGElement).focus());
    expect(first).toHaveAttribute('data-active', 'true');
    expect(tooltip()).toHaveClass('ui-tooltip', 'ui-chart__tooltip');
    expect(tooltip()?.querySelector('.ui-chart__tooltip-title')).toHaveTextContent('Jan');
    expect(tooltip()?.querySelector('.ui-chart__tooltip-label')).toHaveTextContent('Apples');
    expect(tooltip()?.querySelector('.ui-chart__tooltip-value')).toHaveTextContent('12');
    expect(tooltip()?.querySelector('.ui-chart__tooltip-swatch')).toHaveAttribute(
      'data-series',
      '0',
    );
    expectHooksMatchSpec(document.body, 'CHART', {
      slots: ['tooltip', 'tooltip-title', 'tooltip-swatch', 'tooltip-label', 'tooltip-value'],
    });
    await user.keyboard('{Escape}');
    expect(tooltip()).toBeNull();
    await user.hover(second!);
    expect(tooltip()?.querySelector('.ui-chart__tooltip-swatch')).toHaveAttribute(
      'data-tone',
      'success',
    );
    await user.unhover(second!);
    expect(tooltip()).toBeNull();
  });

  it('UIC-CHART-2.1 UIC-CHART-4.5 hides series from the legend and summarises the drawn values', async () => {
    const user = userEvent.setup();
    const onHiddenKeysChange = vi.fn();
    render(
      <BarChart
        aria-label="Crates"
        categories={months}
        series={crates}
        onHiddenKeysChange={onHiddenKeysChange}
      />,
    );
    const figure = screen.getByRole('figure');
    expect(figure).toHaveAccessibleDescription('2 series, 5 values, from 7 to 18');
    await user.click(screen.getByRole('button', { name: 'Pears' }));
    expect(onHiddenKeysChange).toHaveBeenCalledWith(new Set(['pears']));
    expect(bars()).toHaveLength(3);
    expect(figure).toHaveAccessibleDescription('1 series, 3 values, from 9 to 18');
  });

  it('UIC-CHART-2.1 draws no legend for one series and takes a caller summary', () => {
    render(
      <BarChart
        aria-label="Crates"
        categories={months}
        series={crates.slice(0, 1)}
        summary="Apples peak in February"
        showSummary
      />,
    );
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(screen.getByRole('figure')).toHaveAccessibleDescription('Apples peak in February');
    expect(screen.getByText('Apples peak in February')).toHaveClass('ui-chart__summary');
  });

  it('UIC-CHART-4.5 marks a chart with no values', () => {
    render(<BarChart aria-label="Crates" categories={[]} series={crates} />);
    const figure = screen.getByRole('figure');
    expect(figure).toHaveAttribute('data-empty', 'true');
    expect(figure).toHaveAccessibleDescription('No data');
    expect(figure.querySelector('.ui-chart__empty')).toHaveTextContent('No data');
    expect(figure.querySelector('.ui-chart__plot')).toBeNull();
    expectHooksMatchSpec(document.body, 'CHART', { slots: ['empty'] });
  });

  it('UIC-CHART-5.3 lists every category and series in its table', async () => {
    const user = userEvent.setup();
    render(
      <BarChart
        aria-label="Crates"
        categories={months}
        series={crates}
        categoryLabel="Month"
        defaultHiddenKeys={['pears']}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    const table = screen.getByRole('table', { name: 'Crates' });
    expect(
      within(table)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['MonthApplesPears', 'Jan127', 'Feb18', 'Mar911']);
  });

  it('UIC-CHART-1.4 forwards caller attributes without replacing its hooks', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <BarChart
        aria-label="Crates"
        categories={months}
        series={crates}
        className="caller"
        ref={ref}
        data-testid="crates"
        data-layout="caller"
      />,
    );
    const figure = screen.getByTestId('crates');
    expect(figure).toHaveClass('ui-chart', 'ui-bar-chart', 'caller');
    expect(figure).toHaveAttribute('data-layout', 'grouped');
    expect(ref.current).toBe(figure);
  });
});
