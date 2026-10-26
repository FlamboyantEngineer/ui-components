import { type PointerEvent } from 'react';
export interface PointerDragOptions<E extends Element, T> {
    /** Refuse new gestures and release an active gesture without reporting a drop. */
    isDisabled?: boolean | undefined;
    /** A mode change abandons the current gesture without disabling future presses. */
    resetKey?: unknown;
    /** Clears a gesture's preview when a mode change abandons it; unmounting does not call this. */
    onCancel?: ((state: T) => void) | undefined;
    /** Return the gesture's starting data, or null to refuse the press. */
    onStart: (event: PointerEvent<E>) => T | null;
    onMove: (event: PointerEvent<E>, state: T) => void;
    /** Cancellation includes a lost capture; a completed release is reported only once. */
    onEnd?: ((event: PointerEvent<E>, state: T, isCancelled: boolean) => void) | undefined;
    /** False leaves capture to the caller, for a swipe that waits for a threshold. */
    capture?: boolean | undefined;
}
/**
 * One primary-pointer gesture at a time. Moves and endings from other pointers are ignored;
 * release, cancellation, lost capture and unmount share the same capture cleanup.
 */
export declare function usePointerDrag<E extends Element, T>(options: PointerDragOptions<E, T>): {
    onPointerDown: (event: PointerEvent<E>) => void;
    onPointerMove: (event: PointerEvent<E>) => void;
    onPointerUp: (event: PointerEvent<E>) => void;
    onPointerCancel: (event: PointerEvent<E>) => void;
    onLostPointerCapture: (event: PointerEvent<E>) => void;
};
//# sourceMappingURL=use-pointer-drag.d.ts.map