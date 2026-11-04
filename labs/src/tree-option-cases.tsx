// Cases of the tree lab for options the other cases leave at their defaults: a caller's filter
// matcher, selection that may not become empty, and a virtualized tree with a row height of its own.

import { useState } from 'react';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { Tree, type TreeProps } from '../../src/components/tree/index.js';
import type { Key, Selection } from '../../src/core/props.js';

interface Shelf {
  id: string;
  name: string;
  children?: Shelf[];
}

const SHELVES: Shelf[] = [
  {
    id: 'garden',
    name: 'Garden tools',
    children: [
      { id: 'rake', name: 'Leaf rake' },
      { id: 'trowel', name: 'Hand trowel' },
      { id: 'shears', name: 'Hedge shears' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    children: [
      { id: 'grater', name: 'Box grater' },
      { id: 'kettle', name: 'Stovetop kettle' },
    ],
  },
  { id: 'hallway', name: 'Hallway shoe rack' },
];

const name = (shelf: Shelf) => shelf.name;

const matchers = {
  terms: { label: 'Each term (default)', filter: undefined },
  start: {
    label: 'Word start',
    filter: (text: string, query: string) =>
      text
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(query.trim().toLowerCase())),
  },
  exact: {
    label: 'Whole name',
    filter: (text: string, query: string) => text.toLowerCase() === query.trim().toLowerCase(),
  },
} as const satisfies Record<string, { label: string; filter: TreeProps<Shelf>['filter'] }>;

type MatcherChoice = keyof typeof matchers;

const isMatcherChoice = (value: unknown): value is MatcherChoice =>
  typeof value === 'string' && Object.hasOwn(matchers, value);

/**
 * The same query under three matchers: the default holds each term anywhere in a name, a word-start
 * matcher only at the start of a word, and a whole-name matcher only the full name.
 */
export function CallerFilterTree() {
  const [matcher, setMatcher] = useState<MatcherChoice>('start');
  const [query, setQuery] = useState('ra');
  return (
    <div data-lab-demo="caller-filter">
      <SegmentedChoice
        aria-label="Matcher"
        size="sm"
        sizing="content"
        options={Object.entries(matchers).map(([value, { label }]) => ({ value, label }))}
        value={matcher}
        onChange={(value) => {
          if (isMatcherChoice(value)) setMatcher(value);
        }}
      />
      <label>
        Filter shelves{' '}
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <Tree
        aria-label="Shelves, filtered by the caller's matcher"
        items={SHELVES}
        getTextValue={name}
        filterText={query}
        filter={matchers[matcher].filter}
        emptyMessage="No shelf matches"
      />
    </div>
  );
}

function formatKeys(keys: Selection): string {
  return keys === 'all' ? 'all' : [...keys].map(String).join(', ') || 'none';
}

/** Selection that keeps at least one row: selecting the last selected row again leaves it selected. */
export function RequiredSelectionTree() {
  const [selected, setSelected] = useState<Selection>(new Set<Key>(['rake']));
  return (
    <div data-lab-demo="required-selection">
      <Tree
        aria-label="Shelves, one always selected"
        items={SHELVES}
        getTextValue={name}
        defaultExpandedKeys={['garden']}
        selectionMode="multiple"
        disallowEmptySelection
        selectedKeys={selected}
        onSelectionChange={setSelected}
      />
      <p>
        Selected: <output data-lab-output="required-selected">{formatKeys(selected)}</output>
      </p>
    </div>
  );
}

const BINS: Shelf[] = Array.from({ length: 12 }, (_, bin) => ({
  id: `bin-${bin + 1}`,
  name: `Bin ${bin + 1}`,
  children: Array.from({ length: 10 }, (_, slot) => ({
    id: `bin-${bin + 1}-${slot + 1}`,
    name: `Bin ${bin + 1} slot ${slot + 1}`,
  })),
}));

/**
 * A virtualized tree whose rows are 44 pixels tall, set by `rowHeight`; the `lg` size fills that
 * height so each row's spacing matches the layout's.
 */
export function TallRowsTree() {
  return (
    <Tree
      aria-label="Storage bins, tall rows"
      items={BINS}
      getTextValue={name}
      defaultExpandedKeys={BINS.map((bin) => bin.id)}
      size="lg"
      virtualized
      rowHeight={44}
      data-lab-tree="tall-rows"
    />
  );
}
