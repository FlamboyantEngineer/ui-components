import { type HTMLAttributes, type RefObject } from 'react';
import type { ToastSwipeDirection } from './use-toast-swipe.js';
export interface ToastStackSettings {
    /** The direction a toast is swiped to dismiss it. Defaults to `right`. */
    swipeDirection?: ToastSwipeDirection | undefined;
    /** Pixels a swipe must travel to dismiss a toast. Defaults to 50. */
    swipeThreshold?: number | undefined;
}
interface ToastStackValue {
    swipeDirection: ToastSwipeDirection;
    swipeThreshold: number;
    /** Measured toast heights by key. */
    heights: ReadonlyMap<string, number>;
    report: (key: string, height: number | undefined) => void;
    /** The region is hovered or holds focus, so its toasts' timers stay paused. */
    isPaused: boolean;
}
/** A toast's place in its stack. */
export interface ToastStackPosition {
    /** 0 for the newest visible toast. */
    index: number;
    /** The summed height of the newer visible toasts, in pixels. */
    offset: number;
    swipeDirection: ToastSwipeDirection;
    swipeThreshold: number;
}
export declare const ToastStackProvider: import("react").Provider<ToastStackValue>;
/**
 * The stack a region or list provides: its swipe settings, its toasts' measured heights and whether
 * their timers are paused.
 */
export declare function useToastStack({ swipeDirection, swipeThreshold }: ToastStackSettings, isPaused?: boolean): ToastStackValue;
/** Whether the toast's stack holds its timers: its region is hovered or holds focus. */
export declare function useIsStackPaused(): boolean;
/** Measures the toast in `ref` into its stack and returns its index and offset there. */
export declare function useToastStackPosition(key: string, ref: RefObject<HTMLElement | null>): ToastStackPosition;
/**
 * Whether the pointer is over the region or focus is inside it, on the region itself included: the
 * stack is expanded and its timers pause. React Aria's hover and focus-within also end when a toast
 * under the pointer or holding focus leaves and the pointer or focus moves on; a region left without
 * toasts has neither. `regionProps` go on the region element.
 */
export declare function useStackExpanded(hasToasts: boolean): {
    isExpanded: boolean;
    regionProps: HTMLAttributes<HTMLElement>;
};
export {};
//# sourceMappingURL=toast-stack.d.ts.map