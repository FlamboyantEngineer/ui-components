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

/** Sets the text area's height to its text's, between the given rows, in its own line height. */
function fitRows(area: HTMLTextAreaElement, minRows: number, maxRows: number) {
  const box = readLineBox(area);
  if (!box) return;
  const { lineHeight, padding, frame } = box;
  area.style.height = '0px';
  const content = clamp(area.scrollHeight - padding, minRows * lineHeight, maxRows * lineHeight);
  area.style.height = `${content + frame}px`;
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
 * height) sizes it again.
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
