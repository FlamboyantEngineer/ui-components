'use client';

import { useState } from 'react';

/**
 * A live preview, such as a size during a drag, held for the owner it was taken under (a stable
 * object naming its persist key, storage and bounds): a new owner reads no preview, so a value
 * taken for an earlier owner never shows or lands under the new one.
 */
export function useOwnedPreview<T>(owner: object): [T | null, (value: T | null) => void] {
  const [live, setLive] = useState<{ owner: object; value: T } | null>(null);
  const preview = live?.owner === owner ? live.value : null;
  const setPreview = (value: T | null) => setLive(value === null ? null : { owner, value });
  return [preview, setPreview];
}
