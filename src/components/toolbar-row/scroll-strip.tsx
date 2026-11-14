'use client';

// The edge controls around a strip that scrolls: shared by Toolbar Scroller, Toolbar Row and Tabs,
// each with its own hook classes.

import type { ReactNode } from 'react';
import type { ComponentHooks } from '../../core/hooks.js';
import { ScrollStripButton } from '../button/button.js';

type Edge = 'start' | 'end';

interface ScrollStripProps {
  /** The owner's hooks, which name the scroll buttons. */
  hooks: ComponentHooks<'scroll-button'>;
  /** Draws a decorative fade at each edge, named by these hooks, shown while that edge hides content. */
  fadeHooks?: ComponentHooks<'fade'> | undefined;
  /** The edges past which the strip hides content. */
  edges: Readonly<Record<Edge, boolean>>;
  /** Pages the strip toward an edge. */
  onPage: (edge: Edge) => void;
  /** Draws a scroll button at each edge, shown while that edge hides content. */
  hasButtons: boolean;
  /** The strip. Its place stays the same whichever edge controls are drawn. */
  children: ReactNode;
}

function ScrollStripEdge({
  edge,
  hooks,
  edges,
  onPage,
  hasButtons,
  fadeHooks,
}: Omit<ScrollStripProps, 'children'> & { edge: Edge }) {
  const isHidden = !edges[edge];
  return (
    <>
      {fadeHooks ? (
        <span {...fadeHooks.slot('fade', { edge })} aria-hidden="true" hidden={isHidden} />
      ) : null}
      {hasButtons ? (
        <ScrollStripButton
          {...hooks.slot('scroll-button', { edge })}
          edge={edge}
          isHidden={isHidden}
          onPress={onPage}
        />
      ) : null}
    </>
  );
}

/**
 * A strip between its edge controls: at each edge a fade and a scroll button, drawn as asked and
 * shown while that edge hides content. The controls come and go around the strip without
 * remounting it.
 */
export function ScrollStrip({ children, ...edge }: ScrollStripProps) {
  return (
    <>
      <ScrollStripEdge edge="start" {...edge} />
      {children}
      <ScrollStripEdge edge="end" {...edge} />
    </>
  );
}
