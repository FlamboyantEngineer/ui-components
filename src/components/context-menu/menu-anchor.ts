import { useMemo, type RefObject } from 'react';
import type { Placement } from '../../core/props.js';
import { createOverlayPointRect } from '../../utils/overlay-position.js';
import type { MenuOverlayProps } from '../menu/menu.js';
import type { MenuAnchor } from './menu-controller.js';

/** Whether an anchor is an element rather than a point. */
export function isElementAnchor(anchor: MenuAnchor): anchor is Element {
  return typeof (anchor as Element).getBoundingClientRect === 'function';
}

interface MenuAnchorOptions {
  anchor: MenuAnchor | null;
  /** Placement against an element anchor. */
  placement: Placement;
  /** The element a point menu belongs to (React Aria closes the menu when its scroll parent scrolls). */
  owner: RefObject<Element | null>;
}

type MenuAnchorProps = Pick<
  MenuOverlayProps,
  'triggerRef' | 'getTargetRect' | 'placement' | 'offset'
>;

const pointGap = 2;

/** A zero-size rect at a viewport point, in the shape React Aria's positioning reads. */
function toPointRect(x: number, y: number): DOMRect {
  const rect = createOverlayPointRect(x, y);
  return { ...rect, x, y, toJSON: () => rect };
}

/**
 * The popover props that place a menu at its anchor: against an element with `placement`, or below
 * and after a viewport point. A moved point is a new `getTargetRect`, which `MenuOverlay` follows
 * without reopening the menu.
 */
export function useMenuAnchor({ anchor, placement, owner }: MenuAnchorOptions): MenuAnchorProps {
  const element = anchor && isElementAnchor(anchor) ? anchor : null;
  const point = anchor && !isElementAnchor(anchor) ? anchor : null;

  const triggerRef = useMemo<RefObject<Element | null>>(
    () => ({
      get current() {
        return element ?? owner.current;
      },
    }),
    [element, owner],
  );
  const pointX = point?.x;
  const pointY = point?.y;
  const getTargetRect = useMemo(
    () =>
      pointX === undefined || pointY === undefined ? undefined : () => toPointRect(pointX, pointY),
    [pointX, pointY],
  );

  if (!getTargetRect) return { triggerRef, placement };
  return { triggerRef, getTargetRect, placement: 'bottom start', offset: pointGap };
}
