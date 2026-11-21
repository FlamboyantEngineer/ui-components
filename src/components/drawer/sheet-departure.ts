'use client';

import { type RefObject, useEffect } from 'react';
import { useLatest } from '../../utils/use-latest.js';

interface SheetDepartureOptions {
  /** The sheet's overlay, which holds its scroller and content. */
  overlayRef: RefObject<HTMLElement | null>;
  isEntering: boolean;
  isExiting: boolean;
  close: () => void;
}

/** The event React Aria's sheet waits on, from its own observer, before it unmounts a slid-out sheet. */
const SHEET_LEFT_EVENT = 'react-aria-sheet-close';

/** Whether the content lies wholly outside the viewport; one with no box yet has not left. */
function hasLeftViewport(content: Element): boolean {
  const view = content.ownerDocument.defaultView;
  const box = content.getBoundingClientRect();
  if (!view || (box.width === 0 && box.height === 0)) return false;
  return (
    box.right <= 0 || box.bottom <= 0 || box.left >= view.innerWidth || box.top >= view.innerHeight
  );
}

function sheetParts(overlay: HTMLElement | null) {
  const scroller = overlay?.querySelector('[data-sheet-scroll]');
  const content = overlay?.querySelector('[data-sheet-content]');
  return overlay && scroller && content ? { overlay, scroller, content } : null;
}

/**
 * Makes sure a sheet that has left the viewport closes and unmounts. React Aria's sheet learns it
 * has left from an intersection observer that only reports crossings, so a panel that still touches
 * the viewport's edge once out (one that fills the viewport along its swipe axis, or one swiped away
 * from the edge it rests on) or that it never saw wholly in can leave unnoticed: the swipe does not
 * close it, and a close that slides it out waits forever, as it does when a scroll interrupts the
 * slide. Once its scroll settles with the content outside the viewport, this closes the sheet, and
 * once the scroll of a closing sheet settles, it ends the slide out React Aria is waiting on.
 */
export function useSheetDeparture({
  overlayRef,
  isEntering,
  isExiting,
  close,
}: SheetDepartureOptions): void {
  const latest = useLatest({ isEntering, isExiting, close });
  useEffect(() => {
    const parts = sheetParts(overlayRef.current);
    if (!parts) return;
    const { overlay, scroller, content } = parts;
    // While it slides out, the scroll ends where the slide ended, out of view or, when a scroll of
    // the reader's cut the slide short, still in view; either way the sheet is done.
    const onScrollEnd = () => {
      const state = latest.current;
      if (state.isEntering) return;
      if (state.isExiting) overlay.dispatchEvent(new CustomEvent(SHEET_LEFT_EVENT));
      else if (hasLeftViewport(content)) state.close();
    };
    scroller.addEventListener('scrollend', onScrollEnd);
    return () => scroller.removeEventListener('scrollend', onScrollEnd);
  }, [overlayRef, latest]);
  // A sheet closed once it had already left does not scroll again, so its slide out ends here. The
  // effect runs after React Aria's layout effect has started waiting.
  useEffect(() => {
    const parts = sheetParts(overlayRef.current);
    if (!isExiting || !parts || !hasLeftViewport(parts.content)) return;
    parts.overlay.dispatchEvent(new CustomEvent(SHEET_LEFT_EVENT));
  }, [overlayRef, isExiting]);
}
