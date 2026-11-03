'use client';

import { useContext, useRef, type RefObject } from 'react';
import {
  OverlayTriggerStateContext,
  PopoverContext,
  useInteractOutside,
  useSlottedContext,
} from '../../primitives/index.js';
import { isElement } from '../../utils/is-element.js';
import { useFollowAnchor } from '../../utils/use-follow-anchor.js';
import { useScrollGuardedState } from '../../utils/use-scroll-guarded-state.js';

const noTrigger: RefObject<Element | null> = { current: null };

/**
 * Keeps the calendar's nonmodal popover open while the page scrolls under it, following its group,
 * and closes it on a press outside it, its group and any popover it opened (the heading's month and
 * year lists), as a modal popover would. React Aria's own nonmodal popover takes no outside press
 * and closes on any scroll. Returns the popover's ref, open state and position option.
 */
export function useCalendarAnchoring() {
  const state = useContext(OverlayTriggerStateContext);
  const triggerRef = useSlottedContext(PopoverContext)?.triggerRef ?? noTrigger;
  const surface = useRef<HTMLElement>(null);
  const isOpen = state?.isOpen ?? false;
  const guarded = useScrollGuardedState({ triggerRef, isGuarded: true, followsPage: true });
  const shouldUpdatePosition = useFollowAnchor({ anchorRef: triggerRef, isOpen });
  useInteractOutside({
    ref: surface,
    isDisabled: !isOpen,
    onInteractOutside: (event) => {
      const target = event.target;
      if (!isElement(target)) return;
      if (triggerRef.current?.contains(target) || target.closest('[data-trigger]')) return;
      state?.close();
    },
  });
  return {
    ref: surface,
    state: guarded,
    shouldUpdatePosition,
  };
}
