// Filtering a tree by text: matching rows show with their ancestors, expanded to reveal them, and
// with their own descendants.

import { useMemo, useState } from 'react';
import type { Key } from '../../primitives/index.js';
import { splitMatchTerms, textMatchesTerms } from '../text-match/text-match.js';
import type { TreeItemData, TreeProps } from './tree.js';
import type { TreeExpansion } from './use-tree-expansion.js';

export interface TreeFilterOptions<T extends TreeItemData> extends Pick<
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
export interface TreeFilter<T> {
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

/** The rows of one level that show, recording what shows below each and which rows to open. */
function filterLevel<T extends TreeItemData>(
  level: readonly T[],
  context: FilterContext<T>,
  isInsideMatch: boolean,
): { kept: T[]; hasMatch: boolean } {
  const kept: T[] = [];
  let hasMatch = false;
  for (const item of level) {
    const isMatch = context.isMatch(item);
    const below = filterLevel(context.getChildren(item) ?? [], context, isInsideMatch || isMatch);
    context.children.set(item.id, below.kept);
    if (below.hasMatch) context.revealed.add(item.id);
    if (isMatch || below.hasMatch || isInsideMatch) kept.push(item);
    hasMatch ||= isMatch || below.hasMatch;
  }
  return { kept, hasMatch };
}

/**
 * The tree as `filterText` filters it. While it is not blank, the rows whose text value matches
 * show, with their ancestors (expanded) and their descendants; expanding and collapsing then
 * changes a separate expansion, so the reader's own returns once the filter clears.
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
    const { kept } = filterLevel(items, context, false);
    const getShownChildren = (item: T) => context.children.get(item.id) ?? getChildren(item);
    return { kept, getShownChildren, revealed: context.revealed };
  }, [isFiltering, items, getChildren, getTextValue, filterText, filter]);
  const [chosen, setChosen] = useState<{ text: string; keys: Set<Key> } | null>(null);
  if (!result) return { items, getChildren, expansion };
  const expandedKeys = chosen?.text === filterText ? chosen.keys : new Set<Key>(result.revealed);
  const setExpandedKeys = (keys: Set<Key>) => setChosen({ text: filterText, keys });
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
