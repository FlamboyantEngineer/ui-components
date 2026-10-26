import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { DonutChart, type DonutChartSegment } from './donut-chart.js';

const sold: DonutChartSegment[] = [
  { id: 'apples', label: 'Apples', value: 60 },
  { id: 'pears', label: 'Pears', tone: 'success', value: 30 },
  { id: 'plums', label: 'Plums', value: 30 },
];

const slices = () => [...document.querySelectorAll('.ui-donut-chart__slice')];
const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

describe('DonutChart', () => {
  it('UIC-CHART-7.1 UIC-CHART-4.1 UIC-CHART-4.2 UIC-CHART-4.6 draws named slices around the total', () => {
    render(<DonutChart label="Fruit sold" segments={sold} />);
    const figure = screen.getByRole('figure', { name: 'Fruit sold' });
    expect(figure).toHaveClass('ui-chart', 'ui-donut-chart');
    const plot = requireDefined(figure.querySelector('.ui-chart__plot'));
    expect([plot.getAttribute('width'), plot.getAttribute('height')]).toEqual(['160', '160']);
    expect(slices().map((slice) => slice.getAttribute('data-series'))).toEqual(['0', '1', '2']);
    expect(slices()[1]).toHaveAttribute('data-tone', 'success');
    expect(screen.getAllByRole('img').map((slice) => slice.getAttribute('aria-label'))).toEqual([
      'Apples: 60, 50%',
      'Pears: 30, 25%',
      'Plums: 30, 25%',
    ]);
    const total = figure.querySelector('.ui-donut-chart__total');
    expect(total).toHaveTextContent('120 total');
    expect(total).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('toolbar', { name: 'Legend' })).toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'CHART', {
      slots: ['plot', 'ui-donut-chart__slice', 'ui-donut-chart__total', 'ui-chart-legend__swatch'],
    });
  });

  it('UIC-CHART-4.6 takes a diameter and hides its legend on request', () => {
    render(<DonutChart aria-label="Fruit sold" segments={sold} diameter={96} showLegend={false} />);
    expect(document.querySelector('.ui-chart__plot')).toHaveAttribute('viewBox', '0 0 96 96');
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('UIC-CHART-4.3 UIC-CHART-4.4 steps through slices with a tooltip of the value and share', async () => {
    const user = userEvent.setup();
    render(<DonutChart aria-label="Fruit sold" segments={sold} showLegend={false} />);
    act(() => (slices()[0] as SVGElement).focus());
    expect(tooltip()?.querySelector('.ui-chart__tooltip-title')).toBeNull();
    expect(tooltip()?.querySelector('.ui-chart__tooltip-label')).toHaveTextContent('Apples');
    expect(tooltip()?.querySelector('.ui-chart__tooltip-value')).toHaveTextContent('60 (50%)');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toHaveAccessibleName('Pears: 30, 25%');
    expect(tooltip()?.querySelector('.ui-chart__tooltip-label')).toHaveTextContent('Pears');
    await user.keyboard('{End}');
    expect(document.activeElement).toHaveAccessibleName('Plums: 30, 25%');
    await user.tab();
    expect(tooltip()).toBeNull();
  });

  it('UIC-CHART-4.5 summarises the total and largest shown segment', async () => {
    const user = userEvent.setup();
    render(<DonutChart aria-label="Fruit sold" segments={sold} />);
    const figure = screen.getByRole('figure');
    expect(figure).toHaveAccessibleDescription('Total 120, largest Apples at 50%');
    await user.click(screen.getByRole('button', { name: 'Apples' }));
    expect(slices()).toHaveLength(2);
    expect(figure).toHaveAccessibleDescription('Total 60, largest Pears at 50%');
    expect(figure.querySelector('.ui-donut-chart__total')).toHaveTextContent('60 total');
  });

  it('UIC-CHART-4.5 marks a donut with nothing to draw', () => {
    render(
      <DonutChart aria-label="Fruit sold" segments={[{ id: 'none', label: 'None', value: 0 }]} />,
    );
    const figure = screen.getByRole('figure');
    expect(figure).toHaveAttribute('data-empty', 'true');
    expect(figure).toHaveAccessibleDescription('No data');
    expect(figure.querySelector('.ui-chart__empty')).toHaveTextContent('No data');
  });

  it('UIC-CHART-7.2 lists every segment with its value and share in its table', async () => {
    const user = userEvent.setup();
    render(
      <DonutChart
        aria-label="Fruit sold"
        segments={sold}
        categoryLabel="Fruit"
        defaultHiddenKeys={['plums']}
        formatOptions={{ style: 'unit', unit: 'kilogram' }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    const table = screen.getByRole('table', { name: 'Fruit sold' });
    expect(
      within(table)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['FruitValueShare', 'Apples60 kg50%', 'Pears30 kg25%', 'Plums30 kg25%']);
  });
});
