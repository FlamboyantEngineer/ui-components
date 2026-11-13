import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { BarChart } from './bar-chart.js';
import { placeReferences, type ReferenceAxis } from './chart-references.js';
import { LineChart, type LineChartSeries } from './line-chart.js';

const plot = { left: 10, top: 10, right: 110, bottom: 110 };
/** Values 0 to 100 up the plot. */
const upward: ReferenceAxis<number> = {
  map: (value) => (Number.isFinite(value) ? 110 - value : Number.NaN),
  format: String,
  direction: 'y',
};

const references = () => [...document.querySelectorAll('.ui-chart__reference')];

describe('placeReferences', () => {
  it('UIC-CHART-9.1 places lines and bands in the plot and leaves out what does not fit', () => {
    const placed = placeReferences(
      [
        { id: 'target', label: 'Target', value: 40 },
        { id: 'beyond', label: 'Beyond', value: 140 },
        { id: 'unread', label: 'Unread', value: Number.NaN },
        { id: 'range', type: 'band', label: 'Range', from: 80, to: 130 },
        { id: 'below', type: 'band', label: 'Below', from: -30, to: -10 },
        { id: 'flat', type: 'band', label: 'Flat', from: 20, to: 20 },
      ],
      upward,
      { plot, isRtl: false },
    );
    expect(placed.map((reference) => reference.label)).toEqual(['Target', 'Range']);
    expect(placed[0]).toMatchObject({ kind: 'line', x1: 10, x2: 110, y1: 70, y2: 70, labelX: 106 });
    expect(placed[1]).toMatchObject({ kind: 'band', y1: 10, y2: 30 });
  });

  it('UIC-CHART-9.1 mirrors labels in right-to-left reading and runs vertical references', () => {
    const [line] = placeReferences([{ id: 't', label: 'T', value: 40 }], upward, {
      plot,
      isRtl: true,
    });
    expect(line?.labelX).toBe(14);
    const across: ReferenceAxis<number> = {
      ...upward,
      map: (value) => 10 + value,
      direction: 'x',
    };
    const [vertical] = placeReferences([{ id: 't', label: 'T', value: 40 }], across, {
      plot,
      isRtl: false,
    });
    expect(vertical).toMatchObject({ x1: 50, x2: 50, y1: 10, y2: 110, labelX: 54 });
  });
});

describe('chart references', () => {
  it('UIC-CHART-9.1 UIC-CHART-9.2 draws decorative references under the bars, named in the summary', async () => {
    const user = userEvent.setup();
    render(
      <BarChart
        label="Crates"
        categories={['Jan', 'Feb']}
        series={[{ id: 'apples', label: 'Apples', values: [12, 18] }]}
        references={[
          { id: 'goal', label: 'Goal', value: 15, tone: 'success' },
          { id: 'usual', type: 'band', label: 'Usual', from: 5, to: 10 },
          { id: 'far', label: 'Far', value: 1000 },
        ]}
      />,
    );
    const group = document.querySelector('.ui-chart__references');
    expect(group).toHaveAttribute('aria-hidden', 'true');
    expect(group).toHaveAttribute('pointer-events', 'none');
    expect(references().map((reference) => reference.getAttribute('data-kind'))).toEqual([
      'line',
      'band',
    ]);
    expect(references()[0]).toHaveAttribute('data-tone', 'success');
    expect(references()[0]).toHaveAttribute('data-axis', 'y');
    expect(screen.getByRole('figure')).toHaveAccessibleDescription(
      '1 series, 2 values, from 12 to 18. Marked: Goal: 15, Usual: 5 to 10, Far: 1,000',
    );
    // The far reference does not stretch the axis.
    const labels = [...document.querySelectorAll('.ui-chart-axis__label')].map(
      (label) => label.textContent,
    );
    expect(labels).not.toContain('1,000');
    const firstBar = requireDefined(document.querySelector('.ui-bar-chart__bar'));
    expect(
      requireDefined(group).compareDocumentPosition(firstBar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toHaveClass('ui-bar-chart__bar');
    expectHooksMatchSpec(document.body, 'CHART', {
      slots: ['references', 'reference', 'reference-line', 'reference-band', 'reference-label'],
    });
  });

  it('UIC-CHART-9.1 keys references by axis, so a value and an x reference may share an id', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { rerender } = render(
      <LineChart
        aria-label="Load"
        series={[
          {
            id: 'load',
            label: 'Load',
            points: [
              { x: 1, y: 2 },
              { x: 5, y: 8 },
            ],
          },
        ]}
        references={[{ id: 'mark', label: 'Ceiling', value: 6 }]}
        xReferences={[{ id: 'mark', label: 'Cutover', value: 3 }]}
      />,
    );
    rerender(
      <LineChart
        aria-label="Load"
        series={[
          {
            id: 'load',
            label: 'Load',
            points: [
              { x: 1, y: 2 },
              { x: 5, y: 8 },
            ],
          },
        ]}
        references={[{ id: 'mark', label: 'Ceiling', value: 6 }]}
      />,
    );
    const keyWarnings = errors.mock.calls.filter((call) => String(call[0]).includes('same key'));
    errors.mockRestore();
    expect(keyWarnings).toEqual([]);
    expect(references().map((reference) => reference.textContent)).toEqual(['Ceiling']);
  });

  it('UIC-CHART-9.1 runs value references across horizontal bars', () => {
    render(
      <BarChart
        aria-label="Crates"
        orientation="horizontal"
        categories={['Jan', 'Feb']}
        series={[{ id: 'apples', label: 'Apples', values: [12, 18] }]}
        references={[{ id: 'goal', label: 'Goal', value: 15 }]}
      />,
    );
    const line = document.querySelector('.ui-chart__reference-line');
    expect(references()[0]).toHaveAttribute('data-axis', 'x');
    expect(line?.getAttribute('x1')).toBe(line?.getAttribute('x2'));
  });

  it('UIC-CHART-9.1 UIC-CHART-9.2 places x references on a time axis, kept while series hide', async () => {
    const user = userEvent.setup();
    const series: LineChartSeries[] = [
      {
        id: 'open',
        label: 'Open',
        points: [
          { x: '2026-03-02', y: 8 },
          { x: '2026-03-16', y: 4 },
        ],
      },
      {
        id: 'closed',
        label: 'Closed',
        points: [
          { x: '2026-03-02', y: 2 },
          { x: '2026-03-16', y: 6 },
        ],
      },
    ];
    render(
      <LineChart
        aria-label="Defects"
        series={series}
        timeZone="Asia/Tokyo"
        references={[{ id: 'limit', label: 'Limit', value: 5 }]}
        xReferences={[
          { id: 'freeze', type: 'band', label: 'Freeze', from: '2026-03-09', to: '2026-03-12' },
          { id: 'number', label: 'Wrong kind', value: 4 },
        ]}
      />,
    );
    expect(references().map((reference) => reference.getAttribute('data-axis'))).toEqual([
      'y',
      'x',
    ]);
    expect(screen.getByRole('figure')).toHaveAccessibleDescription(
      '2 series, 4 values, from 2 to 8. Marked: Limit: 5, Freeze: Mar 9, 2026 to Mar 12, 2026',
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(references()).toHaveLength(2);
  });
});
