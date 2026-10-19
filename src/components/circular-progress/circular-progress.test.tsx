import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CircularProgress } from './circular-progress.js';

const fill = (ring: HTMLElement) => ring.querySelector('.ui-circular-progress__fill');

describe('CircularProgress', () => {
  it('UIC-CIRCULAR-PROGRESS-1.1 is a named progressbar with a hidden ring', () => {
    render(<CircularProgress aria-label="Completed 42%" value={42} />);
    const ring = screen.getByRole('progressbar', { name: 'Completed 42%' });
    expect(ring).toHaveAttribute('aria-valuemin', '0');
    expect(ring).toHaveAttribute('aria-valuemax', '100');
    expect(ring).toHaveAttribute('aria-valuenow', '42');
    expect(ring).toHaveAttribute('aria-valuetext', '42%');
    const svg = ring.querySelector('svg');
    expect(svg).toHaveClass('ui-circular-progress__ring');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(document.body, 'CIRCULAR-PROGRESS', { slots: ['ring', 'track', 'fill'] });
  });

  it('UIC-CIRCULAR-PROGRESS-1.1 shows a visible label and value label', () => {
    render(<CircularProgress label="Completed" value={3} maxValue={4} valueLabel="3 of 4" />);
    const ring = screen.getByRole('progressbar', { name: 'Completed' });
    expect(ring).toHaveAttribute('aria-valuetext', '3 of 4');
    expect(ring.querySelector('.ui-circular-progress__label')).toHaveTextContent('Completed');
  });

  it('UIC-CIRCULAR-PROGRESS-1.2 offsets the normalised fill by the remaining percentage', () => {
    const { rerender } = render(<CircularProgress aria-label="Ratio" value={0} />);
    const ring = screen.getByRole('progressbar');
    expect(fill(ring)).toHaveAttribute('pathLength', '100');
    expect(fill(ring)).toHaveAttribute('stroke-dasharray', '100');
    expect(fill(ring)).toHaveAttribute('transform', 'rotate(-90 16 16)');
    for (const [value, offset] of [
      [0, 100],
      [42, 58],
      [100, 0],
    ] as const) {
      rerender(<CircularProgress aria-label="Ratio" value={value} />);
      expect(Number(fill(ring)?.getAttribute('stroke-dashoffset'))).toBeCloseTo(offset, 9);
    }
  });

  it('UIC-CIRCULAR-PROGRESS-1.3 keeps values truthful at every edge', () => {
    const { rerender } = render(<CircularProgress aria-label="Edge" />);
    const ring = screen.getByRole('progressbar');
    for (const [value, expected] of [
      [-1, 0],
      [200, 100],
      [Number.NaN, 0],
      [0.42 * 100, 42],
    ] as const) {
      rerender(<CircularProgress aria-label="Edge" value={value} />);
      expect(Number(ring.getAttribute('aria-valuenow'))).toBeCloseTo(expected, 9);
      expect(Number(fill(ring)?.getAttribute('stroke-dashoffset'))).toBeCloseTo(100 - expected, 9);
    }
    rerender(<CircularProgress aria-label="Edge" value={3} maxValue={0} />);
    expect(ring).toHaveAttribute('aria-valuenow', '0');
    expect(fill(ring)).toHaveAttribute('stroke-dashoffset', '100');
  });

  it('UIC-CIRCULAR-PROGRESS-1.4 draws an unmeasured arc while indeterminate', () => {
    render(<CircularProgress aria-label="Waiting" isIndeterminate showValueLabel />);
    const ring = screen.getByRole('progressbar');
    expect(ring).toHaveAttribute('data-indeterminate', 'true');
    expect(ring).not.toHaveAttribute('aria-valuenow');
    expect(ring).not.toHaveAttribute('aria-valuetext');
    expect(fill(ring)).toHaveAttribute('stroke-dashoffset', '75');
    expect(ring.querySelector('.ui-circular-progress__value')).toBeNull();
    expectHooksMatchSpec(document.body, 'CIRCULAR-PROGRESS');
  });

  it('UIC-CIRCULAR-PROGRESS-1.5 publishes the size and shows value text on request', () => {
    const { rerender } = render(<CircularProgress aria-label="Sized" value={50} />);
    const ring = screen.getByRole('progressbar');
    expect(ring).toHaveAttribute('data-size', 'md');
    expect(ring.querySelector('.ui-circular-progress__value')).toBeNull();
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<CircularProgress aria-label="Sized" value={50} size={size} showValueLabel />);
      expect(ring).toHaveAttribute('data-size', size);
      expect(ring.querySelector('.ui-circular-progress__value')).toHaveTextContent('50%');
      expectHooksMatchSpec(document.body, 'CIRCULAR-PROGRESS', { slots: ['value'] });
    }
  });

  it('UIC-CIRCULAR-PROGRESS-1.6 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <CircularProgress
        aria-label="Probe"
        className="caller"
        id="probe"
        ref={ref}
        data-owner="probe"
      />,
    );
    const ring = screen.getByRole('progressbar', { name: 'Probe' });
    expect(ring).toHaveClass('ui-circular-progress', 'caller');
    expect(ring).toHaveAttribute('data-owner', 'probe');
    expect(ring).toHaveAttribute('id', 'probe');
    expect(ref.current).toBe(ring);
    expectHooksMatchSpec(document.body, 'CIRCULAR-PROGRESS', { callerAttributes: ['data-owner'] });
  });

  it('UIC-CIRCULAR-PROGRESS-1.7 publishes completion and the tone', () => {
    const { container, rerender } = render(
      <CircularProgress aria-label="Synced" value={3} maxValue={5} />,
    );
    const ring = screen.getByRole('progressbar');
    expect(ring).toHaveAttribute('data-tone', 'neutral');
    expect(ring).not.toHaveAttribute('data-complete');
    rerender(<CircularProgress aria-label="Synced" value={5} maxValue={5} tone="success" />);
    expect(ring).toHaveAttribute('data-complete', 'true');
    expect(ring).toHaveAttribute('data-tone', 'success');
    rerender(<CircularProgress aria-label="Synced" isIndeterminate tone="danger" />);
    expect(ring).not.toHaveAttribute('data-complete');
    expect(ring).toHaveAttribute('data-tone', 'danger');
    expectHooksMatchSpec(container, 'CIRCULAR-PROGRESS', { slots: ['ring', 'track', 'fill'] });
  });
});
