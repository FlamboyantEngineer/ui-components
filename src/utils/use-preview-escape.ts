'use client';

import { useEffect, type RefObject } from 'react';
import { useOverlayPresence } from '../core/overlay-presence.js';
import { isElement } from './is-element.js';
import { isComposingKey } from './is-composing-key.js';
import { getOwnerDocument } from './owner-window.js';
import type { PreviewState } from './use-preview-state.js';

interface PreviewEscapeRefs {
  triggerRef: RefObject<HTMLElement | null>;
  popoverRef: RefObject<HTMLElement | null>;
}

/**
 * A preview does not take focus when hovered. An unhandled Escape from the page therefore never
 * reaches React Aria's trigger or popover. Let those owners and any interactive overlay go first,
 * then close the current preview without moving the page's focus.
 */
export function usePreviewEscape(
  state: PreviewState,
  { triggerRef, popoverRef }: PreviewEscapeRefs,
) {
  const overlays = useOverlayPresence();
  useEffect(() => {
    if (!state.isOpen) return;
    const owner = getOwnerDocument(triggerRef.current);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || isComposingKey(event)) return;
      if (!state.isCurrent() || overlays.isActive()) return;
      const path = event.composedPath();
      // A key the trigger/card already owns stays on its ordinary React Aria path. A different
      // dialog also keeps its priority when it refuses keyboard dismissal.
      if (
        path.some(
          (target) =>
            isElement(target) &&
            (triggerRef.current?.contains(target) ||
              popoverRef.current?.contains(target) ||
              target.getAttribute('role') === 'dialog' ||
              target.getAttribute('role') === 'alertdialog'),
        )
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      state.close(true);
    };
    owner.addEventListener('keydown', onKeyDown);
    return () => {
      owner.removeEventListener('keydown', onKeyDown);
    };
  }, [state, triggerRef, popoverRef, overlays]);
}
