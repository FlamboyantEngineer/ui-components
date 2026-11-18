'use client';

import { type ReactNode, useRef } from 'react';
import { useScrollOverflow } from '../../utils/use-scroll-overflow.js';
import { markdownHooks as hooks } from './markdown-hooks.js';

/**
 * The frame around a table that scrolls it sideways when it is wider than the document, so it
 * never widens the document. While the table overflows, the reader can focus the frame to scroll it
 * by keyboard (UIC-MARKDOWN-2.5).
 */
export function MarkdownTableFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const isOverflowing = useScrollOverflow(ref);
  return (
    <div
      {...hooks.slot('table', { overflowing: isOverflowing })}
      ref={ref}
      tabIndex={isOverflowing ? 0 : undefined}
    >
      {children}
    </div>
  );
}
