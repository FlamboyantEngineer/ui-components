import { useMemo, useState } from 'react';
import { useLocale } from '../../primitives/index.js';
import { createOverlayPointRect } from '../../utils/overlay-position.js';
import { isElementAnchor } from './menu-controller.js';
const pointGap = 2;
/** A zero-size rect at a viewport point, in the shape React Aria's positioning reads. */
function toPointRect(x, y) {
    const rect = createOverlayPointRect(x, y);
    return { ...rect, x, y, toJSON: () => rect };
}
/**
 * The popover props that place a menu at its anchor: against an element with `placement`, or below
 * and after a viewport point. React Aria repositions an open popover when its placement changes, so
 * a moved point alternates between the logical and physical spelling of the same placement, which
 * moves the menu without reopening it.
 */
export function useMenuAnchor({ anchor, placement, owner }) {
    const { direction } = useLocale();
    const element = anchor && isElementAnchor(anchor) ? anchor : null;
    const point = anchor && !isElementAnchor(anchor) ? anchor : null;
    const pointKey = point ? `${point.x},${point.y}` : '';
    const [spelling, setSpelling] = useState({ key: pointKey, physical: false });
    if (spelling.key !== pointKey)
        setSpelling({ key: pointKey, physical: !spelling.physical });
    const triggerRef = useMemo(() => ({
        get current() {
            return element ?? owner.current;
        },
    }), [element, owner]);
    const pointX = point?.x;
    const pointY = point?.y;
    const getTargetRect = useMemo(() => pointX === undefined || pointY === undefined ? undefined : () => toPointRect(pointX, pointY), [pointX, pointY]);
    if (!getTargetRect)
        return { triggerRef, placement };
    const physical = direction === 'rtl' ? 'bottom right' : 'bottom left';
    return {
        triggerRef,
        getTargetRect,
        placement: spelling.physical ? physical : 'bottom start',
        offset: pointGap,
    };
}
//# sourceMappingURL=menu-anchor.js.map