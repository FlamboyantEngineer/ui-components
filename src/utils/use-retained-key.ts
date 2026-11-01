'use client';

import { useState } from 'react';

/**
 * The key a collection shows: `chosen` while `isEligible` accepts it, else the key this hook
 * returned last while still eligible, else `fallback`. The key shown is remembered by identity, so a
 * collection that falls back to its first item keeps that item when others are added or reordered,
 * and an initially empty collection takes its first item once items arrive. Remembering is not a
 * choice: nothing is reported to the caller.
 */
export function useRetainedKey<K>(
  chosen: K | null | undefined,
  isEligible: (key: K) => boolean,
  fallback: K | null | undefined,
): K | null {
  const [shown, setShown] = useState<K | null>(null);
  let key: K | null = fallback ?? null;
  if (chosen != null && isEligible(chosen)) key = chosen;
  else if (shown !== null && isEligible(shown)) key = shown;
  // A render-time update: the next render returns the same key, so it settles at once.
  if (!Object.is(key, shown)) setShown(key);
  return key;
}
