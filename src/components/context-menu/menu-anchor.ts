import { useMemo, useState, type RefObject } from 'react';
import { useLocale, type Placement } from 'react-aria-components';
import { createOverlayPointRect } from '../../utils/overlay-position.js';
import type { MenuPopoverProps } from '../menu/menu.js';
import { isElementAnchor, type MenuAnchor } from './menu-controller.js';

export interface MenuAnchorOptions {
  anchor: MenuAnchor | null;
  /** Placement against an element anchor. */
  placement: Placement;
  /** The element a point menu belongs to (React Aria closes the menu when its scroll parent scrolls). */
  owner: RefObject<Element | null>;
}

export type MenuAnchorProps = Pick<
  MenuPopoverProps,
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
 * and after a viewport point. React Aria repositions an open popover when its placement changes, so
 * a moved point alternates between the logical and physical spelling of the same placement, which
 * moves the menu without reopening it.
 */
export function useMenuAnchor({ anchor, placement, owner }: MenuAnchorOptions): MenuAnchorProps {
  const { direction } = useLocale();
  const element = anchor && isElementAnchor(anchor) ? anchor : null;
  const point = anchor && !isElementAnchor(anchor) ? anchor : null;
  const pointKey = point ? `${point.x},${point.y}` : '';
  const [spelling, setSpelling] = useState({ key: pointKey, physical: false });
  if (spelling.key !== pointKey) setSpelling({ key: pointKey, physical: !spelling.physical });

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
  const physical: Placement = direction === 'rtl' ? 'bottom right' : 'bottom left';
  return {
    triggerRef,
    getTargetRect,
    placement: spelling.physical ? physical : 'bottom start',
    offset: pointGap,
  };
}
