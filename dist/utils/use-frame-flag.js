import { useLayoutEffect, useState } from 'react';
/** Lets focus-driven scrolling settle before an overlay subscribes to scroll dismissal. */
export function useFrameFlag(isActive, ownerRef) {
    const [isReady, setReady] = useState(false);
    useLayoutEffect(() => {
        setReady(false);
        if (!isActive)
            return;
        const view = ownerRef.current?.ownerDocument.defaultView ?? window;
        let isCurrent = true;
        const frame = view.requestAnimationFrame(() => {
            if (isCurrent)
                setReady(true);
        });
        return () => {
            isCurrent = false;
            view.cancelAnimationFrame(frame);
        };
    }, [isActive, ownerRef]);
    return isActive && isReady;
}
//# sourceMappingURL=use-frame-flag.js.map