import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Timeline, type TimelineItem, type TimelineProps, type TimelineRow } from './timeline.js';

const rows: TimelineRow[] = [
  {
    id: 'plan',
    label: 'Planning',
    children: [
      { id: 'survey', label: 'Survey' },
      { id: 'budget', label: 'Budget' },
    ],
  },
  { id: 'build', label: 'Build' },
];

const items: TimelineItem[] = [
  {
    id: 'measure',
    rowId: 'survey',
    label: 'Measure rooms',
    start: '2026-03-02',
    end: '2026-03-06',
    progress: 0.4,
  },
  {
    id: 'quote',
    rowId: 'budget',
    label: 'Get quotes',
    start: '2026-03-09',
    end: '2026-03-13',
    tone: 'info',
  },
  {
    id: 'walls',
    rowId: 'build',
    label: 'Paint walls',
    start: '2026-03-10',
    end: '2026-03-20',
    isReadOnly: true,
  },
  { id: 'done', rowId: 'build', label: 'Handover', start: '2026-03-27', kind: 'milestone' },
];

const march = { start: '2026-03-01', end: '2026-03-31' };

function renderTimeline(props: Partial<TimelineProps> = {}) {
  return render(
    <UiProvider locale="en-US">
      <Timeline
        aria-label="Kitchen plan"
        rows={rows}
        items={items}
        range={march}
        scale="day"
        today="2026-03-11"
        {...props}
      />
    </UiProvider>,
  );
}

const item = (name: string) => screen.getByRole('button', { name });

/** Pointer capture as jsdom lacks it, recorded per element. */
function capturePointer(element: HTMLElement) {
  let captured: number | null = null;
  Object.assign(element, {
    setPointerCapture: (id: number) => {
      captured = id;
    },
    hasPointerCapture: (id: number) => captured === id,
    releasePointerCapture: () => {
      captured = null;
    },
  });
}

type User = ReturnType<typeof userEvent.setup>;

/** Drags `target` from one x to another with the primary button; a cancelled drag ends on pointercancel. */
async function drag(
  user: User,
  target: Element,
  from: number,
  to: number,
  end: 'pointerUp' | 'pointerCancel' = 'pointerUp',
) {
  await user.pointer([
    { keys: '[MouseLeft>]', target, coords: { clientX: from } },
    { coords: { clientX: (from + to) / 2 } },
    { coords: { clientX: to } },
  ]);
  // user-event's mouse pointer has id 1.
  if (end === 'pointerCancel') fireEvent.pointerCancel(target, { pointerId: 1, clientX: to });
  await user.pointer({ keys: '[/MouseLeft]' });
}

/** A timeline that applies its own changes, as an owner does. */
function OwnedTimeline({ onItemChange }: { onItemChange: TimelineProps['onItemChange'] }) {
  const [owned, setOwned] = useState(items);
  return (
    <Timeline
      aria-label="Owned plan"
      rows={rows}
      items={owned}
      range={march}
      scale="week"
      today="2026-03-11"
      onItemChange={(change) => {
        onItemChange?.(change);
        setOwned((current) =>
          current.map((entry) => (entry.id === change.id ? { ...entry, ...change } : entry)),
        );
      }}
    />
  );
}

describe('Timeline', () => {
  it('UIC-TIMELINE-1.4 UIC-TIMELINE-1.5 keeps numeric and text row and item identities when reordered', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const typedRows = [
      { id: 1, label: 'Numeric row' },
      { id: '1', label: 'Text row' },
    ];
    const typedItems = [
      { id: 2, rowId: 1, label: 'Numeric item', start: '2026-03-02' },
      { id: '2', rowId: 1, label: 'Text item', start: '2026-03-02' },
    ];
    const props = {
      rows: typedRows,
      items: typedItems,
      range: march,
      onSelectionChange,
      selectionMode: 'multiple' as const,
    };
    const { rerender } = render(<Timeline {...props} />);
    const numeric = item('Numeric item');
    const text = item('Text item');
    const numericRow = screen.getByRole('group', { name: 'Numeric row' });
    const textRow = screen.getByRole('group', { name: 'Text row' });
    rerender(
      <Timeline {...props} rows={[...typedRows].reverse()} items={[...typedItems].reverse()} />,
    );
    expect(item('Numeric item')).toBe(numeric);
    expect(item('Text item')).toBe(text);
    expect(screen.getByRole('group', { name: 'Numeric row' })).toBe(numericRow);
    expect(screen.getByRole('group', { name: 'Text row' })).toBe(textRow);
    await user.click(numeric);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([2]));
    await user.click(text);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([2, '2']));
  });
  it('UIC-TIMELINE-1.1 UIC-TIMELINE-1.10 renders the chart parts and the hooks of its spec', () => {
    const { container } = renderTimeline({ dependencies: [{ from: 'measure', to: 'quote' }] });
    const root = requireDefined(container.querySelector('.ui-timeline'));
    expect(root).toHaveAttribute('data-scale', 'day');
    expect(root).toHaveAttribute('data-view', 'chart');
    const canvas = root.querySelector(
      '.ui-timeline__viewport > .ui-timeline__canvas',
    ) as HTMLElement;
    expect([...canvas.children].map((child) => child.classList[0])).toEqual([
      'ui-timeline__corner',
      'ui-timeline__header',
      'ui-timeline__list',
      'ui-timeline__body',
    ]);
    expect(canvas.style.gridTemplateColumns).toBe('auto 992px');
    const body = root.querySelector('.ui-timeline__body') as HTMLElement;
    expect([body.style.width, body.style.height]).toEqual(['992px', `${4 * 36}px`]);
    expectHooksMatchSpec(container, 'TIMELINE', {
      slots: [
        'viewport',
        'canvas',
        'corner',
        'header',
        'scale-row',
        'scale-cell',
        'list',
        'row-label',
        'toggle',
        'row-name',
        'body',
        'gridline',
        'today',
        'connectors',
        'connector',
        'row',
        'item',
        'progress',
        'item-label',
      ],
    });
  });

  it('UIC-TIMELINE-1.10 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLDivElement | null };
    renderTimeline({
      className: 'caller',
      id: 'plan',
      ref,
      'data-view': 'caller',
      'aria-describedby': 'note',
    } as Partial<TimelineProps>);
    const root = screen.getByRole('group', { name: 'Kitchen plan' });
    expect(root).toHaveClass('ui-timeline', 'caller');
    expect(root).toHaveAttribute('id', 'plan');
    expect(root).toHaveAttribute('data-view', 'chart');
    expect(root).toHaveAttribute('aria-describedby', 'note');
    expect(ref.current).toBe(root);
  });

  it('UIC-TIMELINE-1.2 widens the items to whole units of the scale without a range', () => {
    const { container } = renderTimeline({ range: undefined, scale: 'month' });
    const cells = [...container.querySelectorAll('[data-tier="minor"] .ui-timeline__scale-cell')];
    expect(cells.map((cell) => cell.textContent)).toEqual(['Feb', 'Mar', 'Apr']);
  });

  it('UIC-TIMELINE-1.3 labels two scale rows by zoom level and draws gridlines', () => {
    const { container, rerender } = renderTimeline();
    const tier = (name: string) => requireDefined(container.querySelector(`[data-tier="${name}"]`));
    expect(tier('major')).toHaveAttribute('data-unit', 'month');
    expect(tier('major')).toHaveTextContent('March 2026');
    expect(tier('minor')).toHaveAttribute('data-unit', 'day');
    expect(tier('minor').children).toHaveLength(31);
    const fifth = tier('minor').children[4] as HTMLElement;
    expect([fifth.textContent, fifth.style.left, fifth.style.width]).toEqual([
      '5',
      '128px',
      '32px',
    ]);
    const gridlines = container.querySelectorAll('.ui-timeline__gridline');
    expect(gridlines).toHaveLength(31);
    expect(gridlines[0]).toHaveAttribute('data-major', 'true');
    expect(gridlines[1]).not.toHaveAttribute('data-major');
    const props = { 'aria-label': 'Year', rows, items, today: '2026-03-11' };
    rerender(
      <Timeline {...props} scale="quarter" range={{ start: '2026-01-01', end: '2026-12-31' }} />,
    );
    expect(tier('major')).toHaveAttribute('data-unit', 'year');
    expect(tier('minor')).toHaveTextContent('Q1Q2Q3Q4');
    rerender(<Timeline {...props} scale="week" range={march} />);
    expect(tier('minor')).toHaveAttribute('data-unit', 'week');
    expect(tier('minor').children[1]?.textContent).toMatch(/^Mar \d+$/);
  });

  it('UIC-TIMELINE-1.4 lists rows with depth and collapses groups', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container } = renderTimeline({ onExpandedChange });
    const labels = [...container.querySelectorAll<HTMLElement>('.ui-timeline__row-label')];
    expect(labels.map((label) => label.style.getPropertyValue('--ui-timeline-level'))).toEqual([
      '1',
      '2',
      '2',
      '1',
    ]);
    expect(labels[0]).toHaveAttribute('data-group', 'true');
    expect(labels[0]).toHaveAttribute('data-expanded', 'true');
    expect(requireDefined(labels[0]).style.height).toBe('36px');
    await user.click(screen.getByRole('button', { name: 'Planning' }));
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set());
    expect(screen.getByRole('button', { name: 'Planning' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(container.querySelectorAll('.ui-timeline__row')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Measure rooms' })).not.toBeInTheDocument();
    expect(container.querySelector('.ui-timeline__body')).toHaveStyle({ height: '72px' });
  });

  it('UIC-TIMELINE-1.4 expands groups that arrive after mounting', async () => {
    const user = userEvent.setup();
    const { rerender } = renderTimeline({ rows: [] });
    const later = (shown: TimelineRow[]) => (
      <UiProvider locale="en-US">
        <Timeline
          aria-label="Kitchen plan"
          rows={shown}
          items={items}
          range={march}
          scale="day"
          today="2026-03-11"
        />
      </UiProvider>
    );
    rerender(later(rows));
    expect(screen.getByRole('button', { name: 'Planning' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Measure rooms' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Planning' }));
    rerender(
      later([
        ...rows,
        { id: 'finish', label: 'Finish', children: [{ id: 'paint', label: 'Paint' }] },
      ]),
    );
    expect(screen.getByRole('button', { name: 'Planning' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Finish' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-TIMELINE-1.4 follows controlled expanded keys', () => {
    renderTimeline({ expandedKeys: [] });
    expect(screen.queryByRole('group', { name: 'Survey' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Build' })).toBeInTheDocument();
  });

  it('UIC-TIMELINE-1.5 UIC-TIMELINE-1.6 positions bars, progress and milestones', () => {
    renderTimeline();
    const bar = item('Measure rooms');
    expect(bar).toHaveAttribute('data-kind', 'bar');
    expect(bar).toHaveAttribute('data-tone', 'neutral');
    expect(bar).toHaveStyle({ position: 'absolute', left: '32px', width: '160px' });
    expect(bar.querySelector('.ui-timeline__progress')).toHaveStyle({ width: '40%' });
    expect(bar.querySelector('.ui-timeline__item-label')).toHaveTextContent('Measure rooms');
    expect(item('Get quotes')).toHaveAttribute('data-tone', 'info');
    expect(item('Get quotes').querySelector('.ui-timeline__progress')).toBeNull();
    const milestone = item('Handover');
    expect(milestone).toHaveAttribute('data-kind', 'milestone');
    expect(milestone.style.left).toBe(`${26 * 32 + 16}px`);
    expect(milestone.style.width).toBe('');
  });

  it('UIC-TIMELINE-1.7 draws connectors and flags conflicts', () => {
    const { container } = renderTimeline({
      dependencies: [
        { from: 'measure', to: 'quote' },
        { from: 'quote', to: 'walls' },
      ],
    });
    const layer = requireDefined(container.querySelector('.ui-timeline__connectors'));
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).toHaveAttribute('width', '992');
    const paths = layer.querySelectorAll('.ui-timeline__connector');
    expect(paths).toHaveLength(2);
    expect(paths[0]).not.toHaveAttribute('data-conflict');
    expect(paths[1]).toHaveAttribute('data-conflict', 'true');
    expect(item('Paint walls')).toHaveAttribute('data-conflict', 'true');
    expect(item('Get quotes')).not.toHaveAttribute('data-conflict');
  });

  it('UIC-TIMELINE-1.8 marks today inside the range only', () => {
    const { container, rerender } = renderTimeline();
    const marker = requireDefined(container.querySelector<HTMLElement>('.ui-timeline__today'));
    expect(marker.style.left).toBe(`${10 * 32 + 16}px`);
    expect(marker).toHaveAttribute('aria-hidden', 'true');
    rerender(
      <Timeline aria-label="Plan" rows={rows} items={items} range={march} today="2026-05-01" />,
    );
    expect(container.querySelector('.ui-timeline__today')).toBeNull();
  });

  it('UIC-TIMELINE-1.9 UIC-TIMELINE-4.3 pins the scale and row list and hides decorations', () => {
    const { container } = renderTimeline();
    const part = (slot: string) =>
      requireDefined(container.querySelector<HTMLElement>(`.ui-timeline__${slot}`));
    expect(part('corner')).toHaveStyle({
      position: 'sticky',
      top: '0px',
      left: '0px',
      zIndex: '3',
    });
    expect(part('header')).toHaveStyle({ position: 'sticky', top: '0px', zIndex: '2' });
    expect(part('list')).toHaveStyle({ position: 'sticky', left: '0px', zIndex: '1' });
    expect(part('body')).toHaveStyle({ position: 'relative', zIndex: '0' });
    expect(part('header')).toHaveAttribute('aria-hidden', 'true');
    expect(part('gridline')).toHaveAttribute('aria-hidden', 'true');
  });

  it('UIC-TIMELINE-1.11 UIC-TIMELINE-2.1 UIC-TIMELINE-2.2 mirrors the axis, keys and drags right to left', async () => {
    const user = userEvent.setup();
    const onItemChange = vi.fn();
    const tree = (locale: string) => (
      <UiProvider locale={locale}>
        <Timeline
          aria-label="Kitchen plan"
          rows={rows}
          items={items}
          range={march}
          scale="day"
          today="2026-03-11"
          dependencies={[{ from: 'measure', to: 'quote' }]}
          onItemChange={onItemChange}
        />
      </UiProvider>
    );
    const placed = (container: HTMLElement) => {
      const style = (selector: string) =>
        requireDefined(container.querySelector<HTMLElement>(selector)).style;
      return [
        item('Measure rooms').style,
        style('.ui-timeline__today'),
        style('.ui-timeline__list'),
      ];
    };
    const view = render(tree('en-US'));
    const starts = placed(view.container).map((style) => style.left);
    expect(starts.every(Boolean)).toBe(true);
    view.unmount();
    const { container } = render(tree('ar'));
    const mirrored = placed(container);
    expect(mirrored.map((style) => style.right)).toEqual(starts);
    expect(mirrored.map((style) => style.left)).toEqual(['', '', '']);
    const connectors = requireDefined(container.querySelector('.ui-timeline__connectors g'));
    expect(connectors).toHaveAttribute('transform', expect.stringContaining('scale(-1 1)'));

    const bar = item('Measure rooms');
    bar.focus();
    await user.keyboard('{ArrowLeft}');
    expect(onItemChange).toHaveBeenLastCalledWith({
      id: 'measure',
      start: '2026-03-03',
      end: '2026-03-07',
    });
    await user.keyboard('{ArrowRight}');
    expect(onItemChange).toHaveBeenLastCalledWith({
      id: 'measure',
      start: '2026-03-01',
      end: '2026-03-05',
    });
    // A drag to the left moves later on a right-to-left axis, and to the right earlier.
    capturePointer(bar);
    const startAfter = async (to: number) => {
      await drag(user, bar, 200, to);
      const [change] = onItemChange.mock.lastCall as [{ start: string }];
      return change.start;
    };
    expect((await startAfter(140)) > '2026-03-02').toBe(true);
    expect((await startAfter(260)) < '2026-03-02').toBe(true);
  });

  it('UIC-TIMELINE-2.1 moves and resizes bars by pointer and commits on release', async () => {
    const user = userEvent.setup();
    const onItemChange = vi.fn();
    render(<OwnedTimeline onItemChange={onItemChange} />);
    const bar = item('Measure rooms');
    capturePointer(bar);
    await user.pointer({ keys: '[MouseLeft>]', target: bar, coords: { clientX: 100 } });
    await user.pointer({ coords: { clientX: 133 } });
    expect(bar).toHaveAttribute('data-dragging', 'true');
    expect(bar.style.left).toBe(`${3 * 16}px`);
    expect(onItemChange).not.toHaveBeenCalled();
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onItemChange).toHaveBeenCalledExactlyOnceWith({
      id: 'measure',
      start: '2026-03-04',
      end: '2026-03-08',
    });
    expect(bar).not.toHaveAttribute('data-dragging');
    const end = requireDefined(bar.querySelector('[data-edge="end"]'));
    await drag(user, end, 200, 248);
    expect(onItemChange).toHaveBeenLastCalledWith({
      id: 'measure',
      start: '2026-03-04',
      end: '2026-03-11',
    });
    await drag(user, requireDefined(bar.querySelector('[data-edge="start"]')), 200, 400);
    expect(onItemChange).toHaveBeenLastCalledWith({
      id: 'measure',
      start: '2026-03-11',
      end: '2026-03-11',
    });
  });

  it.each(['item', 'callback'] as const)(
    'UIC-TIMELINE-2.1 drops the draft when editing is locked through the %s during a drag',
    async (lock) => {
      const user = userEvent.setup();
      const onItemChange = vi.fn();
      const props = { rows, items, range: march, scale: 'week' as const, onItemChange };
      const { rerender } = render(<Timeline {...props} aria-label="Plan" />);
      const bar = item('Measure rooms');
      capturePointer(bar);
      await user.pointer([
        { keys: '[MouseLeft>]', target: bar, coords: { clientX: 100 } },
        { coords: { clientX: 133 } },
      ]);
      expect(bar).toHaveAttribute('data-dragging', 'true');
      expect(bar.style.left).toBe('48px');
      rerender(
        <Timeline
          {...props}
          aria-label="Plan"
          items={lock === 'item' ? items.map((value) => ({ ...value, isReadOnly: true })) : items}
          onItemChange={lock === 'callback' ? undefined : onItemChange}
        />,
      );
      expect(bar).not.toHaveAttribute('data-dragging');
      expect(bar.style.left).toBe('16px');
      rerender(<Timeline {...props} aria-label="Plan" />);
      await user.pointer([{ coords: { clientX: 165 } }, { keys: '[/MouseLeft]' }]);
      expect(bar.style.left).toBe('16px');
      expect(onItemChange).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['a switch to the table', { view: 'table' as const }, { view: 'chart' as const }],
    ['a collapsed group', { expandedKeys: [] }, { expandedKeys: ['plan'] }],
    ['a removed row', { items: items.slice(1) }, { items }],
  ])(
    'UIC-TIMELINE-2.1 drops the draft when the dragged item leaves the chart through %s',
    async (_, away, back) => {
      const user = userEvent.setup();
      const onItemChange = vi.fn();
      const props = {
        rows,
        items,
        range: march,
        scale: 'day' as const,
        expandedKeys: ['plan'],
        onItemChange,
      };
      const { rerender } = render(<Timeline {...props} aria-label="Plan" />);
      const bar = item('Measure rooms');
      capturePointer(bar);
      await user.pointer([
        { keys: '[MouseLeft>]', target: bar, coords: { clientX: 100 } },
        { coords: { clientX: 164 } },
      ]);
      expect(bar.style.left).toBe('96px');
      rerender(<Timeline {...props} {...away} aria-label="Plan" />);
      await user.pointer({ keys: '[/MouseLeft]', target: document.body });
      rerender(<Timeline {...props} {...back} aria-label="Plan" />);
      const restored = item('Measure rooms');
      expect(restored).not.toHaveAttribute('data-dragging');
      expect(restored.style.left).toBe('32px');
      expect(onItemChange).not.toHaveBeenCalled();
      restored.focus();
      await user.keyboard('{ArrowRight}');
      expect(onItemChange).toHaveBeenCalledExactlyOnceWith({
        id: 'measure',
        start: '2026-03-03',
        end: '2026-03-07',
      });
    },
  );

  it.each([
    ['moved dates', { start: '2026-03-15', end: '2026-03-19' }, {}],
    ['a milestone', { kind: 'milestone' as const, end: undefined }, {}],
    ['an equal copy at another scale', {}, { scale: 'week' as const }],
    ['an equal copy in another direction', {}, { locale: 'he-IL' }],
  ])(
    'UIC-TIMELINE-2.1 gives up a drag when the host replaces the item with %s',
    async (_name, replaced, props) => {
      const user = userEvent.setup();
      const onItemChange = vi.fn();
      const plan = (
        list: TimelineItem[],
        { locale = 'en-US', ...extra }: Partial<TimelineProps> & { locale?: string } = {},
      ) => (
        <UiProvider locale={locale}>
          <Timeline
            aria-label="Kitchen plan"
            rows={rows}
            items={list}
            range={march}
            scale="day"
            onItemChange={onItemChange}
            {...extra}
          />
        </UiProvider>
      );
      const { rerender } = render(plan(items));
      for (const edge of ['move', 'start', 'end'] as const) {
        const bar = item('Measure rooms');
        const target =
          edge === 'move' ? bar : requireDefined(bar.querySelector(`[data-edge="${edge}"]`));
        capturePointer(bar);
        capturePointer(target as HTMLElement);
        await user.pointer([
          { keys: '[MouseLeft>]', target, coords: { clientX: 100 } },
          { coords: { clientX: 164 } },
        ]);
        expect(bar).toHaveAttribute('data-dragging', 'true');
        const fresh = items.map((entry) =>
          entry.id === 'measure' ? { ...entry, ...replaced } : { ...entry },
        );
        rerender(plan(fresh, props));
        expect(item('Measure rooms')).not.toHaveAttribute('data-dragging');
        await user.pointer({ keys: '[/MouseLeft]' });
        expect(onItemChange).not.toHaveBeenCalled();
        rerender(plan(items));
      }
      const bar = item('Measure rooms');
      expect(bar.style.left).toBe('32px');
      capturePointer(bar);
      await drag(user, bar, 100, 164);
      expect(onItemChange).toHaveBeenCalledExactlyOnceWith({
        id: 'measure',
        start: '2026-03-04',
        end: '2026-03-08',
      });
    },
  );

  it('UIC-TIMELINE-2.1 keeps a drag through equal copies of its item and changes to others', async () => {
    const user = userEvent.setup();
    const onItemChange = vi.fn();
    const plan = (list: TimelineItem[]) => (
      <UiProvider locale="en-US">
        <Timeline
          aria-label="Kitchen plan"
          rows={rows}
          items={list}
          range={march}
          scale="day"
          onItemChange={onItemChange}
        />
      </UiProvider>
    );
    const { rerender } = render(plan(items));
    const bar = item('Measure rooms');
    capturePointer(bar);
    await user.pointer([
      { keys: '[MouseLeft>]', target: bar, coords: { clientX: 100 } },
      { coords: { clientX: 164 } },
    ]);
    rerender(
      plan(
        items.map((entry) =>
          entry.id === 'quote' ? { ...entry, label: 'Get three quotes' } : { ...entry },
        ),
      ),
    );
    expect(item('Measure rooms')).toHaveAttribute('data-dragging', 'true');
    expect(item('Measure rooms').style.left).toBe(`${3 * 32}px`);
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onItemChange).toHaveBeenCalledExactlyOnceWith({
      id: 'measure',
      start: '2026-03-04',
      end: '2026-03-08',
    });
  });

  it('UIC-TIMELINE-2.1 drops a cancelled drag and ignores a press that does not move', async () => {
    const user = userEvent.setup();
    const onItemChange = vi.fn();
    render(<OwnedTimeline onItemChange={onItemChange} />);
    const bar = item('Measure rooms');
    await drag(user, bar, 100, 180, 'pointerCancel');
    expect(bar.style.left).toBe('16px');
    await drag(user, bar, 100, 104);
    expect(onItemChange).not.toHaveBeenCalled();
  });

  it('UIC-TIMELINE-2.2 moves by the scale unit and resizes with Shift', async () => {
    const user = userEvent.setup();
    const onItemChange = vi.fn();
    render(<OwnedTimeline onItemChange={onItemChange} />);
    item('Measure rooms').focus();
    await user.keyboard('{ArrowRight}');
    expect(onItemChange).toHaveBeenLastCalledWith({
      id: 'measure',
      start: '2026-03-09',
      end: '2026-03-13',
    });
    expect(item('Measure rooms')).toHaveFocus();
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(onItemChange).toHaveBeenLastCalledWith({
      id: 'measure',
      start: '2026-03-09',
      end: '2026-03-09',
    });
    item('Handover').focus();
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}{ArrowLeft}');
    expect(onItemChange).toHaveBeenCalledTimes(3);
    expect(onItemChange).toHaveBeenLastCalledWith({
      id: 'done',
      start: '2026-03-20',
      end: '2026-03-20',
    });
  });

  it('UIC-TIMELINE-2.2 edits only on plain arrows and Shift with arrows', async () => {
    const user = userEvent.setup();
    const onItemChange = vi.fn();
    render(<OwnedTimeline onItemChange={onItemChange} />);
    for (const name of ['Measure rooms', 'Handover']) {
      const target = item(name);
      target.focus();
      for (const chord of ['Control', 'Alt', 'Meta']) {
        await user.keyboard(`{${chord}>}{ArrowRight}{ArrowLeft}{/${chord}}`);
      }
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot mark a key as composing.
      fireEvent.keyDown(target, { key: 'ArrowRight', isComposing: true });
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot send key code 229.
      fireEvent.keyDown(target, { key: 'ArrowRight', keyCode: 229 });
      const handled = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      handled.preventDefault();
      target.dispatchEvent(handled);
      expect(onItemChange).not.toHaveBeenCalled();
    }
    item('Measure rooms').focus();
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}{ArrowRight}');
    expect(onItemChange).toHaveBeenCalledTimes(2);
  });

  it('UIC-TIMELINE-2.3 keeps items fixed without a change handler or when read-only', async () => {
    const user = userEvent.setup();
    const onItemChange = vi.fn();
    const { rerender } = renderTimeline();
    expect(item('Measure rooms')).toHaveAttribute('data-readonly', 'true');
    expect(item('Measure rooms').querySelector('.ui-timeline__handle')).toBeNull();
    rerender(<OwnedTimeline onItemChange={onItemChange} />);
    expect(item('Measure rooms')).not.toHaveAttribute('data-readonly');
    expect(item('Measure rooms').querySelectorAll('.ui-timeline__handle')).toHaveLength(2);
    const fixed = item('Paint walls');
    expect(fixed).toHaveAttribute('data-readonly', 'true');
    capturePointer(fixed);
    await drag(user, fixed, 100, 200);
    fixed.focus();
    await user.keyboard('{ArrowRight}');
    expect(onItemChange).not.toHaveBeenCalled();
  });

  it('UIC-TIMELINE-2.4 toggles single and multiple selections', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { rerender } = renderTimeline({ selectionMode: 'single', onSelectionChange });
    await user.click(item('Measure rooms'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['measure']));
    expect(item('Measure rooms')).toHaveAttribute('aria-pressed', 'true');
    expect(item('Measure rooms')).toHaveAttribute('data-selected', 'true');
    item('Get quotes').focus();
    await user.keyboard('{Enter}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['quote']));
    expect(item('Measure rooms')).toHaveAttribute('aria-pressed', 'false');
    await user.click(item('Get quotes'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    rerender(
      <Timeline
        aria-label="Plan"
        rows={rows}
        items={items}
        range={march}
        selectionMode="multiple"
        defaultSelectedKeys={['quote']}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(item('Handover'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['quote', 'done']));
  });

  it('UIC-TIMELINE-2.4 reconciles the selection with the selection mode', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const plan = (selectionMode: TimelineProps['selectionMode']) => (
      <Timeline
        aria-label="Plan"
        rows={rows}
        items={items}
        range={march}
        selectionMode={selectionMode}
        defaultSelectedKeys={['quote', 'measure']}
        onSelectionChange={onSelectionChange}
      />
    );
    const { rerender } = render(plan('multiple'));
    expect(item('Measure rooms')).toHaveAttribute('aria-pressed', 'true');
    expect(item('Get quotes')).toHaveAttribute('aria-pressed', 'true');
    rerender(plan('single'));
    expect(item('Measure rooms')).toHaveAttribute('aria-pressed', 'true');
    expect(item('Get quotes')).toHaveAttribute('aria-pressed', 'false');
    expect(item('Get quotes')).not.toHaveAttribute('data-selected');
    rerender(plan('none'));
    expect(item('Measure rooms')).not.toHaveAttribute('aria-pressed');
    expect(item('Measure rooms')).not.toHaveAttribute('data-selected');
    rerender(plan('multiple'));
    await user.click(item('Handover'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['measure', 'quote', 'done']));
    rerender(plan('single'));
    await user.click(item('Get quotes'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['quote']));
  });

  it('UIC-TIMELINE-2.4 forgets removed items and follows items that arrive later', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const plan = (list: TimelineItem[], keys?: 'all' | Key[], view?: 'table') => (
      <UiProvider locale="en-US">
        <Timeline
          aria-label="Plan"
          rows={rows}
          items={list}
          range={march}
          selectionMode="multiple"
          defaultSelectedKeys={keys}
          view={view}
          onSelectionChange={onSelectionChange}
        />
      </UiProvider>
    );
    const { rerender, unmount } = render(plan(items, ['measure']));
    rerender(plan(items.filter((entry) => entry.id !== 'measure')));
    await user.click(item('Get quotes'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['quote']));
    rerender(plan(items));
    expect(item('Measure rooms')).toHaveAttribute('aria-pressed', 'false');
    rerender(plan(items, undefined, 'table'));
    const table = screen.getByRole('grid', { name: 'Plan' });
    expect(within(table).getAllByRole('row', { selected: true })).toHaveLength(1);
    unmount();
    const view = render(plan([], 'all'));
    view.rerender(plan(items, 'all'));
    expect(item('Measure rooms')).toHaveAttribute('aria-pressed', 'true');
    expect(item('Handover')).toHaveAttribute('aria-pressed', 'true');
    await user.click(item('Handover'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['measure', 'quote', 'walls']));
  });

  it('UIC-TIMELINE-2.1 UIC-TIMELINE-2.4 selects from the keyboard after a cancelled drag', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    renderTimeline({ selectionMode: 'single', onSelectionChange, onItemChange: vi.fn() });
    const bar = item('Measure rooms');
    await user.pointer([
      { keys: '[MouseLeft>]', target: bar, coords: { clientX: 100 } },
      { coords: { clientX: 110 } },
    ]);
    // A cancelled gesture ends without a click; user-event's mouse pointer has id 1.
    fireEvent.pointerCancel(bar, { pointerId: 1, clientX: 110 });
    act(() => bar.focus());
    await user.keyboard('{Enter}');
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['measure']));
  });

  it('UIC-TIMELINE-2.4 follows controlled keys and leaves items unpressable without a mode', async () => {
    const user = userEvent.setup();
    const { rerender } = renderTimeline({ selectionMode: 'multiple', selectedKeys: 'all' });
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(4);
    await user.click(item('Handover'));
    expect(item('Handover')).toHaveAttribute('aria-pressed', 'true');
    rerender(<Timeline aria-label="Plan" rows={rows} items={items} range={march} />);
    expect(item('Handover')).not.toHaveAttribute('aria-pressed');
  });

  it('UIC-TIMELINE-3.1 lists the items in a table view with the shared selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { container } = renderTimeline({
      view: 'table',
      selectionMode: 'multiple',
      onSelectionChange,
    });
    expect(container.querySelector('.ui-timeline')).toHaveAttribute('data-view', 'table');
    expect(container.querySelector('.ui-timeline__viewport')).toBeNull();
    const table = screen.getByRole('grid', { name: 'Kitchen plan' });
    expect(table.closest('.ui-timeline__table')).not.toBeNull();
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(expect.arrayContaining(['Item', 'Row', 'Start', 'End', 'Progress']));
    const names = within(table)
      .getAllByRole('rowheader')
      .map((cell) => cell.textContent);
    expect(names).toEqual(['Measure rooms', 'Get quotes', 'Paint walls', 'Handover']);
    const first = requireDefined(within(table).getAllByRole('row')[1]);
    expect(first).toHaveTextContent('Survey');
    expect(first).toHaveTextContent('Mar 2, 2026');
    expect(first).toHaveTextContent('40%');
    await user.click(requireDefined(within(table).getAllByRole('checkbox')[2]));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['quote']));
  });

  it('UIC-TIMELINE-1.5 UIC-TIMELINE-3.1 reads progress alike in the chart and the table', () => {
    const values: [string, number | undefined, string][] = [
      ['None', undefined, ''],
      ['Not a number', Number.NaN, ''],
      ['Endless', Number.POSITIVE_INFINITY, ''],
      ['Endless back', Number.NEGATIVE_INFINITY, ''],
      ['Behind', -0.5, '0%'],
      ['Zero', 0, '0%'],
      ['Done', 1, '100%'],
      ['Over', 1.5, '100%'],
    ];
    const progressItems: TimelineItem[] = [
      ...values.map(([label, progress], index) => ({
        id: `p${index}`,
        rowId: 'build',
        label,
        start: '2026-03-02',
        end: '2026-03-06',
        progress,
      })),
      {
        id: 'm',
        rowId: 'build',
        label: 'Mark',
        start: '2026-03-09',
        kind: 'milestone',
        progress: 0.5,
      },
    ];
    const { rerender } = renderTimeline({ items: progressItems });
    for (const [label, , shown] of values) {
      const bar = item(label);
      const fill = bar.querySelector<HTMLElement>('.ui-timeline__progress');
      if (shown === '') expect(fill).toBeNull();
      else expect(fill?.style.width).toBe(shown);
    }
    expect(item('Mark').querySelector('.ui-timeline__progress')).toBeNull();
    rerender(
      <UiProvider locale="en-US">
        <Timeline
          aria-label="Kitchen plan"
          rows={rows}
          items={progressItems}
          range={march}
          view="table"
        />
      </UiProvider>,
    );
    const table = screen.getByRole('grid', { name: 'Kitchen plan' });
    const progressOf = (label: string) => {
      const header = within(table).getByRole('rowheader', { name: label });
      return requireDefined(header.closest('[role="row"]')?.lastElementChild).textContent;
    };
    for (const [label, , shown] of values) expect(progressOf(label)).toBe(shown);
    expect(progressOf('Mark')).toBe('');
  });

  it('UIC-TIMELINE-1.2 leaves out items outside the range and cuts bars at its ends', () => {
    const edges: TimelineItem[] = [
      { id: 'in', rowId: 'build', label: 'Inside', start: '2026-03-03', end: '2026-03-04' },
      { id: 'out', rowId: 'build', label: 'Outside', start: '2026-05-01', end: '2026-05-05' },
      { id: 'before', rowId: 'build', label: 'Before', start: '2026-01-05', end: '2026-02-27' },
      { id: 'early', rowId: 'survey', label: 'Early', start: '2026-02-25', end: '2026-03-02' },
      { id: 'late', rowId: 'budget', label: 'Late', start: '2026-03-30', end: '2026-04-09' },
      { id: 'first', rowId: 'survey', label: 'First', start: '2026-03-01', kind: 'milestone' },
      { id: 'last', rowId: 'budget', label: 'Last', start: '2026-03-31', kind: 'milestone' },
      { id: 'after', rowId: 'budget', label: 'After', start: '2026-04-01', kind: 'milestone' },
    ];
    const { rerender } = renderTimeline({ items: edges });
    expect(screen.queryByRole('button', { name: 'Outside' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Before' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'After' })).not.toBeInTheDocument();
    expect(item('Early')).toHaveStyle({ left: '0px', width: '64px' });
    expect(item('Late')).toHaveStyle({ left: `${29 * 32}px`, width: '64px' });
    expect(item('First').style.left).toBe('16px');
    expect(item('Last').style.left).toBe(`${30 * 32 + 16}px`);
    rerender(
      <UiProvider locale="en-US">
        <Timeline aria-label="Kitchen plan" rows={rows} items={edges} range={march} view="table" />
      </UiProvider>,
    );
    const table = screen.getByRole('grid', { name: 'Kitchen plan' });
    expect(within(table).getByRole('rowheader', { name: 'Outside' })).toBeInTheDocument();
  });

  it('UIC-TIMELINE-4.1 names the root and labels each row group', () => {
    render(<Timeline rows={rows} items={items} range={march} />);
    const root = screen.getByRole('group', { name: 'Timeline' });
    expect(root).toHaveClass('ui-timeline');
    expect(within(root).getByRole('group', { name: 'Build' })).toContainElement(item('Handover'));
  });

  it('UIC-TIMELINE-4.2 describes items by days, progress, predecessors and keys', () => {
    render(<OwnedTimeline onItemChange={() => undefined} />);
    expect(item('Measure rooms')).toHaveAccessibleDescription(
      'Mar 2, 2026 to Mar 6, 2026. 40% complete. Arrow keys move it; Shift and arrow keys change its end',
    );
    expect(item('Measure rooms').tagName).toBe('BUTTON');
    expect(item('Handover')).toHaveAccessibleDescription(
      'Milestone on Mar 27, 2026. Arrow keys move it',
    );
  });

  it('UIC-TIMELINE-4.2 names predecessors and conflicts through the provider', () => {
    render(
      <UiProvider locale="en-GB" messages={{ timelineConflict: 'Too early' }}>
        <Timeline
          rows={rows}
          items={items}
          range={march}
          dependencies={[
            { from: 'measure', to: 'walls' },
            { from: 'quote', to: 'walls' },
          ]}
        />
      </UiProvider>,
    );
    expect(item('Paint walls')).toHaveAccessibleDescription(
      '10 Mar 2026 to 20 Mar 2026. Depends on Measure rooms and Get quotes. Too early',
    );
  });
});
