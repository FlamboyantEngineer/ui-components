'use client';

import { type RefObject, useLayoutEffect, useState } from 'react';
import { useLayoutChanges } from '../../utils/use-layout-changes.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { useWidestTextWidth } from '../../utils/use-widest-text-width.js';

/** How a label badge gives way when its room is too narrow for its first letter and an ellipsis. */
export type BadgeCollapse = 'dot' | 'none';

const ELLIPSIS = '…';

/** The first user-perceived character of a text, so an accent or an emoji is not split. */
function firstGrapheme(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const segment = new Intl.Segmenter().segment(trimmed)[Symbol.iterator]().next();
  return segment.done ? trimmed.charAt(0) : segment.value.segment;
}

/**
 * The width the label gets with the badge drawn whole. A collapsed badge is only its dot, so the
 * dot's state is lifted for one synchronous measurement and put back before anything paints.
 */
function measureOpenRoom(label: HTMLElement): number {
  const root = label.parentElement;
  const collapsed = root?.getAttribute('data-collapsed');
  if (!root || collapsed === null || collapsed === undefined) return label.clientWidth;
  root.removeAttribute('data-collapsed');
  const room = label.clientWidth;
  root.setAttribute('data-collapsed', collapsed);
  return room;
}

/**
 * Whether a label badge has collapsed to a dot: the room its label gets with the badge drawn whole
 * is narrower than the label's first letter followed by an ellipsis, measured in the label's own
 * font. It measures again when the label changes and when the badge's host or the host's container
 * resizes, so the badge opens again once the room comes back. `false` when collapse is `none`,
 * when no canvas can measure the text, or before the first measurement.
 */
export function useBadgeCollapse(
  labelRef: RefObject<HTMLElement | null>,
  collapse: BadgeCollapse,
): boolean {
  const [text, setText] = useState('');
  const [isCollapsed, setCollapsed] = useState(false);
  const isEnabled = collapse === 'dot';
  const first = firstGrapheme(text);
  const minWidth = useWidestTextWidth(labelRef, first ? [first + ELLIPSIS] : []);
  /** Reads the label's text, then whether the whole badge's label still fits a letter and "…". */
  const update = () => {
    const label = labelRef.current;
    setText(label?.textContent ?? '');
    const fits = !isEnabled || !label || !minWidth || measureOpenRoom(label) + 0.5 >= minWidth;
    setCollapsed(!fits);
  };
  useLayoutEffect(update);
  // A resize, a content change or a font load measures again, without a render of the badge.
  useLayoutChanges(labelRef, update);
  useResizeObserver(() => {
    const host = labelRef.current?.parentElement?.parentElement;
    return isEnabled ? [host, host?.parentElement] : [];
  }, update);
  return isCollapsed;
}
