import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { Timeline, type TimelineItem, type TimelineRowColumnEntry } from './timeline.js';

const rows = [
  { id: 'group', label: 'Works', children: [{ id: 'two', label: 'Beds' }] },
  { id: 'one', label: 'Paths' },
  { id: 'none', label: 'Pond' },
  { id: 'end', label: 'Opening' },
];

const items: TimelineItem[] = [
  { id: 'dig', rowId: 'two', label: 'Dig', start: '2026-03-02', end: '2026-03-06' },
  { id: 'sow', rowId: 'two', label: 'Sow', start: '2026-03-12', end: '2026-03-16' },
  { id: 'lay', rowId: 'one', label: 'Lay gravel', start: '2026-03-09', end: '2026-03-13' },
  { id: 'open', rowId: 'end', label: 'Open day', start: '2026-03-21', kind: 'milestone' },
];

function renderColumns(rowColumns?: readonly TimelineRowColumnEntry[]) {
  return render(
    <UiProvider locale="en-US">
      <Timeline
        aria-label="Plan"
        rows={rows}
        items={items}
        dependencies={[{ from: 'lay', to: 'open' }]}
        range={{ start: '2026-03-01', end: '2026-03-31' }}
        rowColumns={rowColumns}
      />
    </UiProvider>,
  );
}

const values = (container: HTMLElement, column: string) =>
  [...container.querySelectorAll(`.ui-timeline__row-value[data-column="${column}"]`)].map(
    (node) => node.textContent,
  );

describe('Timeline row properties', () => {
  it('UIC-TIMELINE-1.13 shows built-in values per row without aggregates', () => {
    const { container } = renderColumns(['duration', 'dependencies']);
    // Works, Beds, Paths, Pond, Opening.
    expect(values(container, 'duration')).toEqual([
      '',
      'Duration: 2 items',
      'Duration: 5 days',
      '',
      'Duration: Milestone',
    ]);
    expect(values(container, 'dependencies')).toEqual([
      '',
      'Depends on: 2 items',
      'Depends on: None',
      '',
      'Depends on: Lay gravel',
    ]);
    expect(container.querySelector('.ui-timeline__row-headings')).toHaveTextContent(
      'DurationDepends on',
    );
    expect(container.querySelector('.ui-timeline__list')).toHaveAttribute('data-columns', 'true');
    expect(screen.getByText('Paths').closest('.ui-timeline__row-label')).toHaveTextContent(
      'PathsDuration: 5 days',
    );
  });

  it('UIC-TIMELINE-1.13 shows host columns in order and nothing by default', () => {
    const owner: TimelineRowColumnEntry = {
      id: 'kind',
      header: 'Kind',
      renderValue: ({ isGroup, items: own }) => (isGroup ? 'Group' : own.length || null),
    };
    const { container, unmount } = renderColumns([owner, 'duration']);
    expect(values(container, 'kind')).toEqual(['Kind: Group', 'Kind: 2', 'Kind: 1', '', 'Kind: 1']);
    const headings = [...container.querySelectorAll('.ui-timeline__row-heading')];
    expect(headings.map((node) => node.textContent)).toEqual(['Kind', 'Duration']);
    unmount();
    const view = renderColumns();
    expect(view.container.querySelector('.ui-timeline__row-value')).toBeNull();
    expect(view.container.querySelector('.ui-timeline__list')).not.toHaveAttribute('data-columns');
  });
});
