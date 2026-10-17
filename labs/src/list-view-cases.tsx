import { useState } from 'react';
import {
  GridListLoadMoreItem,
  ListLayout,
  useDragAndDrop,
  useListData,
  Virtualizer,
  type Selection,
} from 'react-aria-components';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import {
  ListView,
  ListViewItem,
  ListViewSection,
} from '../../src/components/list-row/list-view.js';

export const selections = ['none', 'single', 'multiple', 'replace'] as const;

const FRUIT = [
  { id: 'apple', name: 'Apple', meta: 'Red · Autumn' },
  { id: 'banana', name: 'Banana', meta: 'Yellow · All year' },
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
  const [selected, setSelected] = useState<Selection>(new Set(['banana']));
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
      disabledKeys={['damson']}
    >
      {(item) => (
        <ListViewItem
          title={item.name}
          meta={item.meta}
          tone={item.id === 'elderberry' ? 'danger' : undefined}
          trailing={
            <IconButton icon="more" size="sm" label={`More about ${item.name} ${selection}`} />
          }
        />
      )}
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

/** Rows reordered by drag and drop, by pointer or from the drag handle by keyboard. */
export function ReorderCase() {
  const list = useListData({ initialItems: FRUIT });
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': list.getItem(key)?.name ?? '' })),
    onReorder(event) {
      if (event.target.dropPosition === 'before') list.moveBefore(event.target.key, event.keys);
      else if (event.target.dropPosition === 'after') list.moveAfter(event.target.key, event.keys);
    },
  });
  return (
    <div data-lab-reorder>
      <ListView
        aria-label="Reorderable fruit"
        items={list.items}
        dragAndDropHooks={dragAndDropHooks}
        divided
      >
        {(item) => <ListViewItem title={item.name} meta={item.meta} />}
      </ListView>
      <p data-lab-output>Order: {list.items.map((item) => item.name).join(', ')}</p>
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
      <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: 40 }}>
        <ListView aria-label="Recipes">
          {items.map((item) => (
            <ListViewItem key={item.id} id={item.id} title={item.name} />
          ))}
          {count < TOTAL ? <GridListLoadMoreItem onLoadMore={onLoadMore} /> : null}
        </ListView>
      </Virtualizer>
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
