import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  type SignalChannel,
  type SignalCursors,
  type SignalTimeRange,
  SignalTraces,
} from './signal-traces.js';

const ramp = (count: number, scale = 1) =>
  Array.from({ length: count }, (_, index) => ({ time: index * scale, value: index * 2 }));

const channels: SignalChannel[] = [
  {
    id: 'level',
    label: 'Level',
    unit: 'V',
    samples: ramp(11),
    reference: ramp(11).map((sample) => ({ ...sample, value: 10 })),
    envelope: ramp(11).map(({ time, value }) => ({ time, lower: value - 1, upper: value + 1 })),
  },
  { id: 'rate', label: 'Rate', samples: ramp(11).map(({ time }) => ({ time, value: 5 - time })) },
];

const plot = () => screen.getByRole('group', { name: 'Signal traces' });
const readout = () => screen.getByRole('table', { name: 'Cursor readings' });
const cursor = (number: number) => screen.getByRole('slider', { name: `Cursor ${String(number)}` });
const rangeText = (container: HTMLElement) =>
  container.querySelector('.ui-signal-traces__range')?.textContent;

/** Renders controlled traces that report every change, like a host would hold them. */
function ControlledTraces(props: {
  domain: SignalTimeRange;
  onRangeChange: (range: SignalTimeRange) => void;
  onCursorsChange: (cursors: SignalCursors) => void;
}) {
  const [range, setRange] = useState<SignalTimeRange>([2, 6]);
  const [cursors, setCursors] = useState<SignalCursors>([3, 4.5]);
  return (
    <SignalTraces
      aria-label="Bench"
      channels={channels}
      domain={props.domain}
      range={range}
      onRangeChange={(next) => {
        props.onRangeChange(next);
        setRange(next);
      }}
      cursors={cursors}
      onCursorsChange={(next) => {
        props.onCursorsChange(next);
        setCursors(next);
      }}
    />
  );
}

describe('SignalTraces', () => {
  it('UIC-SIGNAL-TRACES-1.1 UIC-SIGNAL-TRACES-1.2 UIC-SIGNAL-TRACES-1.3 UIC-SIGNAL-TRACES-1.4 renders stacked channels over one time axis with hooks', () => {
    const { container } = render(
      <SignalTraces
        aria-label="Bench"
        className="host"
        data-testid="traces"
        channels={channels}
        domain={[0, 10]}
      />,
    );
    const root = screen.getByRole('group', { name: 'Bench' });
    expect(root).toHaveClass('ui-signal-traces', 'host');
    expect(root).toHaveAttribute('data-testid', 'traces');
    const bands = container.querySelectorAll('.ui-signal-traces__channel');
    expect(Array.from(bands, (band) => band.getAttribute('data-channel'))).toEqual(['0', '1']);
    expect(bands[0]?.querySelector('.ui-signal-traces__label')).toHaveTextContent('Level (V)');
    expect(bands[1]?.querySelector('.ui-signal-traces__label')).toHaveTextContent('Rate');
    expect(container.querySelectorAll('.ui-signal-traces__value-axis.ui-chart-axis')).toHaveLength(
      2,
    );
    expect(container.querySelectorAll('.ui-signal-traces__time-axis.ui-chart-axis')).toHaveLength(
      1,
    );
    const trace = bands[0]?.querySelector('.ui-signal-traces__trace');
    expect(trace?.getAttribute('d')).toMatch(/^M[\d.]+ [\d.]+( L[\d.]+ [\d.]+){10}$/);
    expect(bands[0]?.querySelector('.ui-signal-traces__reference')).toHaveAttribute('fill', 'none');
    expect(bands[0]?.querySelector('.ui-signal-traces__envelope')?.getAttribute('d')).toMatch(/Z$/);
    expect(container.querySelector('.ui-signal-traces__drawing')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expectHooksMatchSpec(container, 'SIGNAL-TRACES', {
      slots: [
        'toolbar',
        'zoom-in',
        'zoom-out',
        'reset',
        'range',
        'plot',
        'drawing',
        'channel',
        'label',
        'unit',
        'value-axis',
        'time-axis',
        'envelope',
        'reference',
        'trace',
        'cursor-line',
        'cursor',
        'readout',
        'delta',
      ],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-SIGNAL-TRACES-1.3 writes the time axis and range with the caller formatter', () => {
    const { container } = render(
      <SignalTraces
        aria-label="Fast"
        channels={[{ id: 'a', label: 'A', samples: ramp(5, 1e-7) }]}
        domain={[0, 4e-7]}
        formatTime={(time) => `${(time * 1e9).toFixed(0)} ns`}
      />,
    );
    const labels = container.querySelectorAll('.ui-signal-traces__time-axis .ui-chart-axis__label');
    expect(Array.from(labels, (label) => label.textContent)).toContain('200 ns');
    expect(rangeText(container)).toBe('0 ns to 400 ns');
    // ARIA numbers take no exponent, so sub-microsecond times are written out in full.
    expect(cursor(2)).toHaveAttribute('aria-valuemax', '0.0000004');
    expect(cursor(2)).toHaveAttribute('aria-valuenow', expect.stringMatching(/^0\.000000\d+$/));
  });

  it('UIC-SIGNAL-TRACES-1.5 draws no data for an empty channel and leaves its readings blank', () => {
    const { container } = render(
      <SignalTraces
        aria-label="Partial"
        channels={[...channels, { id: 'idle', label: 'Idle', samples: [] }]}
        domain={[0, 10]}
      />,
    );
    const empty = container.querySelector('[data-channel="2"]');
    expect(empty).toHaveAttribute('data-empty', 'true');
    expect(empty?.querySelector('.ui-signal-traces__empty')).toHaveTextContent('No data');
    expect(container.querySelector('[data-channel="0"]')).not.toHaveAttribute('data-empty');
    const row = within(readout()).getByRole('row', { name: /Idle/ });
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['', '']);
    expectHooksMatchSpec(container, 'SIGNAL-TRACES', { slots: ['empty'] });
  });

  it('UIC-SIGNAL-TRACES-2.3 pans, zooms and resets from the keyboard and the toolbar', async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    const { container } = render(
      <SignalTraces
        aria-label="Bench"
        channels={channels}
        domain={[0, 10]}
        onRangeChange={onRangeChange}
      />,
    );
    expect(plot()).toHaveAccessibleDescription(/0 to 10.*arrows pan/);
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toBeDisabled();
    plot().focus();
    await user.keyboard('+');
    expect(rangeText(container)).toBe('2.5 to 7.5');
    await user.keyboard('{ArrowRight}');
    expect(rangeText(container)).toBe('3 to 8');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(rangeText(container)).toBe('2 to 7');
    await user.keyboard('-');
    expect(rangeText(container)).toBe('0 to 10');
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(rangeText(container)).toBe('2.5 to 7.5');
    await user.click(screen.getByRole('button', { name: 'Reset zoom' }));
    expect(rangeText(container)).toBe('0 to 10');
    expect(onRangeChange).toHaveBeenLastCalledWith([0, 10]);
    plot().focus();
    await user.keyboard('=0');
    expect(rangeText(container)).toBe('0 to 10');
    await user.keyboard('{Control>}+{/Control}');
    expect(rangeText(container)).toBe('0 to 10');
  });

  it('UIC-SIGNAL-TRACES-2.2 pans by dragging and zooms with the Ctrl wheel, leaving the plain wheel to the page', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SignalTraces
        aria-label="Bench"
        channels={channels}
        domain={[0, 10]}
        defaultRange={[2, 6]}
      />,
    );
    // jsdom measures nothing: the plotted area spans the unmeasured 480 pixels less its gutters.
    await user.pointer([
      { keys: '[MouseLeft>]', target: plot(), coords: { clientX: 300, clientY: 40 } },
      { target: plot(), coords: { clientX: 200, clientY: 40 } },
      { keys: '[/MouseLeft]', target: plot() },
    ]);
    const panned = rangeText(container);
    expect(panned).not.toBe('2 to 6');

    const plain = fireEvent.wheel(plot(), { deltaY: 200 });
    expect(plain).toBe(true);
    expect(rangeText(container)).toBe(panned);

    const zoom = fireEvent.wheel(plot(), { deltaY: 200, ctrlKey: true });
    expect(zoom).toBe(false);
    expect(rangeText(container)).not.toBe(panned);
  });

  it('UIC-SIGNAL-TRACES-2.1 UIC-SIGNAL-TRACES-3.1 reports controlled range and cursor changes', async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    const onCursorsChange = vi.fn();
    const { container } = render(
      <ControlledTraces
        domain={[0, 10]}
        onRangeChange={onRangeChange}
        onCursorsChange={onCursorsChange}
      />,
    );
    expect(rangeText(container)).toBe('2 to 6');
    plot().focus();
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    const near = (from: number, to: number) => [[expect.closeTo(from, 9), expect.closeTo(to, 9)]];
    expect(onRangeChange.mock.calls).toEqual([near(1.6, 5.6), near(1.2, 5.2), near(0.8, 4.8)]);
    expect(cursor(1)).toHaveAttribute('aria-valuenow', '3');
    await user.click(cursor(1));
    await user.keyboard('{ArrowRight}');
    expect(onCursorsChange).toHaveBeenLastCalledWith([3.04, 4.5]);
    await user.keyboard('{End}');
    expect(onCursorsChange).toHaveBeenLastCalledWith([expect.closeTo(4.8, 9), 4.5]);
    await user.keyboard('{PageUp}');
    expect(Number(cursor(1).getAttribute('aria-valuenow'))).toBeCloseTo(5.2, 9);
    expect(cursor(1)).toHaveAttribute('data-outside', 'true');
    expect(container.querySelector('.ui-signal-traces__cursor-line[data-cursor="1"]')).toBeNull();
    expect(
      container.querySelector('.ui-signal-traces__cursor-line[data-cursor="2"]'),
    ).not.toBeNull();
    await user.keyboard('{Home}');
    expect(Number(cursor(1).getAttribute('aria-valuenow'))).toBeCloseTo(0.8, 9);
    expect(cursor(1)).not.toHaveAttribute('data-outside');
    expectHooksMatchSpec(container, 'SIGNAL-TRACES');
  });

  it('UIC-SIGNAL-TRACES-3.2 reads each channel nearest each cursor and the time difference', () => {
    const { container } = render(
      <SignalTraces
        aria-label="Bench"
        channels={channels}
        domain={[0, 10]}
        defaultCursors={[2.4, 7.6]}
        formatValue={(value, channel) => `${String(value)}${channel.unit ?? ''}`}
      />,
    );
    const rows = within(readout()).getAllByRole('row');
    expect(rows.map((row) => row.textContent)).toEqual([
      'ChannelCursor 1Cursor 2',
      'Time2.47.6',
      'Level (V)4V16V',
      'Rate3-3',
    ]);
    expect(container.querySelector('.ui-signal-traces__delta')).toHaveTextContent(
      'Time difference: 5.2',
    );
    expect(cursor(2)).toHaveAttribute('aria-valuetext', '7.6');
  });

  it('UIC-SIGNAL-TRACES-2.4 starts a held range and held cursors again when the data window changes', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <SignalTraces
        aria-label="Bench"
        channels={channels}
        domain={[0, 10]}
        defaultRange={[2, 4]}
      />,
    );
    expect(rangeText(container)).toBe('2 to 4');
    plot().focus();
    await user.keyboard('{ArrowRight}');
    expect(rangeText(container)).toBe('2.2 to 4.2');
    rerender(
      <SignalTraces
        aria-label="Bench"
        channels={channels}
        domain={[30, 60]}
        defaultRange={[2, 4]}
      />,
    );
    expect(rangeText(container)).toBe('30 to 60');
    expect(cursor(1)).toHaveAttribute('aria-valuenow', '40');
    expect(cursor(2)).toHaveAttribute('aria-valuenow', '50');
    rerender(
      <SignalTraces
        aria-label="Bench"
        channels={channels}
        domain={[30, 40]}
        range={[0, 100]}
        cursors={[0, 35]}
      />,
    );
    expect(rangeText(container)).toBe('30 to 40');
    expect(cursor(1)).toHaveAttribute('aria-valuenow', '30');
  });
});
