import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CalendarHeatmap, type CalendarHeatmapDay } from './calendar-heatmap.js';

const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

const readings: CalendarHeatmapDay[] = [
  { date: '2026-03-02', value: 4 },
  { date: '2026-03-03', value: 0 },
  { date: '2026-03-04', value: null },
  { date: '2026-03-09', value: 12 },
  { date: '2026-03-10', value: 30 },
];

const cell = (name: string) => screen.getByRole('img', { name });

describe('CalendarHeatmap', () => {
  it('UIC-CHART-11.1 UIC-CHART-11.2 names every day by its date and value, apart from colour', () => {
    render(
      <CalendarHeatmap
        label="Visits"
        days={readings}
        firstDayOfWeek="mon"
        maxValue={20}
        showSummary
      />,
    );
    const figure = screen.getByRole('figure', { name: 'Visits' });
    expect(figure).toHaveClass('ui-chart', 'ui-calendar-heatmap');
    expect(screen.getAllByRole('img')).toHaveLength(9);
    expect(cell('Mar 2, 2026: 4')).toHaveAttribute('data-level', '1');
    expect(cell('Mar 3, 2026: 0')).toHaveAttribute('data-level', '0');
    expect(cell('Mar 4, 2026: Not recorded')).toHaveAttribute('data-state', 'missing');
    expect(cell('Mar 5, 2026: No data')).toHaveAttribute('data-state', 'absent');
    expect(cell('Mar 10, 2026: 30')).toHaveAttribute('data-outlier', 'high');
    expect(cell('Mar 10, 2026: 30')).toHaveAttribute('data-level', '4');
    const legend = screen.getByRole('list', { name: 'Scale' });
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      '0 or less',
      '0 to 5',
      '5 to 10',
      '10 to 15',
      '15 or more',
      'Not recorded',
      'No data',
    ]);
    expect(figure).toHaveAccessibleDescription('9 days, 4 values, from 0 to 30');
    expectHooksMatchSpec(document.body, 'CHART', {
      slots: [
        'ui-calendar-heatmap__cell',
        'ui-calendar-heatmap__month',
        'ui-calendar-heatmap__weekday',
        'ui-calendar-heatmap__legend',
        'ui-calendar-heatmap__legend-item',
        'ui-calendar-heatmap__legend-swatch',
        'ui-calendar-heatmap__legend-label',
      ],
    });
  });

  it('UIC-CHART-11.3 moves by day and by week with the arrow keys and shows the tooltip', async () => {
    const user = userEvent.setup();
    render(<CalendarHeatmap aria-label="Visits" days={readings} firstDayOfWeek="mon" />);
    await user.tab();
    await user.tab();
    expect(document.activeElement).toHaveAccessibleName('Mar 2, 2026: 4');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Mar 3, 2026: 0');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toHaveAccessibleName('Mar 10, 2026: 30');
    expect(tooltip()).toHaveTextContent('Mar 10, 2026 30');
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(document.activeElement).toHaveAccessibleName('Mar 2, 2026: 4');
  });

  it('UIC-CHART-11.3 lists the given days in the table and replaces the data', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CalendarHeatmap aria-label="Visits" days={readings} />);
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    expect(
      within(screen.getByRole('table'))
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual([
      'DateValue',
      'Mar 2, 20264',
      'Mar 3, 20260',
      'Mar 4, 2026Not recorded',
      'Mar 9, 202612',
      'Mar 10, 202630',
    ]);
    rerender(<CalendarHeatmap aria-label="Visits" days={[{ date: '2026-04-01', value: 2 }]} />);
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2);
  });

  it('UIC-CHART-11.1 shows no data for an empty range', () => {
    render(<CalendarHeatmap aria-label="Visits" days={[{ date: '2026-03-02', value: null }]} />);
    expect(screen.getByRole('figure')).toHaveAttribute('data-empty');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
