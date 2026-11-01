import type { ReactNode } from 'react';
import type { MarkdownNode } from './markdown-nodes.js';

/** Where a node renders, for a `renderNode` override. */
export interface MarkdownNodePlace {
  /**
   * The node sits inside a link or a task item's label, where another link or button must not
   * nest: an override draws plain content there.
   */
  isInteractive: boolean;
}

/**
 * Replaces a node's rendering: receives the node, its rendered children (`null` for nodes without
 * children) and where it renders. Return `undefined` to keep the default rendering, `null` to
 * render nothing.
 */
export type MarkdownRenderNode = (
  node: MarkdownNode,
  children: ReactNode,
  place: MarkdownNodePlace,
) => ReactNode;
