'use client';

// The palette's document-wide shortcut.

import { useEffect } from 'react';
import { formatAriaKeyShortcuts, isChordPress, type ShortcutChord } from '../shortcut/shortcut.js';
import { useLatest } from '../../utils/use-latest.js';

/**
 * Calls `onPress` when the chord is pressed anywhere in the document and no one handled the key
 * press first. `null` registers nothing. The listener lives as long as the caller is mounted.
 */
export function useDocumentShortcut(chord: ShortcutChord | null, onPress: () => void): void {
  const keys = chord ? formatAriaKeyShortcuts(chord) : '';
  const latest = useLatest({ chord, onPress });
  useEffect(() => {
    if (!keys) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const current = latest.current;
      if (event.defaultPrevented || !current.chord || !isChordPress(event, current.chord)) return;
      event.preventDefault();
      current.onPress();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [keys, latest]);
}
