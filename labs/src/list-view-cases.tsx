import { useState } from 'react';
import type { Key, Selection } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import {
  ListView,
  ListViewItem,
  ListViewSection,
  type ListViewItemProps,
  type ListViewMove,
} from '../../src/components/list-row/list-view.js';

export const selections = ['none', 'single', 'multiple', 'replace'] as const;

const FRUIT = [
  { id: 1, name: 'Apple', meta: 'Red · Autumn' },
  { id: '1', name: 'Banana', meta: 'Yellow · All year' },
  { id: 'cherry', name: 'Cherry', meta: 'Dark red · Summer' },
  { id: 'damson', name: 'Damson', meta: 'Purple · Autumn' },
  { id: 'elderberry', name: 'Elderberry', meta: 'Black · Late summer' },
];

const PRODUCE = [
  { id: 'fruit', title: 'Fruit', items: FRUIT },
  {
    id: 'vegetables',
    title: 'Vegetables',
    items: ['Leek', 'Kale', 'Carrot', 'Fennel', 'Onion'].map((name) => ({
      id: name.toLowerCase(),
      name,
      meta: 'Vegetable',
    })),
  },
  {
    id: 'herbs',
    title: 'Herbs',
    items: ['Basil', 'Dill', 'Mint', 'Sage', 'Thyme'].map((name) => ({
      id: name.toLowerCase(),
      name,
      meta: 'Herb',
    })),
  },
];

const PAGE = 50;
const TOTAL = 200;

/** A list in one selection mode, with a disabled row and a trailing button per row. */
export function SelectionCase({ selection }: { selection: (typeof selections)[number] }) {
  const [selected, setSelected] = useState<Selection | Iterable<Key>>(() =>
    (function* () {
      yield '1';
    })(),
  );
  const [disabledKeys] = useState(() =>
    (function* () {
      yield 'damson';
    })(),
  );
  const mode = selection === 'replace' ? 'multiple' : selection;
  return (
    <ListView
      aria-label={`Fruit ${selection}`}
      items={FRUIT}
      divided
      selectionMode={mode}
      selectionBehavior={selection === 'replace' ? 'replace' : 'toggle'}
      selectedKeys={selected}
      onSelectionChange={setSelected}
      disabledKeys={disabledKeys}
    >
      {(item) => (
        <ListViewItem
          title={item.name}
          meta={item.meta}
          tone={item.id === 'elderberry' ? 'danger' : undefined}
          trailing={<Button icon="more" size="sm" label={`More about ${item.name} ${selection}`} />}
        />
      )}
    </ListView>
  );
}

/** A host component around `ListViewItem`, as React Aria's reuse pattern writes it. */
function PageRow(props: ListViewItemProps) {
  return <ListViewItem {...props} />;
}

/** Link rows drawn through a host component; the list's `disabledKeys` reach them by their id. */
export function LinksCase() {
  return (
    <ListView aria-label="Pages" divided disabledKeys={['archive']}>
      <PageRow id="overview" title="Overview" meta="Start here" href="#overview" />
      <PageRow id="guide" title="Guide" meta="Step by step" href="#guide" />
      <PageRow id="archive" title="Archive" meta="Unavailable" href="#archive" />
    </ListView>
  );
}

/** Three sections in a bounded list whose headers stay in view. */
export function SectionsCase() {
  return (
    <div data-lab-sections style={{ height: 220, display: 'flex', flexDirection: 'column' }}>
      <ListView aria-label="Produce" items={PRODUCE} stickyHeaders selectionMode="multiple">
        {(section) => (
          <ListViewSection id={section.id} title={section.title} items={section.items}>
            {(item) => <ListViewItem title={item.name} meta={item.meta} />}
          </ListViewSection>
        )}
      </ListView>
    </div>
  );
}

/** The rows in their new order after `move`, as an owner applies a reported move. */
function applyMove<T extends { id: Key }>(rows: readonly T[], move: ListViewMove): T[] {
  const moving = rows.filter((row) => move.keys.includes(row.id));
  const rest = rows.filter((row) => !move.keys.includes(row.id));
  const index = rest.findIndex((row) => row.id === move.targetKey);
  const at = move.position === 'before' ? index : index + 1;
  return [...rest.slice(0, at), ...moving, ...rest.slice(at)];
}

/** Rows reordered by drag and drop, by pointer or from the drag handle by keyboard. */
export function ReorderCase() {
  const [rows, setRows] = useState(FRUIT);
  return (
    <div data-lab-reorder>
      <ListView
        aria-label="Reorderable fruit"
        items={rows}
        reorder={{ onMove: (move) => setRows((current) => applyMove(current, move)) }}
        divided
      >
        {(item) => <ListViewItem title={item.name} meta={item.meta} />}
      </ListView>
      <p data-lab-output>Order: {rows.map((item) => item.name).join(', ')}</p>
    </div>
  );
}

/** The virtualized list of `LongListCase`, which loads the next page as its end scrolls in. */
function Recipes({ count, onLoadMore }: { count: number; onLoadMore: () => void }) {
  const items = Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Recipe ${index + 1}`,
  }));
  return (
    <div style={{ height: 240, display: 'flex', flexDirection: 'column' }}>
      <ListView
        aria-label="Recipes"
        items={items}
        virtualized
        rowHeight={40}
        onLoadMore={count < TOTAL ? onLoadMore : undefined}
      >
        {(item) => <ListViewItem title={item.name} />}
      </ListView>
    </div>
  );
}

/**
 * A long list shown on demand: React Aria's loading sentinel finds its scrolling list when it
 * mounts, so the list mounts once the stylesheet bounds it.
 */
export function LongListCase() {
  const [isShown, setShown] = useState(false);
  const [count, setCount] = useState(PAGE);
  return (
    <div data-lab-long>
      <button type="button" onClick={() => setShown(true)} disabled={isShown}>
        Show recipes
      </button>
      {isShown ? (
        <Recipes
          count={count}
          onLoadMore={() => setCount((current) => Math.min(current + PAGE, TOTAL))}
        />
      ) : null}
      <p data-lab-output>
        Loaded {count} of {TOTAL}
      </p>
    </div>
  );
}
