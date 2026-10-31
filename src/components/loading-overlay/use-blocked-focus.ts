'use client';

// Keyboard focus around content that turns inert while its region loads.

import { useLayoutEffect, type RefObject } from 'react';
import { containsComposed, getComposedActiveElement } from '../../utils/focus-target.js';

interface BlockedFocusOptions {
  /** The region's root, which holds focus while the content is blocked. */
  rootRef: RefObject<HTMLElement | null>;
  /** The content that turns inert. */
  contentRef: RefObject<HTMLElement | null>;
  isBlocked: boolean;
}

/**
 * Where each blocking region's root sends focus back once its blocking ends, shared by every
 * region, so a nested region that ends while an enclosing one still blocks can hand its own
 * target to the region that took focus from it.
 */
const returnTargets = new Map<HTMLElement, HTMLElement>();

/** The content of every region blocking now, by its root. */
const blockedContents = new Map<HTMLElement, HTMLElement>();

/** The innermost region still blocking `target`, whose root should hold focus for it. */
function findBlockingRoot(target: HTMLElement): HTMLElement | null {
  const holders = [...blockedContents].filter(([, content]) => containsComposed(content, target));
  const innermost = holders.find(([, content]) =>
    holders.every(([root]) => !containsComposed(content, root)),
  );
  return innermost?.[0] ?? null;
}

/**
 * Returns focus to `target`, or, while an enclosing region still blocks it, to that region's root,
 * which then returns it once its own blocking ends.
 */
function returnFocus(target: HTMLElement) {
  const holder = findBlockingRoot(target);
  if (!holder) {
    target.focus({ preventScroll: true });
    return;
  }
  returnTargets.set(holder, target);
  holder.focus({ preventScroll: true });
}

/**
 * Gives a region's return target to the regions that would return focus to its root, which loses
 * its tab stop as its blocking ends: their blocking ends later, when the target can take focus.
 */
function handOver(root: HTMLElement, target: HTMLElement) {
  for (const [holder, held] of returnTargets) {
    if (held === root) returnTargets.set(holder, target);
  }
}

/**
 * Keeps keyboard focus in place while the content is inert, where browsers would drop it to the
 * document body: focus inside the content moves to the root as blocking starts, and returns to the
 * element that had it once blocking ends, unless the reader has moved focus elsewhere meanwhile.
 * Nested regions keep that chain whatever order their loads end in. Focus is read in the region's
 * own tree and followed into shadow roots, so a region in a shadow root, or an element inside a
 * shadow host in the content, is found and returned to.
 */
export function useBlockedFocus({ rootRef, contentRef, isBlocked }: BlockedFocusOptions) {
  // A layout effect runs before the browser moves focus out of the newly inert content.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;
    const active = getComposedActiveElement(root) as HTMLElement | null;
    if (isBlocked) {
      blockedContents.set(root, content);
      if (active && containsComposed(content, active)) {
        returnTargets.set(root, active);
        root.focus({ preventScroll: true });
      }
      return;
    }
    blockedContents.delete(root);
    const target = returnTargets.get(root);
    returnTargets.delete(root);
    if (!target?.isConnected) return;
    // Focus is lost when nothing in the whole document holds it, wherever the region lives.
    const { activeElement: pageActive, body } = root.ownerDocument;
    const isLost = !pageActive || pageActive === body;
    if (active === root || isLost) returnFocus(target);
    else handOver(root, target);
  }, [rootRef, contentRef, isBlocked]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    return () => {
      if (!root) return;
      returnTargets.delete(root);
      blockedContents.delete(root);
    };
  }, [rootRef]);
}
