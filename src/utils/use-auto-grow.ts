'use client';

import { type RefObject, useEffect, useLayoutEffect } from 'react';
import { clamp } from './clamp.js';
import { listenFontsLoaded } from './listen-fonts-loaded.js';
import { readLineBox } from './read-line-box.js';
import { useElementSize } from './use-element-size.js';

export interface AutoGrowOptions {
  /** The rows the text area shows at least. Defaults to one. */
  minRows: number | undefined;
  /** The rows it grows to at most before it scrolls. Defaults to no limit. */
  maxRows: number | undefined;
  /** The text, which it measures again whenever it changes. */
  value: string;
}

/** The nearest box around `area` that a minimum height holds: past `display: contents` and inline boxes. */
function findSlot(area: HTMLTextAreaElement, view: Window): HTMLElement | null {
  let slot = area.parentElement;
  while (slot) {
    const { display } = view.getComputedStyle(slot);
    if (display !== 'contents' && display !== 'inline') return slot;
    slot = slot.parentElement;
  }
  return null;
}

/**
 * Runs `measure` while the box around `area` keeps its current height, so emptying the text area
 * to measure it never gives its neighbours its room for a moment: a scroll region beside it would
 * clamp its scroll position to that larger viewport and stay off its end once the room is back.
 * The box gets back its own inline minimum, and that minimum's priority, afterwards.
 */
function holdingSlot(area: HTMLTextAreaElement, measure: () => void) {
  const view = area.ownerDocument.defaultView;
  const slot = view ? findSlot(area, view) : null;
  if (!view || !slot) {
    measure();
    return;
  }
  const { style } = slot;
  const before = style.getPropertyValue('min-height');
  const priority = style.getPropertyPriority('min-height');
  style.setProperty('min-height', view.getComputedStyle(slot).height, 'important');
  try {
    measure();
  } finally {
    style.setProperty('min-height', before, priority);
  }
}

/** Sets the text area's height to its text's, between the given rows, in its own line height. */
function fitRows(area: HTMLTextAreaElement, minRows: number, maxRows: number) {
  const box = readLineBox(area);
  if (!box) return;
  const { lineHeight, padding, frame } = box;
  holdingSlot(area, () => {
    area.style.height = '0px';
    const content = clamp(area.scrollHeight - padding, minRows * lineHeight, maxRows * lineHeight);
    area.style.height = `${content + frame}px`;
  });
}

/** Whether a text area grows with its text: when either row limit is set. */
export function isAutoGrowing({ minRows, maxRows }: Pick<AutoGrowOptions, 'minRows' | 'maxRows'>) {
  return minRows !== undefined || maxRows !== undefined;
}

/**
 * Grows a text area with its text between `minRows` and `maxRows` (one row and no limit by default),
 * when either is set. Past `maxRows` the text area scrolls. A new width (a stylesheet that loads
 * late, a resized container) or fonts that finish loading wrap the text anew, so it measures again.
 * The height it writes is its own while it grows: once neither limit is set, or the hook unmounts,
 * the text area gets back the inline height it had before, so the stylesheet (or the caller's
 * height) sizes it again. While it measures, the box around the text area keeps its height, so a
 * neighbour (a transcript above a composer) never gets its room, nor scrolls, for a moment.
 */
export function useAutoGrow(area: RefObject<HTMLTextAreaElement | null>, options: AutoGrowOptions) {
  const { minRows, maxRows, value } = options;
  const isEnabled = isAutoGrowing(options);
  const width = useElementSize(area, { enabled: isEnabled })?.width;
  useLayoutEffect(() => {
    const element = area.current;
    if (!isEnabled || !element) return undefined;
    const before = element.style.height;
    return () => {
      element.style.height = before;
    };
  }, [area, isEnabled]);
  useLayoutEffect(() => {
    if (isEnabled && area.current) fitRows(area.current, minRows ?? 1, maxRows ?? Infinity);
  }, [area, isEnabled, minRows, maxRows, value, width]);
  // A font that finishes loading re-wraps the text at the same width.
  useEffect(() => {
    const element = area.current;
    if (!isEnabled || !element) return undefined;
    return listenFontsLoaded(element, () => fitRows(element, minRows ?? 1, maxRows ?? Infinity));
  }, [area, isEnabled, minRows, maxRows]);
}
