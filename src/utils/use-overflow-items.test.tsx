import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useOverflowItems, type OverflowCollapseFrom } from './use-overflow-items.js';
import { stubTextLayout } from '../../test/overflow-fixtures.js';

interface RowProps {
  room: number;
  items: readonly string[];
  collapseFrom?: OverflowCollapseFrom;
  priorities?: Readonly<Record<string, number>>;
  nested?: boolean;
  fixed?: string;
  /** Places the indicator after this many visible items, marked with `indicatorRef`. */
  indicatorAfter?: number;
  minVisible?: number;
}

function Row(props: RowProps) {
  const { room, items, collapseFrom = 'end', priorities, nested, fixed, indicatorAfter } = props;
  const { containerRef, itemContainerRef, indicatorRef, visibleItems, hiddenItems } =
    useOverflowItems({
      items,
      collapseFrom,
      getPriority: priorities ? (item) => priorities[item] ?? 0 : undefined,
      minVisible: props.minVisible,
    });
  const indicator =
    hiddenItems.length > 0 ? (
      <button
        key="indicator"
        type="button"
        ref={indicatorAfter === undefined ? undefined : indicatorRef}
      >
        +{hiddenItems.length}
      </button>
    ) : null;
  const shown = visibleItems.map((item) => <span key={item}>{item}</span>);
  if (nested) {
    return (
      <div ref={containerRef} data-room={room} role="group" aria-label="Row">
        {collapseFrom === 'start' ? indicator : null}
        <div ref={itemContainerRef} role="group" aria-label="Items">
          {shown}
        </div>
        {collapseFrom === 'end' ? indicator : null}
        {fixed ? <i>{fixed}</i> : null}
      </div>
    );
  }
  const at = indicatorAfter ?? (collapseFrom === 'start' ? 0 : shown.length);
  return (
    <div ref={containerRef} data-room={room} role="group" aria-label="Row">
      {[...shown.slice(0, at), indicator, ...shown.slice(at)]}
    </div>
  );
}

const fruit = ['Apple', 'Banana', 'Cherry', 'Fig'];
const trail = ['Aa', 'Bb', 'Cc', 'Dd', 'Ee', 'Ff'];

function rowText(): string[] {
  return Array.from(
    screen.getByRole('group', { name: 'Row' }).querySelectorAll('span, button'),
    (node) => (node.textContent === null ? '' : node.textContent),
  );
}

beforeEach(() => {
  stubTextLayout();
});

describe('useOverflowItems', () => {
  it('UIC-OVERFLOW-LIST-1.5 hides lower priorities first and keeps the visible order', () => {
    render(<Row room={120} items={fruit} priorities={{ Cherry: 1 }} />);
    // Cherry (60) is kept first; Apple (50) would not fit beside it and "+3" (20).
    expect(rowText()).toEqual(['Cherry', '+3']);
  });

  it('UIC-OVERFLOW-LIST-1.5 keeps minVisible items however little room there is', () => {
    const props = {
      items: trail,
      collapseFrom: 'start',
      indicatorAfter: 1,
      minVisible: 2,
    } as const;
    render(<Row {...props} room={10} priorities={{ Aa: 1, Ff: 1 }} />);
    expect(rowText()).toEqual(['Aa', '+4', 'Ff']);
  });

  it('UIC-OVERFLOW-LIST-1.5 solves again when the priorities change', () => {
    const { rerender } = render(<Row room={120} items={fruit} priorities={{ Cherry: 1 }} />);
    rerender(<Row room={120} items={fruit} priorities={{ Fig: 2 }} />);
    // Fig (30) first, then Apple (50) from the kept end; Banana would not fit beside "+2".
    expect(rowText()).toEqual(['Apple', 'Fig', '+2']);
  });

  it('UIC-OVERFLOW-LIST-1.5 measures an indicator the caller places after a kept first item', () => {
    render(
      <Row
        room={100}
        items={trail}
        collapseFrom="start"
        priorities={{ Aa: 1, Ff: 1 }}
        indicatorAfter={1}
      />,
    );
    // Aa and Ff stay, then items from the end: Ee and Dd fit beside "+2".
    expect(rowText()).toEqual(['Aa', '+2', 'Dd', 'Ee', 'Ff']);
  });

  it('UIC-OVERFLOW-LIST-1.5 keeps the indicator mounted while it measures new priorities', () => {
    const props = { room: 100, items: trail, collapseFrom: 'start', indicatorAfter: 1 } as const;
    const { rerender } = render(<Row {...props} priorities={{ Aa: 1, Ff: 1 }} />);
    const indicator = screen.getByRole('button');
    indicator.focus();
    rerender(<Row {...props} priorities={{ Aa: 1, Ff: 1, Cc: 2 }} />);
    expect(screen.getByRole('button')).toBe(indicator);
    expect(indicator).toHaveFocus();
    expect(rowText()).toEqual(['Aa', '+2', 'Cc', 'Ee', 'Ff']);
  });

  it('UIC-OVERFLOW-LIST-1.6 measures items inside a nested container beside the indicator and fixed parts', () => {
    render(<Row room={150} items={fruit} nested fixed="Add" />);
    // The room is 150 less the fixed "Add" (30): Apple (50) fits beside "+3" (20); Banana would not.
    const items = screen.getByRole('group', { name: 'Items' });
    expect(Array.from(items.children, (child) => child.textContent)).toEqual(['Apple']);
    expect(items.nextElementSibling).toHaveTextContent('+3');
  });

  it('UIC-OVERFLOW-LIST-1.6 renders every nested item that fits, with no indicator', () => {
    render(<Row room={230} items={fruit} nested fixed="Add" />);
    expect(screen.getByRole('group', { name: 'Items' }).children).toHaveLength(4);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('UIC-OVERFLOW-LIST-1.6 keeps the last nested items when items collapse from the start', () => {
    render(<Row room={110} items={fruit} nested collapseFrom="start" />);
    const items = screen.getByRole('group', { name: 'Items' });
    expect(Array.from(items.children, (child) => child.textContent)).toEqual(['Cherry', 'Fig']);
    expect(items.previousElementSibling).toHaveTextContent('+2');
  });
});
