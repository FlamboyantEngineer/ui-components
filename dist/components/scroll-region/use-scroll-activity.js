import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
/** A timer that runs its latest callback once after `delay`, restarting on each start. */
function useRestartingTimer() {
    const timer = useRef(undefined);
    const cancel = useCallback(() => clearTimeout(timer.current), []);
    const start = useCallback((delay, callback) => {
        cancel();
        timer.current = setTimeout(callback, delay);
    }, [cancel]);
    useEffect(() => cancel, [cancel]);
    return useMemo(() => ({ start, cancel }), [start, cancel]);
}
/**
 * Whether the region is scrolling or hovered, and whether its overlay scrollbars show for the
 * visibility mode. Scrolling and a pointer that left keep them shown for `hideDelay` milliseconds.
 */
export function useScrollActivity(visibility, hideDelay) {
    const [isScrolling, setScrolling] = useState(false);
    const [isHovering, setHovering] = useState(false);
    const [isLingering, setLingering] = useState(false);
    const scrollTimer = useRestartingTimer();
    const leaveTimer = useRestartingTimer();
    const onScroll = useCallback(() => {
        setScrolling(true);
        scrollTimer.start(hideDelay, () => setScrolling(false));
    }, [hideDelay, scrollTimer]);
    const onPointerEnter = useCallback((event) => {
        if (event.pointerType === 'touch')
            return;
        leaveTimer.cancel();
        setHovering(true);
        setLingering(false);
    }, [leaveTimer]);
    const onPointerLeave = useCallback((event) => {
        if (event.pointerType === 'touch')
            return;
        setHovering(false);
        setLingering(true);
        leaveTimer.start(hideDelay, () => setLingering(false));
    }, [hideDelay, leaveTimer]);
    const isScrollbarVisible = visibility === 'scroll'
        ? isScrolling
        : visibility === 'hover'
            ? isHovering || isLingering || isScrolling
            : true;
    return { isScrolling, isHovering, isScrollbarVisible, onScroll, onPointerEnter, onPointerLeave };
}
//# sourceMappingURL=use-scroll-activity.js.map