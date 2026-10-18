import { useState } from 'react';
import type { ExpansionProps } from '../../core/events.js';
import type { Key } from '../../core/props.js';
import type { OutlineEntry } from './outline-tree.js';

export interface OutlineExpansionOptions extends ExpansionProps {
  /** Entries at this level or deeper start collapsed, unless expanded keys say otherwise. */
  collapseBelowLevel?: number | undefined;
}

/**
 * Which entries with children are expanded: the controlled keys; else the reader's own toggles over
 * the default keys or, without them, over `collapseBelowLevel` (every entry when it is not set).
 */
export function useOutlineExpansion(
  parents: readonly OutlineEntry[],
  {
    expandedKeys,
    defaultExpandedKeys,
    onExpandedChange,
    collapseBelowLevel,
  }: OutlineExpansionOptions,
) {
  const [toggled, setToggled] = useState<ReadonlyMap<Key, boolean>>(() => new Map());
  const [defaults] = useState(() =>
    defaultExpandedKeys === undefined ? undefined : new Set<Key>(defaultExpandedKeys),
  );
  const controlled = expandedKeys === undefined ? undefined : new Set<Key>(expandedKeys);

  const isExpanded = ({ heading }: OutlineEntry): boolean => {
    if (controlled) return controlled.has(heading.id);
    const own = toggled.get(heading.id);
    if (own !== undefined) return own;
    if (defaults) return defaults.has(heading.id);
    return collapseBelowLevel === undefined || heading.level < collapseBelowLevel;
  };

  const setExpanded = (entry: OutlineEntry, next: boolean) => {
    const expanded = parents.filter((parent) => (parent === entry ? next : isExpanded(parent)));
    if (!controlled) setToggled((current) => new Map(current).set(entry.heading.id, next));
    onExpandedChange?.(new Set(expanded.map((parent) => parent.heading.id)));
  };

  return { isExpanded, setExpanded };
}
