import { useState } from 'react';
import { Tree, type TreeSectionData } from '../../src/components/tree/tree.js';
import type { Key, Selection } from '../../src/core/props.js';
import { RowMenu } from './row-menu.js';

interface Shelf {
  id: string;
  name: string;
  section?: string;
  children?: Shelf[];
}

const SECTIONS: Record<string, TreeSectionData> = {
  pinned: { id: 'pinned', label: 'Pinned' },
  recent: {
    id: 'recent',
    label: 'Recently opened in the last few weeks, across every shared space',
  },
  shared: { id: 'shared', label: 'Shared' },
  // The same label as `shared`, a different section.
  'shared-old': { id: 'shared-old', label: 'Shared' },
};

const shelf = (id: string, name: string, section?: string, children?: Shelf[]): Shelf => ({
  id,
  name,
  ...(section ? { section } : {}),
  ...(children ? { children } : {}),
});

const SHELVES: Shelf[] = [
  shelf('start', 'Start here'),
  shelf('handbook', 'Handbook', 'pinned', [
    shelf('handbook-intro', 'Introduction'),
    shelf('handbook-guides', 'Guides', undefined, [
      shelf('guides-setup', 'Setup', undefined, [
        shelf('setup-steps', 'Steps', undefined, [shelf('steps-first', 'First steps')]),
      ]),
    ]),
  ]),
  shelf('garden', 'Garden plan', 'recent'),
  shelf('recipes', 'Recipes', 'pinned', [shelf('recipes-soup', 'Tomato soup')]),
  shelf('photos', 'Photo album', 'shared'),
  shelf('budget', 'Budget', 'recent'),
  shelf('letters', 'Old letters', 'shared-old'),
  shelf('maps', 'Maps', 'shared'),
];

const name = (entry: Shelf) => entry.name;
const getSection = (entry: Shelf) => (entry.section ? SECTIONS[entry.section] : undefined);

/** Sections under heading rows, with a filter, selection, a current row and row actions. */
export function SectionsTree() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Selection>(new Set<Key>());
  const [wrap, setWrap] = useState(false);
  const count = selected === 'all' ? 'all' : selected.size;
  return (
    <div data-lab-sections>
      <label>
        Filter shelves{' '}
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <label>
        <input type="checkbox" checked={wrap} onChange={() => setWrap(!wrap)} /> Wrap labels
      </label>
      <Tree
        aria-label="Shelves"
        items={SHELVES}
        getTextValue={name}
        getSection={getSection}
        filterText={query}
        emptyMessage="No shelves match"
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        currentKey="garden"
        disabledKeys={['maps']}
        defaultExpandedKeys={['handbook']}
        renderMeta={(entry) => (entry.children ? `${entry.children.length}` : null)}
        renderActions={(entry) => <RowMenu label={`More for ${entry.name}`} />}
        wrap={wrap}
      />
      <p data-lab-output>Selected: {count}</p>
    </div>
  );
}

const MANY: Shelf[] = Array.from({ length: 6 }, (_, group) =>
  Array.from({ length: 40 }, (_, index) =>
    shelf(`row-${group}-${index}`, `Entry ${group * 40 + index + 1}`, `group-${group}`),
  ),
).flat();

const getManySection = (entry: Shelf): TreeSectionData => {
  const group = Number(entry.section?.slice('group-'.length));
  return { id: entry.section ?? '', label: `Group ${group + 1}` };
};

/** A virtualized sectioned tree: heading rows take the row height. */
export function VirtualSectionsTree() {
  return (
    <Tree
      aria-label="Grouped entries"
      items={MANY}
      getTextValue={name}
      getSection={getManySection}
      virtualized
      data-lab-tree="virtualized-sections"
    />
  );
}
