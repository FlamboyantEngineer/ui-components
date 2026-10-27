import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { ProgressBar } from './progress-bar.js';
import type { ProgressSegment, ProgressSegmentState } from './progress-segments.js';

const stageNames = ['Setup', 'Draft', 'Review', 'Revise', 'Test', 'Publish', 'Archive'];

/** Seven stages: the given states first, the rest pending. */
function stages(...states: ProgressSegmentState[]): ProgressSegment[] {
  return stageNames.map((label, index) => ({
    id: label.toLowerCase(),
    label,
    state: states[index] ?? 'pending',
  }));
}

const drawnStates = (bar: HTMLElement) =>
  [...bar.querySelectorAll('.ui-progress-bar__segment')].map((segment) =>
    segment.getAttribute('data-state'),
  );
const valueText = (bar: HTMLElement) => bar.querySelector('.ui-progress-bar__value');

describe('ProgressBar segments', () => {
  it('UIC-PROGRESS-BAR-4.1 draws one segment per unit inside a single progressbar', () => {
    render(<ProgressBar label="Stages" segments={stages('complete', 'current')} />);
    const bar = screen.getByRole('progressbar', { name: 'Stages' });
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(bar).toHaveAttribute('data-segmented', 'true');
    expect(bar).toHaveAttribute('data-shape', 'linear');
    expect(bar.querySelector('.ui-progress-bar__fill')).toBeNull();
    expect(drawnStates(bar)).toEqual([
      'complete',
      'current',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
    ]);
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR', {
      slots: ['label', 'value', 'track', 'segment'],
    });
  });

  it('UIC-PROGRESS-BAR-4.2 counts only completed units, not the current one', () => {
    render(<ProgressBar label="Stages" segments={stages('complete', 'current')} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '7');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(valueText(bar)).toHaveTextContent('1/7 · 14%');
  });

  it('UIC-PROGRESS-BAR-4.3 names the current unit in the spoken value', () => {
    const { rerender } = render(
      <ProgressBar label="Stages" segments={stages('complete', 'current')} />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuetext', '1 of 7 done, 14%, Draft in progress');
    rerender(<ProgressBar label="Stages" segments={stages('complete', 'complete', 'current')} />);
    expect(bar).toHaveAttribute('aria-valuetext', '2 of 7 done, 29%, Review in progress');
    expect(drawnStates(bar).slice(0, 3)).toEqual(['complete', 'complete', 'current']);
  });

  it('UIC-PROGRESS-BAR-4.4 reads aggregate progress without a current unit', () => {
    render(<ProgressBar label="Stages" segments={stages('complete', 'complete', 'complete')} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuetext', '3 of 7 done, 43%');
    expect(drawnStates(bar)).not.toContain('current');
  });

  it('UIC-PROGRESS-BAR-4.5 handles empty, untouched and finished sequences', () => {
    const { rerender } = render(<ProgressBar label="Stages" segments={[]} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '0');
    expect(bar).toHaveAttribute('aria-valuetext', '0 of 0 done, 0%');
    expect(bar).not.toHaveAttribute('data-complete');
    expect(drawnStates(bar)).toEqual([]);

    rerender(<ProgressBar label="Stages" segments={stages()} />);
    expect(bar).toHaveAttribute('aria-valuetext', '0 of 7 done, 0%');
    expect(bar).not.toHaveAttribute('data-complete');

    const done = stageNames.map(() => 'complete' as const);
    rerender(<ProgressBar label="Stages" segments={stages(...done)} />);
    expect(bar).toHaveAttribute('aria-valuetext', '7 of 7 done, 100%');
    expect(bar).toHaveAttribute('data-complete', 'true');
  });

  it('UIC-PROGRESS-BAR-4.6 ignores range props and draws later current units as pending', () => {
    render(
      <ProgressBar
        label="Stages"
        segments={stages('current', 'complete', 'current', 'unknown' as ProgressSegmentState)}
        value={90}
        minValue={-5}
        maxValue={10}
        shape="circular"
        mode="meter"
        isIndeterminate
        formatOptions={{ style: 'decimal' }}
      />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '7');
    expect(bar).toHaveAttribute('data-shape', 'linear');
    expect(bar).not.toHaveAttribute('data-indeterminate');
    expect(bar).toHaveAttribute('aria-valuetext', '1 of 7 done, 14%, Setup in progress');
    expect(drawnStates(bar).slice(0, 4)).toEqual(['current', 'complete', 'pending', 'pending']);
    expect(valueText(bar)).toHaveTextContent('1/7 · 14%');
  });

  it('UIC-PROGRESS-BAR-4.7 lets valueLabel and the provider replace the value text', () => {
    const { rerender } = render(
      <ProgressBar label="Stages" segments={stages('complete')} valueLabel="Stage 2 of 7" />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuetext', 'Stage 2 of 7');
    expect(valueText(bar)).toHaveTextContent('Stage 2 of 7');
    rerender(<ProgressBar label="Stages" segments={stages('complete')} showValueLabel={false} />);
    expect(valueText(bar)).toBeNull();
    expect(bar).toHaveAttribute('aria-valuetext', '1 of 7 done, 14%');
    rerender(
      <UiProvider
        locale="de-DE"
        messages={{
          segmentCount: '{completed} von {total}',
          segmentProgress:
            '{completed} von {total} fertig ({percent}), jetzt {hasCurrent, select, true {{current}} other {-}}',
        }}
      >
        <ProgressBar label="Stages" segments={stages('complete', 'current')} />
      </UiProvider>,
    );
    const localized = screen.getByRole('progressbar');
    expect(localized).toHaveAttribute('aria-valuetext', '1 von 7 fertig (14\u00a0%), jetzt Draft');
    expect(valueText(localized)).toHaveTextContent('1 von 7');
  });

  it('UIC-PROGRESS-BAR-4.8 keeps size, tone and caller attributes', () => {
    render(
      <ProgressBar
        aria-label="Stages"
        segments={stages('complete')}
        size="sm"
        tone="danger"
        className="caller"
        data-sample="probe"
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Stages' });
    expect(bar).toHaveAttribute('data-size', 'sm');
    expect(bar).toHaveAttribute('data-tone', 'danger');
    expect(bar).toHaveClass('ui-progress-bar', 'caller');
    expectHooksMatchSpec(document.body, 'PROGRESS-BAR', { callerAttributes: ['data-sample'] });
  });

  it('UIC-PROGRESS-BAR-4.9 keeps each segment element by its id', () => {
    const units: ProgressSegment[] = [
      { id: 1, label: 'Numbered', state: 'complete' },
      { id: '1', label: 'Named', state: 'pending' },
    ];
    const { rerender } = render(<ProgressBar aria-label="Units" segments={units} />);
    const bar = screen.getByRole('progressbar');
    const named = bar.querySelectorAll('.ui-progress-bar__segment')[1];
    rerender(<ProgressBar aria-label="Units" segments={units.slice(1)} />);
    expect(bar.querySelector('.ui-progress-bar__segment')).toBe(named);
  });
});
