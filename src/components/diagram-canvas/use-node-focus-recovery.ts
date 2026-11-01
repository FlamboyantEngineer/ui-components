'use client';

import type { RefObject } from 'react';
import { useFocusRecovery } from '../../utils/use-focus-recovery.js';
import { diagramHooks as hooks } from './diagram-hooks.js';

/** A node's position as last drawn, from its inline style. */
function readNodeOrigin(node: Element) {
  const style = (node as Partial<HTMLElement>).style;
  return {
    x: Number.parseFloat(style?.left ?? '') || 0,
    y: Number.parseFloat(style?.top ?? '') || 0,
  };
}

/**
 * Keeps focus in the canvas when the host removes the node holding it: focus moves to the node
 * drawn nearest to where it was, else to the viewport.
 */
export function useNodeFocusRecovery(viewportRef: RefObject<HTMLDivElement | null>) {
  useFocusRecovery(viewportRef, (lost) => {
    const viewport = viewportRef.current;
    const removed = lost.closest(`.${hooks.slotClass('node')}`);
    const from = removed ? readNodeOrigin(removed) : { x: 0, y: 0 };
    const nodes = [
      ...(viewport?.querySelectorAll<HTMLElement>(`.${hooks.slotClass('node')}`) ?? []),
    ];
    const distance = (node: Element) => {
      const at = readNodeOrigin(node);
      return Math.hypot(at.x - from.x, at.y - from.y);
    };
    return nodes.sort((first, second) => distance(first) - distance(second))[0] ?? viewport;
  });
}
