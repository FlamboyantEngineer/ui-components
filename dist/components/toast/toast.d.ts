import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type ToastQueue, type ToastQueueOptions } from './toast-queue.js';
import { type ToastStackSettings } from './toast-stack.js';
export type { ToastAction, ToastAddOptions, ToastContent, ToastPromiseContents, ToastQueue, ToastQueueOptions, ToastTone, ToastUpdateOptions, } from './toast-queue.js';
export type { ToastStackSettings } from './toast-stack.js';
export type { ToastSwipeDirection } from './use-toast-swipe.js';
export interface ToastRegionProps extends ToastStackSettings, AriaLabellingProps, BaseProps {
    /** The queue whose toasts the region shows. */
    queue: ToastQueue;
}
export interface ToastListProps extends ToastStackSettings, BaseProps {
    /** The queue whose toasts the list draws. */
    queue: ToastQueue;
}
/**
 * The live region for a queue: a landmark (reachable with F6) portalled into the document body
 * while it has toasts, pausing every timer and publishing `data-expanded` while it is hovered or
 * holds focus.
 */
export declare function ToastRegion({ queue, swipeDirection, swipeThreshold, className, ...rest }: ToastRegionProps): import("react").JSX.Element;
/**
 * Draws a queue's toasts where it is rendered, without the region's portal, landmark and pausing:
 * for previews and pages that place a static stack themselves.
 */
export declare function ToastList({ queue, swipeDirection, swipeThreshold, className, ...rest }: ToastListProps): import("react").JSX.Element;
/**
 * Creates a toast queue: the host renders it in a `ToastRegion` (or a `ToastList`) and adds toasts
 * to it from anywhere.
 */
export declare function createToastQueue(options?: ToastQueueOptions): ToastQueue;
//# sourceMappingURL=toast.d.ts.map