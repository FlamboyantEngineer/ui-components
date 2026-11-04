import { useState } from 'react';
import { Tree } from '../../src/components/tree/tree.js';
import type { Key, Selection } from '../../src/core/props.js';
import { applyTreeMove, type TreeMove } from '../../src/utils/tree-reorder.js';

interface Place {
  id: string;
  name: string;
  isLazy?: boolean;
  children?: Place[];
}

const place = (id: string, name: string, children?: Place[]): Place => ({
  id,
  name,
  ...(children ? { children } : {}),
});

const ATLAS: Place[] = [
  place('europe', 'Europe', [
    place('portugal', 'Portugal', [place('lisbon', 'Lisbon'), place('porto', 'Porto')]),
    place('norway', 'Norway', [place('oslo', 'Oslo'), place('bergen', 'Bergen')]),
  ]),
  place('asia', 'Asia', [
    place('japan', 'Japan', [place('kyoto', 'Kyoto'), place('osaka', 'Osaka')]),
    place('vietnam', 'Vietnam', [place('hanoi', 'Hanoi')]),
  ]),
  place('africa', 'Africa', [place('ghana', 'Ghana', [place('accra', 'Accra')])]),
];

const name = (entry: Place) => entry.name;

const describeSelection = (keys: Selection) =>
  keys === 'all' ? 'all' : [...keys].map(String).sort().join(', ') || 'none';

interface PrimitiveEntry {
  id: Key;
  name: string;
  children?: PrimitiveEntry[];
}

const primitiveItems: PrimitiveEntry[] = [
  { id: 1, name: 'Numeric branch', children: [{ id: 2, name: 'Numeric child' }] },
  { id: '1', name: 'Text branch', children: [{ id: '2', name: 'Text child' }] },
  { id: 'a b', name: 'Space key' },
  { id: 'a-b', name: 'Dash key' },
];

export function PrimitiveTree() {
  const [items, setItems] = useState<readonly PrimitiveEntry[]>(primitiveItems);
  const [selection, setSelection] = useState<Selection>(new Set([2]));
  const [action, setAction] = useState('none');
  const [move, setMove] = useState('none');
  return (
    <div data-lab-typed-tree>
      <Tree
        aria-label="Primitive keys"
        items={items}
        getTextValue={(item) => item.name}
        defaultExpandedKeys={[1]}
        selectionMode="multiple"
        selectionBehavior="replace"
        selectedKeys={selection}
        onSelectionChange={setSelection}
        onAction={(key) => setAction(JSON.stringify([typeof key, key]))}
        disabledKeys={['a b']}
        reorder={{
          onMove: (next) => {
            setItems(applyTreeMove(items, next));
            setMove(JSON.stringify(next));
          },
        }}
      />
      <p>
        Selection:{' '}
        <output data-lab-output="typed-selection">
          {selection === 'all'
            ? 'all'
            : JSON.stringify([...selection].map((key) => [typeof key, key]))}
        </output>
      </p>
      <p>
        Action: <output data-lab-output="typed-action">{action}</output>
      </p>
      <p>
        Move: <output data-lab-output="typed-move">{move}</output>
      </p>
    </div>
  );
}

/** Checkboxes whose selection cascades through branches. */
export function CheckboxTree() {
  const [selected, setSelected] = useState<Selection>(new Set(['lisbon']));
  return (
    <div data-lab-checkbox>
      <Tree
        aria-label="Destinations"
        items={ATLAS}
        getTextValue={name}
        defaultExpandedKeys={['europe', 'portugal', 'norway']}
        selectionMode="multiple"
        checkboxSelection
        selectionPropagation
        selectedKeys={selected}
        onSelectionChange={setSelected}
        disabledKeys={['bergen']}
      />
      <p data-lab-output>Selected: {describeSelection(selected)}</p>
    </div>
  );
}

/** A filter field over the tree: matches show with their ancestors, marked. */
const AMERICAS = place('americas', 'Americas', [
  place('usa', 'United States', [place('los-angeles', 'Los Angeles')]),
]);

export function FilterTree() {
  const [query, setQuery] = useState('os');
  const [items, setItems] = useState(ATLAS);
  return (
    <div data-lab-filter>
      <label>
        Filter places{' '}
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <button
        type="button"
        disabled={items.includes(AMERICAS)}
        onClick={() => setItems([...ATLAS, AMERICAS])}
      >
        Add the Americas
      </button>
      <Tree
        aria-label="Filtered places"
        items={items}
        getTextValue={name}
        filterText={query}
        emptyMessage="No places match"
      />
    </div>
  );
}

function createNestedPlaces(): Place[] {
  let entry = place('nested-24', 'Level 24');
  for (let level = 23; level >= 1; level -= 1) {
    entry = place(`nested-${level}`, `Level ${level}`, [entry]);
  }
  return [entry];
}

const nestedPlaces = createNestedPlaces();

/** Filtering and cascading selection share the same loaded, deeply nested branch. */
export function NestedTree() {
  const [query, setQuery] = useState('');
  return (
    <div data-lab-nested-tree>
      <label>
        Filter levels{' '}
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <Tree
        aria-label="Nested levels"
        items={nestedPlaces}
        getTextValue={name}
        filterText={query}
        selectionMode="multiple"
        checkboxSelection
        selectionPropagation
        defaultSelectedKeys={['nested-24']}
      />
    </div>
  );
}

const REGIONS: Place[] = [
  { id: 'north', name: 'North', isLazy: true },
  { id: 'south', name: 'South', isLazy: true },
];

/** Branches that load their children when opened; South fails once, then loads on retry. */
export function LoadingTree() {
  const [regions, setRegions] = useState(REGIONS);
  const [failures, setFailures] = useState(0);
  const load = async (region: Place) => {
    if (region.id === 'south' && failures === 0) {
      setFailures(1);
      throw new Error('South is unreachable right now.');
    }
    const children = [1, 2, 3].map((index) =>
      place(`${region.id}-${index}`, `${region.name} town ${index}`),
    );
    setRegions((current) =>
      current.map((entry) => (entry.id === region.id ? { ...entry, children } : entry)),
    );
  };
  return (
    <div data-lab-loading>
      <Tree
        aria-label="Regions"
        items={regions}
        getTextValue={name}
        hasChildItems={(entry) => entry.isLazy ?? false}
        onLoadChildren={load}
      />
    </div>
  );
}

function renamePlace(entries: readonly Place[], id: Key, newName: string): Place[] {
  return entries.map((entry) => ({
    ...entry,
    ...(entry.id === id ? { name: newName } : {}),
    ...(entry.children ? { children: renamePlace(entry.children, id, newName) } : {}),
  }));
}

/** F2 renames a row in place; continents keep their names. */
export function InPlaceRenameTree() {
  const [items, setItems] = useState<Place[]>(ATLAS);
  return (
    <div data-lab-in-place-rename>
      <Tree
        aria-label="Rename places"
        items={items}
        getTextValue={name}
        defaultExpandedKeys={['europe']}
        canRename={(entry) => !ATLAS.some((continent) => continent.id === entry.id)}
        onRename={(entry, newName) =>
          setItems((current) => renamePlace(current, entry.id, newName))
        }
        reorder={{
          dragTrigger: 'handle',
          onMove: (move) => setItems((current) => [...applyTreeMove(current, move)]),
        }}
      />
    </div>
  );
}

/** The selected rows drag together; the owner applies the moves in turn. */
export function MultipleReorderTree() {
  const [items, setItems] = useState<readonly Place[]>(ATLAS);
  const [selected, setSelected] = useState<Selection>(new Set(['lisbon', 'porto']));
  const [last, setLast] = useState('none');
  const apply = (moves: readonly TreeMove[]) => {
    setLast(moves.map((move) => `${move.key} ${move.position} ${move.targetKey}`).join('; '));
    setItems((current) => moves.reduce(applyTreeMove, current));
  };
  return (
    <div data-lab-reorder="multiple">
      <Tree
        aria-label="Reorder several places"
        items={items}
        getTextValue={name}
        defaultExpandedKeys={['europe', 'portugal', 'norway']}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        reorder={{
          canMoveInto: (entry, parent) =>
            Boolean(parent?.children) && !entry.children?.length && parent?.id !== 'europe',
          onMove: (move) => apply([move]),
          onMoveMany: apply,
        }}
      />
      <p data-lab-output>Last moves: {last}</p>
    </div>
  );
}
