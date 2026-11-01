import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ProgressBar } from './progress-bar.js';

const fill = (ring: HTMLElement) => ring.querySelector('.ui-progress-bar__fill');

describe('ProgressBar', () => {
  it('UIC-PROGRESS-BAR-11.1 is a named progressbar with a hidden ring', () => {
    render(<ProgressBar shape="circular" aria-label="Completed 42%" value={42} />);
    const ring = screen.getByRole('progressbar', { name: 'Completed 42%' });
    expect(ring).toHaveAttribute('aria-valuemin', '0');
    expect(ring).toHaveAttribute('aria-valuemax', '100');
    expect(ring).toHaveAttribute('aria-valuenow', '42');
    expect(ring).toHaveAttribute('aria-valuetext', '42%');
    const svg = ring.querySelector('svg');
    expect(svg).toHaveClass('ui-progress-bar__ring');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR', { slots: ['ring', 'track', 'fill'] });
  });

  it('UIC-PROGRESS-BAR-11.1 shows a visible label and value label', () => {
    render(
      <ProgressBar shape="circular" label="Completed" value={3} maxValue={4} valueLabel="3 of 4" />,
    );
    const ring = screen.getByRole('progressbar', { name: 'Completed' });
    expect(ring).toHaveAttribute('aria-valuetext', '3 of 4');
    expect(ring.querySelector('.ui-progress-bar__label')).toHaveTextContent('Completed');
  });

  it('UIC-PROGRESS-BAR-11.2 offsets the normalised fill by the remaining percentage', () => {
    const { rerender } = render(<ProgressBar shape="circular" aria-label="Ratio" value={0} />);
    const ring = screen.getByRole('progressbar');
    expect(fill(ring)).toHaveAttribute('pathLength', '100');
    expect(fill(ring)).toHaveAttribute('stroke-dasharray', '100');
    expect(fill(ring)).toHaveAttribute('transform', 'rotate(-90 16 16)');
    for (const [value, offset] of [
      [0, 100],
      [42, 58],
      [99.9, 0.1],
    ] as const) {
      rerender(<ProgressBar shape="circular" aria-label="Ratio" value={value} />);
      expect(Number(fill(ring)?.getAttribute('stroke-dashoffset'))).toBeCloseTo(offset, 9);
    }
    // A full ring is one closed stroke: a dash ending where it starts would leave a seam.
    rerender(<ProgressBar shape="circular" aria-label="Ratio" value={100} />);
    expect(fill(ring)).not.toHaveAttribute('stroke-dasharray');
    expect(fill(ring)).not.toHaveAttribute('stroke-dashoffset');
  });

  it('UIC-PROGRESS-BAR-11.3 keeps values truthful at every edge', () => {
    const { rerender } = render(<ProgressBar shape="circular" aria-label="Edge" />);
    const ring = screen.getByRole('progressbar');
    for (const [value, expected] of [
      [-1, 0],
      [200, 100],
      [Number.NaN, 0],
      [0.42 * 100, 42],
    ] as const) {
      rerender(<ProgressBar shape="circular" aria-label="Edge" value={value} />);
      expect(Number(ring.getAttribute('aria-valuenow'))).toBeCloseTo(expected, 9);
      expect(Number(fill(ring)?.getAttribute('stroke-dashoffset'))).toBeCloseTo(100 - expected, 9);
    }
    rerender(<ProgressBar shape="circular" aria-label="Edge" value={3} maxValue={0} />);
    expect(ring).toHaveAttribute('aria-valuenow', '0');
    expect(fill(ring)).toHaveAttribute('stroke-dashoffset', '100');
  });

  it('UIC-PROGRESS-BAR-11.4 draws an unmeasured arc while indeterminate', () => {
    render(<ProgressBar shape="circular" aria-label="Waiting" isIndeterminate showValueLabel />);
    const ring = screen.getByRole('progressbar');
    expect(ring).toHaveAttribute('data-indeterminate', 'true');
    expect(ring).not.toHaveAttribute('aria-valuenow');
    expect(ring).not.toHaveAttribute('aria-valuetext');
    expect(fill(ring)).toHaveAttribute('stroke-dashoffset', '75');
    expect(ring.querySelector('.ui-progress-bar__value')).toBeNull();
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR');
  });

  it('UIC-PROGRESS-BAR-11.5 publishes the size and shows value text on request', () => {
    const { rerender } = render(<ProgressBar shape="circular" aria-label="Sized" value={50} />);
    const ring = screen.getByRole('progressbar');
    expect(ring).toHaveAttribute('data-size', 'md');
    expect(ring.querySelector('.ui-progress-bar__value')).toBeNull();
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(
        <ProgressBar shape="circular" aria-label="Sized" value={50} size={size} showValueLabel />,
      );
      expect(ring).toHaveAttribute('data-size', size);
      expect(ring.querySelector('.ui-progress-bar__value')).toHaveTextContent('50%');
      expectHooksMatchSpec(document.body, 'PROGRESS-BAR', { slots: ['value'] });
    }
  });

  it('UIC-PROGRESS-BAR-11.6 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <ProgressBar
        shape="circular"
        aria-label="Probe"
        className="caller"
        id="probe"
        ref={ref}
        data-owner="probe"
      />,
    );
    const ring = screen.getByRole('progressbar', { name: 'Probe' });
    expect(ring).toHaveClass('ui-progress-bar', 'caller');
    expect(ring).toHaveAttribute('data-owner', 'probe');
    expect(ring).toHaveAttribute('id', 'probe');
    expect(ref.current).toBe(ring);
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR', { callerAttributes: ['data-owner'] });
  });

  it('UIC-PROGRESS-BAR-11.7 publishes completion and the tone', () => {
    const { container, rerender } = render(
      <ProgressBar shape="circular" aria-label="Synced" value={3} maxValue={5} />,
    );
    const ring = screen.getByRole('progressbar');
    expect(ring).toHaveAttribute('data-tone', 'neutral');
    expect(ring).not.toHaveAttribute('data-complete');
    rerender(
      <ProgressBar shape="circular" aria-label="Synced" value={5} maxValue={5} tone="success" />,
    );
    expect(ring).toHaveAttribute('data-complete', 'true');
    expect(ring).toHaveAttribute('data-tone', 'success');
    rerender(<ProgressBar shape="circular" aria-label="Synced" isIndeterminate tone="danger" />);
    expect(ring).not.toHaveAttribute('data-complete');
    expect(ring).toHaveAttribute('data-tone', 'danger');
    expectHooksMatchSpec(container, 'PROGRESS-BAR', { slots: ['ring', 'track', 'fill'] });
  });
});
