'use client';

// Heading levels that nested sections take from the section around them.

import { createContext, useContext } from 'react';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The heading level of the nearest enclosing section, read by the sections nested in it. */
export const HeadingLevelContext = createContext<HeadingLevel | undefined>(undefined);

/** The level used outside any section when none is given. */
const defaultHeadingLevel = 3;

/**
 * A heading's level: the explicit `level`, else one below the enclosing section's (down to 6),
 * else 3 outside any section.
 */
export function useHeadingLevel(level: HeadingLevel | undefined): HeadingLevel {
  const parent = useContext(HeadingLevelContext);
  if (level !== undefined) return level;
  return parent === undefined ? defaultHeadingLevel : (Math.min(parent + 1, 6) as HeadingLevel);
}
