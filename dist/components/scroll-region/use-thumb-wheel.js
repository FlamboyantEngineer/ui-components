import { useEffect } from 'react';
/** Distance, in pixels, below which a viewport counts as at its scroll edge. */
const edgeTolerance = 0.5;
/** Whether scrolling `element` by `left` and `top` pixels would move it. */
function canScrollBy(element, { left, top, rtl }) {
    const maxTop = element.scrollHeight - element.clientHeight;
    const maxLeft = element.scrollWidth - element.clientWidth;
    // A right-to-left viewport's horizontal positions run from 0 down to -maxLeft.
    const lowestLeft = rtl ? -maxLeft : 0;
    const highestLeft = rtl ? 0 : maxLeft;
    return ((top < 0 && element.scrollTop > edgeTolerance) ||
        (top > 0 && element.scrollTop < maxTop - edgeTolerance) ||
        (left < 0 && element.scrollLeft > lowestLeft + edgeTolerance) ||
        (left > 0 && element.scrollLeft < highestLeft - edgeTolerance));
}
/**
 * The wheel over a thumb scrolls its viewport. React's wheel listeners are passive, so a native one
 * keeps the page from scrolling too while the viewport can still move that way; at the viewport's
 * edge the wheel scrolls the page, as a native scrollbar's does.
 */
export function useThumbWheel(thumb, { viewport, page, rtl }) {
    useEffect(() => {
        const element = thumb.current;
        if (!element)
            return;
        const onWheel = (event) => {
            const scroller = viewport.current;
            event.stopPropagation();
            if (!scroller)
                return;
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page : 1;
            const step = { left: event.deltaX * unit, top: event.deltaY * unit, rtl };
            if (canScrollBy(scroller, step))
                event.preventDefault();
            scroller.scrollBy({ left: step.left, top: step.top });
        };
        element.addEventListener('wheel', onWheel, { passive: false });
        return () => element.removeEventListener('wheel', onWheel);
    }, [thumb, viewport, page, rtl]);
}
//# sourceMappingURL=use-thumb-wheel.js.map