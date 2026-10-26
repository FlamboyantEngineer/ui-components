import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { capturePointer, releasePointer } from './pointer-drag.js';
/**
 * One primary-pointer gesture at a time. Moves and endings from other pointers are ignored;
 * release, cancellation, lost capture and unmount share the same capture cleanup.
 */
export function usePointerDrag(options) {
    const active = useRef(null);
    const onCancel = useRef(options.onCancel);
    useLayoutEffect(() => {
        onCancel.current = options.onCancel;
    });
    const isDisabled = options.isDisabled ?? false;
    const cancel = useCallback(() => {
        const drag = active.current;
        active.current = null;
        if (drag)
            releasePointer(drag.element, drag.pointerId);
        return drag;
    }, []);
    useEffect(() => () => {
        cancel();
    }, [cancel]);
    useLayoutEffect(() => {
        const drag = active.current;
        if (!drag || (!isDisabled && Object.is(drag.resetKey, options.resetKey)))
            return;
        cancel();
        onCancel.current?.(drag.state);
    }, [cancel, isDisabled, options.resetKey]);
    const finish = (event, isCancelled) => {
        const drag = active.current;
        if (!drag || drag.pointerId !== event.pointerId)
            return;
        cancel();
        options.onEnd?.(event, drag.state, isCancelled || isDisabled || !Object.is(drag.resetKey, options.resetKey));
    };
    return {
        onPointerDown: (event) => {
            if (isDisabled || event.button !== 0 || event.isPrimary === false || active.current)
                return;
            const state = options.onStart(event);
            if (state === null)
                return;
            active.current = {
                pointerId: event.pointerId,
                element: event.currentTarget,
                state,
                resetKey: options.resetKey,
            };
            if (options.capture !== false)
                capturePointer(event);
        },
        onPointerMove: (event) => {
            const drag = active.current;
            if (!isDisabled &&
                drag?.pointerId === event.pointerId &&
                Object.is(drag.resetKey, options.resetKey))
                options.onMove(event, drag.state);
        },
        onPointerUp: (event) => finish(event, false),
        onPointerCancel: (event) => finish(event, true),
        onLostPointerCapture: (event) => finish(event, true),
    };
}
//# sourceMappingURL=use-pointer-drag.js.map