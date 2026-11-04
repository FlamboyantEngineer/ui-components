'use client';

import { type RefObject, useLayoutEffect, useRef } from 'react';
import { isHTMLElement } from '../../utils/is-element.js';
import { isHiddenOrGone, useFocusRecovery } from '../../utils/use-focus-recovery.js';
import type { OutlineEntry } from './outline-tree.js';

/** The heading id of the entry an element of the outline belongs to: its row link's fragment. */
function readHeadingId(element: Element): string | undefined {
  const href = element.closest('li')?.querySelector('a')?.getAttribute('href');
  return href?.startsWith('#') ? href.slice(1) : undefined;
}

/**
 * The headings to try, nearest first, when the entry of `id` is hidden or gone: itself, its
 * ancestors from the closest, then the entries before it from the closest, then those after it.
 */
function listCandidates(entries: readonly OutlineEntry[], id: string): string[] {
  const at = entries.findIndex((entry) => entry.heading.id === id);
  if (at < 0) return [];
  const ids = entries.map((entry) => entry.heading.id);
  const ancestors = entries[at]?.ancestors ?? [];
  return [id, ...ancestors.toReversed(), ...ids.slice(0, at).toReversed(), ...ids.slice(at + 1)];
}

/**
 * Keeps focus in the outline when its entry is collapsed under an ancestor or removed: focus moves
 * to the nearest shown entry, an ancestor first, else a neighbour. The entries of the previous
 * commit tell where a removed heading was.
 */
export function useOutlineFocusRecovery(
  rootRef: RefObject<HTMLElement | null>,
  entries: readonly OutlineEntry[],
) {
  const previous = useRef(entries);
  useFocusRecovery(rootRef, (lost) => {
    const id = readHeadingId(lost);
    const links = [...(rootRef.current?.querySelectorAll('a') ?? [])];
    for (const candidate of id === undefined ? [] : listCandidates(previous.current, id)) {
      const link = links.find((element) => element.getAttribute('href') === `#${candidate}`);
      if (isHTMLElement(link) && !isHiddenOrGone(link)) return link;
    }
    return null;
  });
  useLayoutEffect(() => {
    previous.current = entries;
  }, [entries]);
}
