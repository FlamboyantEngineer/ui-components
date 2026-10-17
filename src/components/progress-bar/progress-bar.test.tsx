import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ProgressBar, Spinner } from './progress-bar.js';

const fill = (bar: HTMLElement) => bar.querySelector<HTMLElement>('.ui-progress-bar__fill');
const valueText = (bar: HTMLElement) => bar.querySelector('.ui-progress-bar__value');

describe('ProgressBar', () => {
  it('UIC-PROGRESS-BAR-1.1 is a progressbar named by its visible label', () => {
    render(<ProgressBar label="Uploading" value={30} />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuetext', '30%');
    expect(bar.querySelector('.ui-progress-bar__label')).toHaveTextContent('Uploading');
    expect(bar.querySelector('.ui-progress-bar__track > .ui-progress-bar__fill')).not.toBeNull();
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR', {
      slots: ['label', 'value', 'track', 'fill'],
    });
  });

  it('UIC-PROGRESS-BAR-1.1 can be named without a visible label', () => {
    render(<ProgressBar aria-label="Completed" value={1} maxValue={4} />);
    const bar = screen.getByRole('progressbar', { name: 'Completed' });
    expect(bar.querySelector('.ui-progress-bar__label')).toBeNull();
  });

  it('UIC-PROGRESS-BAR-1.2 fills to the percentage and shows the value text', () => {
    const { rerender } = render(<ProgressBar aria-label="Copying" value={1} maxValue={4} />);
    const bar = screen.getByRole('progressbar');
    expect(fill(bar)?.style.width).toBe('25%');
    expect(valueText(bar)).toHaveTextContent('25%');
    rerender(<ProgressBar aria-label="Copying" value={1} maxValue={4} showValueLabel={false} />);
    expect(valueText(bar)).toBeNull();
    expect(bar).toHaveAttribute('aria-valuetext', '25%');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
  });

  it('UIC-PROGRESS-BAR-1.3 claims no level while indeterminate', () => {
    render(<ProgressBar aria-label="Syncing" value={42} isIndeterminate valueLabel="42 of 100" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('data-indeterminate', 'true');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).not.toHaveAttribute('aria-valuetext');
    expect(valueText(bar)).toBeNull();
    expect(fill(bar)?.style.width).toBe('');
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR', { slots: ['track', 'fill'] });
  });

  it('UIC-PROGRESS-BAR-1.4 words the value with valueLabel or format options', () => {
    const { rerender } = render(
      <ProgressBar aria-label="Completed" value={2} maxValue={3} valueLabel="2/3" />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuetext', '2/3');
    expect(valueText(bar)).toHaveTextContent('2/3');
    rerender(
      <ProgressBar
        aria-label="Completed"
        value={2}
        maxValue={3}
        formatOptions={{ style: 'decimal' }}
      />,
    );
    expect(bar).toHaveAttribute('aria-valuetext', '2');
  });

  it('UIC-PROGRESS-BAR-1.5 keeps values truthful at the edges', () => {
    const cases = [
      { value: 2, maxValue: 3, now: '2', max: '3', width: `${(2 / 3) * 100}%`, text: '67%' },
      { value: 0, maxValue: 0, now: '0', max: '0', width: '0%', text: '0%' },
      { value: 7, maxValue: 3, now: '3', max: '3', width: '100%', text: '100%' },
      { value: -1, maxValue: 3, now: '0', max: '3', width: '0%', text: '0%' },
      { value: Number.NaN, maxValue: 3, now: '0', max: '3', width: '0%', text: '0%' },
      { value: 5, maxValue: Number.POSITIVE_INFINITY, now: '0', max: '0', width: '0%', text: '0%' },
      { value: 5, maxValue: -10, now: '0', max: '0', width: '0%', text: '0%' },
    ];
    const { rerender } = render(<ProgressBar aria-label="Counted" />);
    const bar = screen.getByRole('progressbar');
    for (const { value, maxValue, now, max, width, text } of cases) {
      rerender(<ProgressBar aria-label="Counted" value={value} maxValue={maxValue} />);
      expect(bar).toHaveAttribute('aria-valuenow', now);
      expect(bar).toHaveAttribute('aria-valuemax', max);
      expect(fill(bar)?.style.width).toBe(width);
      expect(bar).toHaveAttribute('aria-valuetext', text);
    }
  });

  it('UIC-PROGRESS-BAR-1.6 publishes the size, medium by default', () => {
    const { rerender } = render(<ProgressBar aria-label="Sized" value={10} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<ProgressBar aria-label="Sized" value={10} size={size} />);
      expect(bar).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(document.body, 'PROGRESS-BAR');
    }
  });

  it('UIC-PROGRESS-BAR-1.7 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <ProgressBar
        aria-label="Probe"
        className="caller"
        id="probe"
        ref={ref}
        data-testid="probe"
        data-size="caller"
      />,
    );
    const bar = screen.getByTestId('probe');
    expect(bar).toHaveClass('ui-progress-bar', 'caller');
    expect(bar).toHaveAttribute('id', 'probe');
    expect(bar).toHaveAttribute('data-size', 'md');
    expect(ref.current).toBe(bar);
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR');
  });
});

describe('Spinner', () => {
  it('UIC-PROGRESS-BAR-2.1 is a decorative, sized busy glyph', () => {
    const { container, rerender } = render(<Spinner />);
    const spinner = container.firstElementChild as HTMLElement;
    expect(spinner).toHaveClass('ui-spinner');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(spinner).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<Spinner size={size} className="caller" id="busy" data-testid="busy" />);
      expect(screen.getByTestId('busy')).toHaveAttribute('data-size', size);
    }
    expect(spinner).toHaveClass('ui-spinner', 'caller');
    expect(spinner).toHaveAttribute('id', 'busy');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expectHooksMatchSpec(container, 'PROGRESS-BAR');
  });

  it('UIC-PROGRESS-BAR-1.8 publishes completion and the tone', () => {
    const { container, rerender } = render(<ProgressBar aria-label="Copying" value={40} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('data-tone', 'neutral');
    expect(bar).not.toHaveAttribute('data-complete');
    rerender(<ProgressBar aria-label="Copying" value={4} maxValue={4} tone="success" />);
    expect(bar).toHaveAttribute('data-complete', 'true');
    expect(bar).toHaveAttribute('data-tone', 'success');
    rerender(<ProgressBar aria-label="Copying" value={140} tone="danger" />);
    expect(bar).toHaveAttribute('data-complete', 'true');
    expect(bar).toHaveAttribute('data-tone', 'danger');
    rerender(<ProgressBar aria-label="Copying" value={0} maxValue={0} />);
    expect(bar).not.toHaveAttribute('data-complete');
    rerender(<ProgressBar aria-label="Copying" value={100} isIndeterminate tone="warning" />);
    expect(bar).not.toHaveAttribute('data-complete');
    expect(bar).toHaveAttribute('data-tone', 'warning');
    expectHooksMatchSpec(container, 'PROGRESS-BAR', { slots: ['track', 'fill'] });
  });

  it('UIC-PROGRESS-BAR-2.2 names a standalone spinner as an indeterminate progress bar', () => {
    const { container, rerender } = render(<Spinner label="Loading recipes" size="lg" />);
    const spinner = screen.getByRole('progressbar', { name: 'Loading recipes' });
    expect(spinner.tagName).toBe('SPAN');
    expect(spinner).toHaveClass('ui-spinner');
    expect(spinner).toHaveAttribute('data-size', 'lg');
    expect(spinner).not.toHaveAttribute('aria-hidden');
    expect(spinner).not.toHaveAttribute('aria-valuenow');
    expect(spinner).toBeEmptyDOMElement();
    expectHooksMatchSpec(container, 'PROGRESS-BAR');

    rerender(<Spinner label="" />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(container.querySelector('.ui-spinner')).toHaveAttribute('aria-hidden', 'true');
  });
});
