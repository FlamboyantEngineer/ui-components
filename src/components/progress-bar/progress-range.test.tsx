import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingCard } from '../loading-overlay/loading-overlay.js';
import { ProgressBar, resolveProgressRange, toProgressRatio } from './progress-bar.js';

// Shares of the widest finite ranges never overflow (UIC-PROGRESS-BAR-1.5).

const max = Number.MAX_VALUE;
const ratio = (value: number, minValue: number, maxValue: number) =>
  toProgressRatio(resolveProgressRange({ value, minValue, maxValue }));

describe('Progress range shares', () => {
  it.each([
    [0, -max, max, 0.5],
    [-max, -max, max, 0],
    [max, -max, max, 1],
    [max / 2, -max, max, 0.75],
    [max * 0.75, max / 2, max, 0.5],
    [-max * 0.75, -max, -max / 2, 0.5],
    [5, 5, 5, 0],
    [25, -100, 100, 0.625],
  ])(
    'UIC-PROGRESS-BAR-1.5 puts %d of %d to %d at a share of %d',
    (value, minValue, maxValue, expected) => {
      expect(ratio(value, minValue, maxValue)).toBeCloseTo(expected, 12);
    },
  );

  it.each([
    [0, '50%', '50%'],
    [max, '100%', '100%'],
    [-max, '0%', '0%'],
  ])('UIC-PROGRESS-BAR-1.5 fills and words %d of the widest range alike', (value, text, width) => {
    const { container } = render(
      <ProgressBar label="Range" value={value} minValue={-max} maxValue={max} />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', text);
    expect(container.querySelector('.ui-progress-bar__value')).toHaveTextContent(text);
    expect(container.querySelector<HTMLElement>('.ui-progress-bar__fill')?.style.width).toBe(width);
  });

  it('UIC-PROGRESS-BAR-1.5 keeps a value format on the widest range', () => {
    render(
      <ProgressBar
        label="Range"
        value={0}
        minValue={-max}
        maxValue={max}
        formatOptions={{ style: 'decimal' }}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '0');
  });

  it('UIC-LOADING-OVERLAY-1.2 shows the same share in the card header and its bar', () => {
    const { container } = render(
      <LoadingCard label="Range" progress={{ minValue: -max, maxValue: max, value: 0 }} />,
    );
    expect(container.querySelector('.ui-loading-card__value')).toHaveTextContent('50%');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '50%');
  });
});
