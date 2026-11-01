'use client';

// The palette's document-wide shortcut.

import { useEffect } from 'react';
import { formatAriaKeyShortcuts, isChordPress, type ShortcutChord } from '../shortcut/shortcut.js';
import { useLatest } from '../../utils/use-latest.js';
import { isElement } from '../../utils/is-element.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { usePortalContainer } from '../portal/portal.js';

interface ShortcutEntry {
  readonly current: { chord: ShortcutChord | null; onPress: () => void };
}

/** Each document's palette shortcuts, in the order they were registered. */
const registries = new WeakMap<Document, Set<ShortcutEntry>>();

function getRegistry(owner: Document): Set<ShortcutEntry> {
  let registry = registries.get(owner);
  if (!registry) {
    registry = new Set();
    registries.set(owner, registry);
  }
  return registry;
}

/**
 * Whether a key press comes from inside a modal overlay, which holds the page while it is open: a
 * library overlay on the `modal` layer that is not leaving, or any `aria-modal` dialog.
 */
function isInsideModal(event: KeyboardEvent): boolean {
  const target = event.target;
  return (
    isElement(target) &&
    target.closest('[data-layer="modal"]:not([data-exiting]), [aria-modal="true"]') !== null
  );
}

/**
 * Calls `onPress` when the chord is pressed anywhere in the document the palette opens in (its
 * portal container's) and no one handled the key press first. One press answers one palette: of
 * the palettes whose chord it matches, the one registered last claims it, and the one before it
 * takes over once that one leaves. A press from inside a modal overlay is left to that overlay.
 * `null` registers nothing. The registration lives as long as the caller is mounted.
 */
export function useDocumentShortcut(chord: ShortcutChord | null, onPress: () => void): void {
  const keys = chord ? formatAriaKeyShortcuts(chord) : '';
  const latest = useLatest({ chord, onPress });
  const container = usePortalContainer();
  useEffect(() => {
    if (!keys) return undefined;
    const owner = getOwnerDocument(container);
    const registry = getRegistry(owner);
    const entry: ShortcutEntry = latest;
    registry.add(entry);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isInsideModal(event)) return;
      const claimant = [...registry]
        .reverse()
        .find(
          (candidate) => candidate.current.chord && isChordPress(event, candidate.current.chord),
        );
      if (claimant !== entry) return;
      event.preventDefault();
      entry.current.onPress();
    };
    owner.addEventListener('keydown', onKeyDown);
    return () => {
      registry.delete(entry);
      owner.removeEventListener('keydown', onKeyDown);
    };
  }, [keys, latest, container]);
}
