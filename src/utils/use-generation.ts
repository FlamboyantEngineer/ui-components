'use client';

import { useState } from 'react';

/**
 * Counts the different `owner` objects seen, such as the comparisons a view draws, so elements
 * keyed by the count are new for each owner: their state and undo history never carry an
 * earlier owner's. The count stays the same while `owner` stays the same object.
 */
export function useGeneration(owner: unknown): number {
  const [seen, setSeen] = useState({ owner, generation: 0 });
  if (seen.owner === owner) return seen.generation;
  const next = { owner, generation: seen.generation + 1 };
  setSeen(next);
  return next.generation;
}
