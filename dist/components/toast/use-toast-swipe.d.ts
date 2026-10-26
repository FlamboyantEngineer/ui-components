/** The direction a toast is swiped to dismiss it. */
export type ToastSwipeDirection = 'up' | 'down' | 'left' | 'right';
export interface ToastSwipeOptions {
    direction: ToastSwipeDirection;
    /** Pixels a release must pass to dismiss. */
    threshold: number;
    onDismiss: () => void;
}
/**
 * Pointer handlers that drag a toast toward `direction`. While dragging it is swiping and its
 * travel is published as `--ui-toast-swipe-x` or `--ui-toast-swipe-y`; a release past `threshold`
 * dismisses it and keeps the travel for its exit, a shorter one returns it to rest.
 */
export declare function useToastSwipe({ direction, threshold, onDismiss }: ToastSwipeOptions): {
    swipeProps: {
        onPointerDown: (event: import("react").PointerEvent<HTMLElement>) => void;
        onPointerMove: (event: import("react").PointerEvent<HTMLElement>) => void;
        onPointerUp: (event: import("react").PointerEvent<HTMLElement>) => void;
        onPointerCancel: (event: import("react").PointerEvent<HTMLElement>) => void;
        onLostPointerCapture: (event: import("react").PointerEvent<HTMLElement>) => void;
    };
    isSwiping: boolean;
    style: Record<string, string>;
};
//# sourceMappingURL=use-toast-swipe.d.ts.map