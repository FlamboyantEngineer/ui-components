import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SegmentedBar, type SegmentedBarSegment } from './segmented-bar.js';

const results: SegmentedBarSegment[] = [
  { id: 'passed', label: 'Passed', value: 12, tone: 'success' },
  { id: 'failed', label: 'Failed', value: 3, tone: 'danger' },
  { id: 'skipped', label: 'Skipped', value: 5 },
];

const widths = (bar: HTMLElement) =>
  [...bar.querySelectorAll<HTMLElement>('.ui-segmented-bar__segment')].map(
    (segment) => segment.style.width,
  );

const entries = (bar: HTMLElement) =>
  within(bar)
    .getAllByRole('listitem', { hidden: true })
    .map((item) => item.textContent);

describe('SegmentedBar', () => {
  it('UIC-SEGMENTED-BAR-1.1 falls back to aria-label for an empty label and draws a zero one', () => {
    const { container, rerender } = render(
      <SegmentedBar label={false} aria-label="Checks" segments={results} />,
    );
    expect(screen.getByRole('group', { name: 'Checks' })).toBeInTheDocument();
    expect(container.querySelector('.ui-segmented-bar__label')).toBeNull();
    rerender(<SegmentedBar label={0} segments={results} />);
    expect(screen.getByRole('group', { name: '0' })).toBeInTheDocument();
  });

  it('UIC-SEGMENTED-BAR-1.1 keeps numeric and text IDs distinct when a segment is removed', () => {
    const entries = [
      { id: 1, label: 'Numeric segment', value: 1 },
      { id: '1', label: 'Text segment', value: 1 },
    ];
    const { rerender } = render(<SegmentedBar segments={entries} showLegend aria-label="Parts" />);
    const textSegment = screen.getByText('Text segment');
    rerender(<SegmentedBar segments={entries.slice(1)} showLegend aria-label="Parts" />);
    expect(screen.getByText('Text segment')).toBe(textSegment);
    expect(screen.queryByText('Numeric segment')).not.toBeInTheDocument();
  });

  it('UIC-SEGMENTED-BAR-1.1 UIC-SEGMENTED-BAR-2.1 is a named group with a hidden track and a summary list', () => {
    render(<SegmentedBar label="Checks" segments={results} showLegend />);
    const bar = screen.getByRole('group', { name: 'Checks' });
    expect(bar).toHaveClass('ui-segmented-bar');
    expect(bar.querySelector('.ui-segmented-bar__label')).toHaveTextContent('Checks');
    expect(bar.querySelector('.ui-segmented-bar__total')).toHaveTextContent('20 total');
    expect(bar.querySelector('.ui-segmented-bar__track')).toHaveAttribute('aria-hidden', 'true');
    expect(within(bar).getByRole('list')).toHaveClass('ui-segmented-bar__legend');
    expect(
      bar.querySelectorAll('.ui-segmented-bar__track > .ui-segmented-bar__segment'),
    ).toHaveLength(3);
    expectHooksMatchSpec(document.body, 'SEGMENTED-BAR', {
      slots: [
        'label',
        'total',
        'track',
        'segment',
        'legend',
        'item',
        'swatch',
        'item-label',
        'item-value',
        'item-share',
      ],
    });
  });

  it('UIC-SEGMENTED-BAR-2.1 lets aria-label or aria-labelledby name the group', () => {
    const { rerender } = render(<SegmentedBar aria-label="Coverage" segments={results} />);
    expect(screen.getByRole('group', { name: 'Coverage' })).toBeInTheDocument();
    rerender(<SegmentedBar label="Checks" aria-label="Coverage" segments={results} />);
    expect(screen.getByRole('group', { name: 'Coverage' })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="heading">Nightly run</h2>
        <SegmentedBar label="Checks" aria-labelledby="heading" segments={results} />
      </>,
    );
    expect(screen.getByRole('group', { name: 'Nightly run' })).toBeInTheDocument();
  });

  it('UIC-SEGMENTED-BAR-1.2 sizes segments by their share of the sum, in order', () => {
    render(<SegmentedBar aria-label="Checks" segments={results} />);
    expect(widths(screen.getByRole('group'))).toEqual(['60%', '15%', '25%']);
  });

  it('UIC-SEGMENTED-BAR-1.2 leaves the rest of a larger total empty and never shrinks below the sum', () => {
    const { rerender } = render(<SegmentedBar aria-label="Run" segments={results} total={40} />);
    const bar = screen.getByRole('group');
    expect(widths(bar)).toEqual(['30%', '7.5%', '12.5%']);
    expect(bar.querySelector('.ui-segmented-bar__total')).toHaveTextContent('40 total');
    rerender(<SegmentedBar aria-label="Run" segments={results} total={10} />);
    expect(widths(bar)).toEqual(['60%', '15%', '25%']);
    expect(bar.querySelector('.ui-segmented-bar__total')).toHaveTextContent('20 total');
  });

  it('UIC-SEGMENTED-BAR-1.2 counts unusable values as zero and keeps their legend entries', () => {
    const { rerender } = render(
      <SegmentedBar
        aria-label="Mixed"
        segments={[
          { id: 'a', label: 'Apples', value: 4 },
          { id: 'b', label: 'Pears', value: -2 },
          { id: 'c', label: 'Plums', value: Number.NaN },
          { id: 'd', label: 'Figs', value: 0 },
        ]}
      />,
    );
    const bar = screen.getByRole('group');
    expect(widths(bar)).toEqual(['100%']);
    expect(entries(bar)).toEqual(['Apples 4 100%', 'Pears 0 0%', 'Plums 0 0%', 'Figs 0 0%']);
    rerender(
      <SegmentedBar aria-label="Mixed" segments={[{ id: 'a', label: 'Apples', value: 0 }]} />,
    );
    expect(widths(bar)).toEqual([]);
    expect(entries(bar)).toEqual(['Apples 0 0%']);
    expect(bar.querySelector('.ui-segmented-bar__total')).toHaveTextContent('0 total');
  });

  it('UIC-SEGMENTED-BAR-1.2 draws finite extreme amounts proportionally when their sum overflows', () => {
    const segments = [
      { id: 'a', label: 'First', value: Number.MAX_VALUE },
      { id: 'b', label: 'Second', value: Number.MAX_VALUE },
    ];
    const { rerender } = render(
      <SegmentedBar aria-label="Extreme amounts" segments={segments} total={Number.MAX_VALUE} />,
    );
    const bar = screen.getByRole('group', { name: 'Extreme amounts' });
    expect(widths(bar)).toEqual(['50%', '50%']);
    expect(
      [...bar.querySelectorAll('.ui-segmented-bar__item-share')].map((item) => item.textContent),
    ).toEqual(['50%', '50%']);
    rerender(
      <SegmentedBar
        aria-label="Extreme amounts"
        segments={segments.map((segment) => ({ ...segment, value: Number.MIN_VALUE }))}
      />,
    );
    expect(widths(bar)).toEqual(['50%', '50%']);
  });

  it('UIC-SEGMENTED-BAR-1.3 publishes each tone on the segment and its entry, neutral by default', () => {
    const tones = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
    render(
      <SegmentedBar
        aria-label="Tones"
        segments={[
          ...tones.map((tone) => ({ id: tone, label: tone, value: 1, tone })),
          { id: 'plain', label: 'Plain', value: 1 },
        ]}
      />,
    );
    const bar = screen.getByRole('group');
    const segmentTones = [...bar.querySelectorAll('.ui-segmented-bar__segment')].map((node) =>
      node.getAttribute('data-tone'),
    );
    const itemTones = [...bar.querySelectorAll('.ui-segmented-bar__item')].map((node) =>
      node.getAttribute('data-tone'),
    );
    expect(segmentTones).toEqual([...tones, 'neutral']);
    expect(itemTones).toEqual([...tones, 'neutral']);
    expectHooksMatchSpec(document.body, 'SEGMENTED-BAR');
  });

  it('UIC-SEGMENTED-BAR-1.4 lists label, count and share, hidden unless the legend shows', () => {
    const { rerender } = render(<SegmentedBar aria-label="Checks" segments={results} />);
    const bar = screen.getByRole('group');
    expect(entries(bar)).toEqual(['Passed 12 60%', 'Failed 3 15%', 'Skipped 5 25%']);
    const legend = bar.querySelector('.ui-segmented-bar__legend');
    expect(legend?.parentElement).toHaveClass('ui-visually-hidden');
    const item = bar.querySelector('.ui-segmented-bar__item');
    expect(item?.querySelector('.ui-segmented-bar__swatch')).toHaveAttribute('aria-hidden', 'true');
    expect(item?.querySelector('.ui-segmented-bar__item-label')).toHaveTextContent('Passed');
    expect(item?.querySelector('.ui-segmented-bar__item-value')).toHaveTextContent('12');
    expect(item?.querySelector('.ui-segmented-bar__item-share')).toHaveTextContent('60%');
    rerender(<SegmentedBar aria-label="Checks" segments={results} showLegend />);
    expect(bar.querySelector('.ui-segmented-bar__legend')?.parentElement).toBe(bar);
    rerender(
      <SegmentedBar
        aria-label="Thirds"
        segments={[
          { id: 'a', label: 'A', value: 1 },
          { id: 'b', label: 'B', value: 2 },
        ]}
      />,
    );
    expect(entries(bar)).toEqual(['A 1 33.3%', 'B 2 66.7%']);
  });

  it('UIC-SEGMENTED-BAR-1.5 words the total through the provider and formats counts', () => {
    const { rerender } = render(
      <UiProvider locale="de-DE" messages={{ totalCount: 'Summe {total}' }}>
        <SegmentedBar
          aria-label="Storage"
          segments={[
            { id: 'images', label: 'Images', value: 1.5 },
            { id: 'video', label: 'Video', value: 2500 },
          ]}
          formatOptions={{ style: 'unit', unit: 'gigabyte' }}
        />
      </UiProvider>,
    );
    const bar = screen.getByRole('group');
    expect(bar.querySelector('.ui-segmented-bar__total')).toHaveTextContent('Summe 2.501,5 GB');
    expect(entries(bar)[0]).toMatch(/^Images 1,5\sGB 0,1\s%$/);
    rerender(<SegmentedBar aria-label="Storage" segments={results} showTotal={false} />);
    const group = screen.getByRole('group');
    expect(group.querySelector('.ui-segmented-bar__total')).toBeNull();
  });

  it('UIC-SEGMENTED-BAR-1.6 publishes the size, medium by default', () => {
    const { rerender } = render(<SegmentedBar aria-label="Sized" segments={results} />);
    const bar = screen.getByRole('group');
    expect(bar).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<SegmentedBar aria-label="Sized" segments={results} size={size} />);
      expect(bar).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(document.body, 'SEGMENTED-BAR');
    }
  });

  it('UIC-SEGMENTED-BAR-1.7 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <SegmentedBar
        aria-label="Probe"
        className="caller"
        id="probe"
        ref={ref}
        data-sample="probe"
        data-size="caller"
        segments={results}
      />,
    );
    const bar = screen.getByRole('group', { name: 'Probe' });
    expect(bar).toHaveClass('ui-segmented-bar', 'caller');
    expect(bar).toHaveAttribute('id', 'probe');
    expect(bar).toHaveAttribute('data-size', 'md');
    expect(bar).toHaveAttribute('data-sample', 'probe');
    expect(ref.current).toBe(bar);
    expectHooksMatchSpec(document.body, 'SEGMENTED-BAR', { callerAttributes: ['data-sample'] });
  });

  it('UIC-SEGMENTED-BAR-2.2 takes no tab stop', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SegmentedBar label="Checks" segments={results} showLegend />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });
  it('UIC-SEGMENTED-BAR-3.1 draws the same shares as a donut or a pie and keeps the remainder empty', () => {
    const { rerender } = render(
      <SegmentedBar shape="donut" label="Checks" total={40} segments={results} showLegend />,
    );
    for (const shape of ['donut', 'pie'] as const) {
      rerender(
        <SegmentedBar shape={shape} label="Checks" total={40} segments={results} showLegend />,
      );
      const bar = screen.getByRole('group', { name: 'Checks' });
      expect(bar).toHaveAttribute('data-shape', shape);
      expect(
        [...bar.querySelectorAll('.ui-segmented-bar__segment')].map((node) =>
          node.getAttribute('stroke-dasharray'),
        ),
      ).toEqual(['30 70', '7.5 92.5', '12.5 87.5']);
      expect(entries(bar)).toEqual(['Passed 12 30%', 'Failed 3 7.5%', 'Skipped 5 12.5%']);
      expectHooksMatchSpec(bar, 'SEGMENTED-BAR', { slots: ['ring', 'track', 'segment'] });
    }
  });
});
