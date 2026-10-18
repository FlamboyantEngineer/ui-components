import { useState } from 'react';
import type { Key, Selection } from '../../src/core/props.js';
import { Tree } from '../../src/components/tree/tree.js';
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
export function FilterTree() {
  const [query, setQuery] = useState('os');
  return (
    <div data-lab-filter>
      <label>
        Filter places{' '}
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <Tree
        aria-label="Filtered places"
        items={ATLAS}
        getTextValue={name}
        filterText={query}
        emptyMessage="No places match"
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
