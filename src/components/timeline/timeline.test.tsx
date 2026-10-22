import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
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
  it('UIC-TIMELINE-1.1 UIC-TIMELINE-1.10 renders the chart parts and the hooks of its spec', () => {
    const { container } = renderTimeline({ dependencies: [{ from: 'measure', to: 'quote' }] });
    const root = container.querySelector('.ui-timeline')!;
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
    const tier = (name: string) => container.querySelector(`[data-tier="${name}"]`)!;
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
    expect(labels[0]!.style.height).toBe('36px');
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
    const layer = container.querySelector('.ui-timeline__connectors')!;
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
    const marker = container.querySelector<HTMLElement>('.ui-timeline__today')!;
    expect(marker.style.left).toBe(`${10 * 32 + 16}px`);
    expect(marker).toHaveAttribute('aria-hidden', 'true');
    rerender(
      <Timeline aria-label="Plan" rows={rows} items={items} range={march} today="2026-05-01" />,
    );
    expect(container.querySelector('.ui-timeline__today')).toBeNull();
  });

  it('UIC-TIMELINE-1.9 UIC-TIMELINE-4.3 pins the scale and row list and hides decorations', () => {
    const { container } = renderTimeline();
    const part = (slot: string) => container.querySelector<HTMLElement>(`.ui-timeline__${slot}`)!;
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
    const end = bar.querySelector('[data-edge="end"]')!;
    await drag(user, end, 200, 248);
    expect(onItemChange).toHaveBeenLastCalledWith({
      id: 'measure',
      start: '2026-03-04',
      end: '2026-03-11',
    });
    await drag(user, bar.querySelector('[data-edge="start"]')!, 200, 400);
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
    const first = within(table).getAllByRole('row')[1]!;
    expect(first).toHaveTextContent('Survey');
    expect(first).toHaveTextContent('Mar 2, 2026');
    expect(first).toHaveTextContent('40%');
    await user.click(within(table).getAllByRole('checkbox')[2]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['quote']));
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
      <UiProvider locale="en-GB" strings={{ timelineConflict: 'Too early' }}>
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
      '10 Mar 2026 to 20 Mar 2026. Depends on Measure rooms, Get quotes. Too early',
    );
  });
});
