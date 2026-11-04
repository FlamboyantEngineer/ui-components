'use client';

import { type RefObject, useContext, useLayoutEffect, useState } from 'react';
import { useLoadingBoundary } from '../../core/loading-boundary.js';
import { useOverlayRegistration } from '../../core/overlay-presence.js';
import {
  OverlayTriggerStateContext,
  PopoverContext,
  useSlottedContext,
} from '../../primitives/index.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { useLatest } from '../../utils/use-latest.js';

interface PopoverPresenceProps {
  /** The popover's own open state, when it has one; otherwise its trigger's state decides. */
  isOpen?: boolean | undefined;
  /** The element a controlled popover is placed against, shared by every copy of it. */
  triggerRef?: RefObject<Element | null> | undefined;
  /** Closes a popover with its own open state; otherwise its trigger's state closes it. */
  onClose?: (() => void) | undefined;
}

/**
 * Counts the popover rendered next to it as an open interactive overlay: every library overlay a
 * reader works in (menus, field popups and popovers) renders one just before its popover, with the
 * popover's `isOpen` and `triggerRef`. It reads the open state as the popover does: its own
 * `isOpen`, else its trigger's. React Aria renders a collection's content twice, once hidden: both
 * copies share one registration. A hover hint or a contextual toolbar renders none.
 *
 * It also closes the popover while the content it was opened from is suspended by a loading
 * boundary (`LoadingRegion`, `Skeleton`), first handing focus in the popover to the boundary, which
 * returns it to the trigger once the content is available again.
 */
export function PopoverPresence({ isOpen, triggerRef, onClose }: PopoverPresenceProps) {
  const triggerState = useContext(OverlayTriggerStateContext);
  const popover = useSlottedContext(PopoverContext);
  const [own] = useState(() => ({}));
  const isControlled = isOpen !== undefined || !triggerState;
  const isShown = isControlled ? (isOpen ?? false) : triggerState.isOpen;
  useOverlayRegistration(isShown, isControlled ? (triggerRef ?? own) : triggerState);
  const { isSuspended, holdFocus } = useLoadingBoundary();
  const close = useLatest(() => (isControlled ? onClose?.() : triggerState.close()));
  const anchorRef = useLatest(triggerRef ?? popover?.triggerRef);
  // A layout effect closes the popover before the reader can act in it again.
  useLayoutEffect(() => {
    if (!isSuspended || !isShown) return;
    const anchor = anchorRef.current?.current;
    holdFocus(isHTMLElement(anchor) ? anchor : null);
    close.current();
  }, [isSuspended, isShown, holdFocus, close, anchorRef]);
  return null;
}
