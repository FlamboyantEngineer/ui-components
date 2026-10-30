'use client';

import { useEffect, type ReactNode } from 'react';
import { PopoverContext, useSlottedContext } from '../../primitives/index.js';
import { capturePointer, releasePointer } from '../../utils/pointer-drag.js';

/** Keep a popup that overlaps its trigger from receiving the opening mouse release. */
function captureOpeningPress(trigger: Element) {
  let pointer: number | undefined;
  let bounds: DOMRect;
  const release = () => {
    if (pointer !== undefined) releasePointer(trigger, pointer);
    pointer = undefined;
  };
  const down = (event: Event) => {
    const press = event as PointerEvent;
    if (
      press.button !== 0 ||
      press.pointerType !== 'mouse' ||
      trigger.getAttribute('aria-expanded') !== 'false'
    )
      return;
    pointer = press.pointerId;
    bounds = trigger.getBoundingClientRect();
    // React Aria releases capture during pointerdown, before this microtask runs.
    queueMicrotask(() => {
      if (pointer === press.pointerId)
        capturePointer({ currentTarget: trigger, pointerId: pointer });
    });
  };
  const move = (event: Event) => {
    const press = event as PointerEvent;
    if (
      press.pointerId === pointer &&
      (press.clientX < bounds.left ||
        press.clientX > bounds.right ||
        press.clientY < bounds.top ||
        press.clientY > bounds.bottom)
    )
      release();
  };
  const end = (event: Event) => {
    if ((event as PointerEvent).pointerId === pointer) release();
  };
  trigger.addEventListener('pointerdown', down);
  trigger.addEventListener('pointermove', move);
  trigger.addEventListener('pointerup', end);
  trigger.addEventListener('pointercancel', end);
  trigger.addEventListener('lostpointercapture', end);
  return () => {
    release();
    trigger.removeEventListener('pointerdown', down);
    trigger.removeEventListener('pointermove', move);
    trigger.removeEventListener('pointerup', end);
    trigger.removeEventListener('pointercancel', end);
    trigger.removeEventListener('lostpointercapture', end);
  };
}

/** Reads the trigger ref supplied by React Aria without adding a wrapper element. */
export function MenuTriggerPress({ children }: { children: ReactNode }) {
  const triggerRef = useSlottedContext(PopoverContext)?.triggerRef;
  useEffect(() => {
    const trigger = triggerRef?.current;
    if (trigger) return captureOpeningPress(trigger);
  }, [triggerRef]);
  return children;
}
