'use client';

import { useContext, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import {
  TooltipContext,
  TooltipTriggerStateContext,
  useSlottedContext,
} from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { getOwnerDocument } from '../../utils/owner-window.js';

/** Dismiss the hint before React Aria's global listener can consume its owner's Escape. */
export function TooltipEscape() {
  const state = useContext(TooltipTriggerStateContext);
  const triggerRef = useSlottedContext(TooltipContext)?.triggerRef;
  useLayoutEffect(() => {
    if (!state?.isOpen) return;
    const owner = getOwnerDocument(triggerRef?.current);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || isComposingKey(event)) return;
      // Closing synchronously removes React Aria's capture listener before the same key reaches it.
      // The key remains unhandled, so a field, menu or dialog can apply its own dismissal rule.
      flushSync(() => state.close(true));
    };
    owner.addEventListener('keydown', onKeyDown, true);
    return () => owner.removeEventListener('keydown', onKeyDown, true);
  }, [state, triggerRef]);
  return null;
}
