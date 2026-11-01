'use client';

// Filtering a tree by text: matching rows show with their ancestors, expanded to reveal them, and
// with their own descendants.

import { useMemo, useState } from 'react';
import type { Key } from '../../core/props.js';
import { mapTree } from '../../utils/map-tree.js';
import { splitMatchTerms, textMatchesTerms } from '../text-match/text-match.js';
import type { TreeItemData, TreeProps } from './tree-props.js';
import type { TreeExpansion } from './use-tree-expansion.js';

interface TreeFilterOptions<T extends TreeItemData> extends Pick<
  TreeProps<T>,
  'filterText' | 'filter'
> {
  items: readonly T[];
  getChildren: (item: T) => readonly T[] | undefined;
  getTextValue: (item: T) => string;
  /** The expansion the tree shows while nothing filters. */
  expansion: TreeExpansion;
}

/** The rows a filtered tree shows, how to reach their children, and their expansion. */
interface TreeFilter<T> {
  items: readonly T[];
  getChildren: (item: T) => readonly T[] | undefined;
  expansion: TreeExpansion;
}

interface FilterContext<T> {
  isMatch: (item: T) => boolean;
  getChildren: (item: T) => readonly T[] | undefined;
  children: Map<Key, readonly T[]>;
  revealed: Set<Key>;
}

/** Records matching ancestry on descent and retained children on ascent. */
function filterItems<T extends TreeItemData>(items: readonly T[], context: FilterContext<T>): T[] {
  const matched = new Set<Key>();
  const insideMatch = new Set<Key>();
  return mapTree(
    items,
    (item) => {
      const isMatch = context.isMatch(item);
      if (isMatch) matched.add(item.id);
      const children = context.getChildren(item) ?? [];
      if (isMatch || insideMatch.has(item.id)) {
        for (const child of children) insideMatch.add(child.id);
      }
      return children;
    },
    (item, children: T[]) => {
      context.children.set(item.id, children);
      const hasMatch = children.some(
        (child) => matched.has(child.id) || context.revealed.has(child.id),
      );
      if (hasMatch) context.revealed.add(item.id);
      return matched.has(item.id) || hasMatch || insideMatch.has(item.id) ? item : null;
    },
  );
}

/**
 * What the reader expanded and collapsed while one query filters, kept apart from the revealed
 * ancestry so matches that arrive later are revealed too.
 */
interface ExpansionChoices {
  text: string;
  expanded: ReadonlySet<Key>;
  collapsed: ReadonlySet<Key>;
}

function emptyChoices(text: string): ExpansionChoices {
  return { text, expanded: new Set(), collapsed: new Set() };
}

/** The revealed ancestry with the reader's own expansions added and collapses taken out. */
function applyChoices(revealed: ReadonlySet<Key>, choices: ExpansionChoices | null): Set<Key> {
  if (!choices) return new Set(revealed);
  const keys = new Set([...revealed, ...choices.expanded]);
  for (const key of choices.collapsed) keys.delete(key);
  return keys;
}

/** Records each row that `next` expands or collapses compared with `current`. */
function recordChoices(
  choices: ExpansionChoices,
  current: ReadonlySet<Key>,
  next: ReadonlySet<Key>,
): ExpansionChoices {
  const expanded = new Set(choices.expanded);
  const collapsed = new Set(choices.collapsed);
  for (const key of next) {
    if (current.has(key)) continue;
    expanded.add(key);
    collapsed.delete(key);
  }
  for (const key of current) {
    if (next.has(key)) continue;
    collapsed.add(key);
    expanded.delete(key);
  }
  return { text: choices.text, expanded, collapsed };
}

/**
 * The tree as `filterText` filters it. While it is not blank, the rows whose text value matches
 * show, with their ancestors (expanded) and their descendants; expanding and collapsing then
 * changes a separate expansion, so the reader's own returns once the filter clears. Ancestors of
 * matches that arrive later are revealed unless the reader collapsed them under the same query.
 */
export function useTreeFilter<T extends TreeItemData>(
  options: TreeFilterOptions<T>,
): TreeFilter<T> {
  const { items, getChildren, getTextValue, filterText = '', filter, expansion } = options;
  const isFiltering = filterText.trim() !== '';
  const result = useMemo(() => {
    if (!isFiltering) return null;
    const terms = splitMatchTerms(filterText);
    const context: FilterContext<T> = {
      isMatch(item) {
        const text = getTextValue(item);
        return filter ? filter(text, filterText) : textMatchesTerms(text, terms);
      },
      getChildren,
      children: new Map(),
      revealed: new Set(),
    };
    const kept = filterItems(items, context);
    const getShownChildren = (item: T) => context.children.get(item.id) ?? getChildren(item);
    return { kept, getShownChildren, revealed: context.revealed };
  }, [isFiltering, items, getChildren, getTextValue, filterText, filter]);
  const [choices, setChoices] = useState<ExpansionChoices | null>(null);
  // A cleared query ends its session, so entering the same text again starts from the matches.
  if (!result && choices !== null) setChoices(null);
  if (!result) return { items, getChildren, expansion };
  const session = choices?.text === filterText ? choices : null;
  const expandedKeys = applyChoices(result.revealed, session);
  const setExpandedKeys = (keys: Set<Key>) =>
    setChoices(recordChoices(session ?? emptyChoices(filterText), expandedKeys, keys));
  return {
    items: result.kept,
    getChildren: result.getShownChildren,
    expansion: {
      expandedKeys,
      setExpandedKeys,
      expand: (key) => setExpandedKeys(new Set([...expandedKeys, key])),
    },
  };
}
