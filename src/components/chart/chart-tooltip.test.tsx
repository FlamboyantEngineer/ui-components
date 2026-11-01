import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BarChart, type BarChartSeries } from './bar-chart.js';
import { LineChart } from './line-chart.js';

const categories = ['First', 'Second', 'Third'];
const alpha: BarChartSeries = { id: 'a', label: 'Alpha', values: [1] };
const blue = (values: number[]): BarChartSeries => ({ id: 'b', label: 'Blue', values });

const tooltip = () => document.querySelector('[role="tooltip"]');

/** Escape presses that reach the page past the chart. */
function listenForEscape() {
  const reached = vi.fn();
  const listener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') reached();
  };
  document.addEventListener('keydown', listener);
  return { reached, stop: () => document.removeEventListener('keydown', listener) };
}

describe('chart tooltip of a value that goes', () => {
  it('UIC-CHART-4.4 closes a hovered tooltip and gives back Escape when its bar goes', async () => {
    const user = userEvent.setup();
    const escape = listenForEscape();
    const { rerender } = render(
      <BarChart aria-label="Values" categories={categories} series={[alpha, blue([3, 4, 5])]} />,
    );
    await user.hover(screen.getByRole('img', { name: 'Blue, Third: 5' }));
    expect(tooltip()).toHaveTextContent('Blue');
    rerender(
      <BarChart aria-label="Values" categories={categories} series={[alpha, blue([3, 4])]} />,
    );
    expect(tooltip()).toBeNull();
    const field = document.body.appendChild(document.createElement('input'));
    field.focus();
    await user.keyboard('{Escape}');
    expect(escape.reached).toHaveBeenCalledTimes(1);
    // The value coming back does not reopen its tooltip.
    rerender(
      <BarChart aria-label="Values" categories={categories} series={[alpha, blue([3, 4, 5])]} />,
    );
    expect(tooltip()).toBeNull();
    field.remove();
    escape.stop();
  });

  it('UIC-CHART-4.4 closes a focused tooltip when its series is hidden, keeping live ones', async () => {
    const user = userEvent.setup();
    const escape = listenForEscape();
    const series = [
      { id: 'low', label: 'Low', points: [{ x: 1, y: 2 }] },
      { id: 'high', label: 'High', points: [{ x: 1, y: 5 }] },
    ];
    const { rerender } = render(
      <LineChart aria-label="Levels" series={series} hiddenKeys={new Set()} />,
    );
    act(() => screen.getByRole('img', { name: 'High, 1: 5' }).focus());
    expect(tooltip()).toHaveTextContent('High');
    rerender(<LineChart aria-label="Levels" series={series} hiddenKeys={new Set(['high'])} />);
    expect(tooltip()).toBeNull();
    await user.keyboard('{Escape}');
    expect(escape.reached).toHaveBeenCalledTimes(1);
    // A live tooltip still claims Escape, which goes no further.
    act(() => screen.getByRole('img', { name: 'Low, 1: 2' }).focus());
    expect(tooltip()).toHaveTextContent('Low');
    await user.keyboard('{Escape}');
    expect(tooltip()).toBeNull();
    expect(escape.reached).toHaveBeenCalledTimes(1);
    escape.stop();
  });
});
