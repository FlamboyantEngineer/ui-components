'use client';

import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { hasIcon, type IconSource } from '../icon/icon.js';
import { segmentedChoiceHooks as hooks } from './segmented-choice-hooks.js';

/** Sub-pixel rounding the measurements may differ by without the room changing. */
const tolerance = 1;

/** The width inside an element's padding, where its children lay out. */
function innerWidth(element: HTMLElement): number {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  const padding =
    Number.parseFloat(style?.paddingLeft ?? '0') + Number.parseFloat(style?.paddingRight ?? '0');
  return element.clientWidth - (Number.isFinite(padding) ? padding : 0);
}

/** The room the group has: its parent's inner width, or the group's own when it has no parent. */
function measureRoom(group: HTMLElement): number {
  return group.parentElement ? innerWidth(group.parentElement) : group.clientWidth;
}

/**
 * The width the group needs to show every label whole: its content width, plus what each label
 * cut short by an ellipsis lacks.
 */
function measureNeed(group: HTMLElement): number {
  const labels = group.querySelectorAll<HTMLElement>(`.${hooks.slotClass('label')}`);
  let lacking = 0;
  for (const label of labels) lacking += Math.max(0, label.scrollWidth - label.clientWidth);
  return Math.max(group.scrollWidth, group.clientWidth) + lacking;
}

/**
 * Whether a group with `iconOnly="auto"` shows only its icons now: once its labels need more width
 * than its parent gives it, and until the parent gives back the width the labels needed. Measured
 * after every render and, at most once a frame, when the group or its parent resizes or fonts
 * load. `isActive` false keeps the labels and measures nothing.
 */
function useIconFallback(group: RefObject<HTMLElement | null>, isActive: boolean): boolean {
  const [isFolded, setFolded] = useState(false);
  // The width the labels needed when the group folded them, to unfold once that much is free.
  const needed = useRef(0);
  const measure = useLatest(() => {
    const element = group.current;
    if (!element || !isActive) return;
    const room = measureRoom(element);
    if (isFolded) {
      if (room + tolerance >= needed.current) setFolded(false);
      return;
    }
    const need = measureNeed(element);
    if (need <= room + tolerance) return;
    needed.current = need;
    setFolded(true);
  });

  // Options, counts and sizes change the labels' width with a render.
  useLayoutEffect(() => measure.current());

  useLayoutEffect(() => {
    const element = group.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view || !isActive || !('ResizeObserver' in view)) return undefined;
    let frame = 0;
    const schedule = () => {
      if (frame === 0) {
        frame = view.requestAnimationFrame(() => {
          frame = 0;
          measure.current();
        });
      }
    };
    const observer = new view.ResizeObserver(schedule);
    observer.observe(element);
    if (element.parentElement) observer.observe(element.parentElement);
    void element.ownerDocument.fonts?.ready.then(schedule);
    return () => {
      observer.disconnect();
      if (frame !== 0) view.cancelAnimationFrame(frame);
    };
  }, [group, isActive, measure]);

  return isActive && isFolded;
}

/**
 * Whether the segments show only their icons: always with `iconOnly`, and with `iconOnly="auto"`
 * while the labels do not fit, when every option has an icon to show.
 */
export function useSegmentIcons(
  group: RefObject<HTMLElement | null>,
  iconOnly: boolean | 'auto',
  options: readonly { icon?: IconSource }[],
): boolean {
  const canFold = iconOnly === 'auto' && options.every((option) => hasIcon(option.icon));
  return useIconFallback(group, canFold) || iconOnly === true;
}
