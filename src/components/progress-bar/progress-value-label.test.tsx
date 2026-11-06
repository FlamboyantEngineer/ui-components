import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoadingCard } from '../loading-overlay/loading-overlay.js';
import { Meter, ProgressBar, type ProgressBarProps } from './progress-bar.js';

// The value text is plain text, read as it shows (UIC-PROGRESS-BAR-1.4).

const presentations: Array<[string, Partial<ProgressBarProps>]> = [
  ['linear', {}],
  ['circular', { shape: 'circular', showValueLabel: true }],
  ['segmented', { segments: [{ id: 1, label: 'Plan', state: 'complete' }] }],
];

describe('ProgressBar value label', () => {
  it.each(presentations)(
    'UIC-PROGRESS-BAR-1.4 shows and reads a %s value label as the same plain text',
    (_, props) => {
      const { container } = render(
        <ProgressBar label="Upload" value={40} valueLabel="4 of 10 files" {...props} />,
      );
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuetext', '4 of 10 files');
      expect(container.querySelector('.ui-progress-bar__value')).toHaveTextContent(
        /^4 of 10 files$/,
      );
    },
  );

  it('UIC-PROGRESS-BAR-21.3 shows and reads a meter value label as the same plain text', () => {
    const { container } = render(<Meter label="Storage" value={40} valueLabel="40 of 100 GB" />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '40 of 100 GB');
    expect(container.querySelector('.ui-meter__value')).toHaveTextContent(/^40 of 100 GB$/);
  });

  it.each(['', '   '])(
    'UIC-PROGRESS-BAR-1.4 keeps the formatted value for a blank value label %j',
    (blank) => {
      render(<ProgressBar label="Upload" value={40} valueLabel={blank} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '40%');
    },
  );

  it('UIC-PROGRESS-BAR-1.4 hands a render callback the value text as a string', () => {
    const renderRoot = vi.fn((props: object) => <div {...props} />);
    render(<ProgressBar aria-label="Upload" value={40} valueLabel="Almost" render={renderRoot} />);
    expect(renderRoot).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ valueText: 'Almost', percentage: 40 }),
    );
  });

  it('UIC-PROGRESS-BAR-1.4 accepts only plain text and keeps the formatted value otherwise', () => {
    // @ts-expect-error A value label is plain text, never an element.
    render(<ProgressBar aria-label="Upload" value={40} valueLabel={<strong>4 files</strong>} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuetext', '40%');
    expect(bar.querySelector('.ui-progress-bar__value')).toHaveTextContent(/^40%$/);
  });

  it('UIC-LOADING-OVERLAY-1.2 reads the card progress value label as plain text', () => {
    render(
      <LoadingCard label="Importing" progress={{ value: 3, maxValue: 4, valueLabel: '3 of 4' }} />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 4');
  });
});
