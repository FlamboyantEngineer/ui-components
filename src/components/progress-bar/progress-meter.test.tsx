import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ProgressBar, resolveMeterTone } from './progress-bar.js';

const fill = (meter: HTMLElement) => meter.querySelector<HTMLElement>('.ui-progress-bar__fill');
const valueText = (meter: HTMLElement) => meter.querySelector('.ui-progress-bar__value');

describe('ProgressBar', () => {
  it('UIC-PROGRESS-BAR-21.1 UIC-PROGRESS-BAR-22.1 is a meter named by its visible label', () => {
    render(<ProgressBar mode="meter" label="Storage" value={30} />);
    const meter = screen.getByRole('meter', { name: 'Storage' });
    expect(meter).toHaveClass('ui-progress-bar');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuenow', '30');
    expect(meter).toHaveAttribute('aria-valuetext', '30%');
    expect(meter.querySelector('.ui-progress-bar__label')).toHaveTextContent('Storage');
    expect(meter.querySelector('.ui-progress-bar__track > .ui-progress-bar__fill')).not.toBeNull();
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR', {
      slots: ['label', 'value', 'track', 'fill'],
    });
  });

  it('UIC-PROGRESS-BAR-22.1 can be named without a visible label', () => {
    render(<ProgressBar mode="meter" aria-label="Battery" value={80} />);
    const meter = screen.getByRole('meter', { name: 'Battery' });
    expect(meter.querySelector('.ui-progress-bar__label')).toBeNull();
  });

  it('UIC-PROGRESS-BAR-21.2 fills to the percentage and can hide the value text', () => {
    const { rerender } = render(
      <ProgressBar mode="meter" aria-label="Battery" value={1} maxValue={4} />,
    );
    const meter = screen.getByRole('meter');
    expect(fill(meter)?.style.width).toBe('25%');
    expect(valueText(meter)).toHaveTextContent('25%');
    rerender(
      <ProgressBar
        mode="meter"
        aria-label="Battery"
        value={1}
        maxValue={4}
        showValueLabel={false}
      />,
    );
    expect(valueText(meter)).toBeNull();
    expect(meter).toHaveAttribute('aria-valuetext', '25%');
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR', { slots: ['track', 'fill'] });
  });

  it('UIC-PROGRESS-BAR-21.3 words the value with format options or a value label', () => {
    const { rerender } = render(
      <ProgressBar
        mode="meter"
        aria-label="Storage"
        value={40}
        maxValue={128}
        formatOptions={{ style: 'unit', unit: 'gigabyte' }}
      />,
    );
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuetext', '40 GB');
    expect(valueText(meter)).toHaveTextContent('40 GB');
    rerender(
      <ProgressBar
        mode="meter"
        aria-label="Storage"
        value={40}
        maxValue={128}
        valueLabel="40 of 128 GB"
      />,
    );
    expect(meter).toHaveAttribute('aria-valuetext', '40 of 128 GB');
    expect(valueText(meter)).toHaveTextContent('40 of 128 GB');
  });

  it('UIC-PROGRESS-BAR-21.4 keeps values truthful at the edges', () => {
    const cases = [
      { value: 7, maxValue: 3, now: '3', max: '3', width: '100%' },
      { value: -1, maxValue: 3, now: '0', max: '3', width: '0%' },
      { value: Number.NaN, maxValue: 3, now: '0', max: '3', width: '0%' },
      { value: 5, maxValue: 0, now: '0', max: '0', width: '0%' },
      { value: 5, maxValue: Number.POSITIVE_INFINITY, now: '0', max: '0', width: '0%' },
    ];
    const { rerender } = render(<ProgressBar mode="meter" aria-label="Level" />);
    const meter = screen.getByRole('meter');
    for (const { value, maxValue, now, max, width } of cases) {
      rerender(<ProgressBar mode="meter" aria-label="Level" value={value} maxValue={maxValue} />);
      expect(meter).toHaveAttribute('aria-valuenow', now);
      expect(meter).toHaveAttribute('aria-valuemax', max);
      expect(fill(meter)?.style.width).toBe(width);
    }
  });

  it('UIC-PROGRESS-BAR-21.5 publishes the size, medium by default', () => {
    const { rerender } = render(<ProgressBar mode="meter" aria-label="Sized" value={10} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<ProgressBar mode="meter" aria-label="Sized" value={10} size={size} />);
      expect(meter).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(document.body, 'PROGRESS-BAR');
    }
  });

  it('UIC-PROGRESS-BAR-21.6 publishes the tone, neutral by default and over any threshold', () => {
    const { rerender } = render(<ProgressBar mode="meter" aria-label="Score" value={50} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('data-tone', 'neutral');
    for (const tone of ['neutral', 'success', 'warning', 'danger'] as const) {
      rerender(
        <ProgressBar
          mode="meter"
          aria-label="Score"
          value={50}
          tone={tone}
          high={20}
          optimum={0}
        />,
      );
      expect(meter).toHaveAttribute('data-tone', tone);
      expectHooksMatchSpec(document.body, 'PROGRESS-BAR');
    }
  });

  it('UIC-PROGRESS-BAR-21.7 judges the value by the regions of its thresholds', () => {
    const { rerender } = render(
      <ProgressBar mode="meter" aria-label="Disk" value={30} low={60} high={85} optimum={0} />,
    );
    const meter = screen.getByRole('meter');
    const toneAt = (
      value: number,
      thresholds: { low?: number; high?: number; optimum?: number },
    ) => {
      rerender(<ProgressBar mode="meter" aria-label="Disk" value={value} {...thresholds} />);
      return meter.getAttribute('data-tone');
    };
    const lowIsBest = { low: 60, high: 85, optimum: 0 };
    expect([30, 60, 85, 90].map((value) => toneAt(value, lowIsBest))).toEqual([
      'success',
      'warning',
      'warning',
      'danger',
    ]);
    const highIsBest = { low: 20, high: 50, optimum: 100 };
    expect([10, 30, 80].map((value) => toneAt(value, highIsBest))).toEqual([
      'danger',
      'warning',
      'success',
    ]);
    const middleIsBest = { low: 18, high: 24, optimum: 21 };
    expect([10, 21, 30].map((value) => toneAt(value, middleIsBest))).toEqual([
      'warning',
      'success',
      'warning',
    ]);
    expect(toneAt(10, { high: 80 })).toBe('success');
    expect(toneAt(90, { high: 80 })).toBe('warning');
  });

  it('UIC-PROGRESS-BAR-21.7 bounds thresholds to the range', () => {
    const range = { value: 50, minValue: 0, maxValue: 100 };
    expect(resolveMeterTone(range, {})).toBeUndefined();
    expect(resolveMeterTone(range, { low: -20, high: 400, optimum: 50 })).toBe('success');
    expect(resolveMeterTone(range, { low: 70, high: 30, optimum: 100 })).toBe('danger');
    expect(resolveMeterTone({ ...range, value: 70 }, { low: 70, high: 30, optimum: 100 })).toBe(
      'warning',
    );
    expect(resolveMeterTone({ ...range, value: 0 }, { optimum: -50 })).toBe('success');
  });

  it('UIC-PROGRESS-BAR-21.8 appends the caller class and forwards id, ref, data attributes and render', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <ProgressBar
        mode="meter"
        aria-label="Probe"
        className="caller"
        id="probe"
        ref={ref}
        data-probe="meter"
        data-tone="caller"
        value={25}
        render={(props, state) => <section {...props} data-share={state.percentage} />}
      />,
    );
    const meter = screen.getByRole('meter', { name: 'Probe' });
    expect(meter).toHaveAttribute('data-probe', 'meter');
    expect(meter.tagName).toBe('SECTION');
    expect(meter).toHaveAttribute('data-share', '25');
    expect(meter).toHaveClass('ui-progress-bar', 'caller');
    expect(meter).toHaveAttribute('id', 'probe');
    expect(meter).toHaveAttribute('data-tone', 'neutral');
    expect(ref.current).toBe(meter);
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR', {
      callerAttributes: ['data-share', 'data-probe'],
    });
  });

  it('UIC-PROGRESS-BAR-22.2 takes no tab stop', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ProgressBar mode="meter" label="Storage" value={30} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(screen.getByRole('meter')).not.toHaveAttribute('tabindex');
  });
});
