import type { ReactNode } from 'react';
import type { Tone } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';
export type ToastTone = Extract<Tone, 'info' | 'success' | 'warning' | 'danger'>;
/** An inline action. Pressing it runs `onAction`, then dismisses the toast. */
export interface ToastAction {
    label: string;
    onAction: () => void;
}
/** What a toast shows. */
export interface ToastContent {
    /** Defaults to `info`. `warning` and `danger` are announced assertively, the others politely. */
    tone?: ToastTone | undefined;
    title: ReactNode;
    description?: ReactNode;
    /** Replaces the tone's glyph: a built-in glyph name or any icon node. */
    icon?: IconSource;
    action?: ToastAction | undefined;
    /** Work is in progress: a busy indicator replaces the glyph and the toast has no timeout. */
    isPending?: boolean | undefined;
}
export interface ToastAddOptions {
    /** Called once the toast has closed, unless it was replaced or cleared. */
    onClose?: (() => void) | undefined;
    /**
     * Milliseconds before the toast closes itself; `0` keeps it until it is dismissed. Defaults to the
     * queue's `defaultTimeout`, or to `0` for a pending toast. Hovering or focusing the toasts pauses
     * every timer.
     */
    timeout?: number | undefined;
    /** A caller key: adding a toast with the key of one still queued replaces it. */
    id?: string | undefined;
}
export interface ToastUpdateOptions {
    /** A new lifetime in milliseconds, counted from the update; `0` keeps the toast until dismissed. */
    timeout?: number | undefined;
}
/** The contents of a promise toast: while it runs, once it resolves, and once it rejects. */
export interface ToastPromiseContents<T> {
    pending: ToastContent;
    /** Defaults to the `success` tone. */
    success: ToastContent | ((value: T) => ToastContent);
    /** Defaults to the `danger` tone. */
    error: ToastContent | ((error: unknown) => ToastContent);
}
export interface ToastQueueOptions {
    /** How many toasts show at once; the rest wait their turn. Defaults to no limit. */
    maxVisibleToasts?: number | undefined;
    /** Timeout for toasts added without one, in milliseconds. Defaults to 5000; `0` disables it. */
    defaultTimeout?: number | undefined;
}
/**
 * The toasts to show, newest first. The host creates one with `createToastQueue`, renders it in a
 * `ToastRegion` and calls `add` whenever something happened; `close` and `clear` remove toasts early.
 */
export interface ToastQueue {
    /** Adds a toast and returns its key. */
    add: (content: ToastContent, options?: ToastAddOptions) => string;
    /** Changes a queued toast in place, keeping its position and, unless told otherwise, its timer. */
    update: (key: string, content: ToastContent, options?: ToastUpdateOptions) => void;
    /** Adds a pending toast that turns into a success or error toast when `promise` settles. */
    promise: <T>(promise: Promise<T>, contents: ToastPromiseContents<T>, options?: ToastAddOptions) => string;
    /** Closes one toast, calling its `onClose` once its exit ends. */
    close: (key: string) => void;
    /** Removes every toast at once, without calling their `onClose`. */
    clear: () => void;
    /** The timeout of toasts added without one, in milliseconds. */
    readonly defaultTimeout: number;
}
/**
 * The building block's queue a library queue drives: it orders the toasts, shows the visible ones
 * and runs their timers, all of which close through `close`.
 */
export interface ToastStore {
    add: (content: ToastContent, options: {
        timeout: number;
        onClose: () => void;
    }) => string;
    close: (key: string) => void;
    clear: () => void;
    pauseAll: () => void;
    resumeAll: () => void;
}
/** What a queued toast shows now, how long it lives and whether it is still open. */
export interface ToastSnapshot {
    content: ToastContent;
    /** The lifetime in milliseconds; `0` for none. */
    timeout: number;
    /** Counts lifetime restarts, so the toast restarts its timer even with the same timeout. */
    lifetime: number;
    /** False once the toast is closing and playing its exit. */
    isOpen: boolean;
}
/** How a rendered toast follows its queue entry. */
export interface ToastLifecycle {
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => ToastSnapshot;
    /** Counts the toast as rendered, so closing it waits for its exit; returns the release. */
    mount: () => () => void;
    /** Removes the toast from the queue once its exit has ended. */
    finishExit: () => void;
}
/** The lifecycle of a toast, which every toast gets as `createToastQueue` adds it. */
export declare function getToastLifecycle(content: ToastContent): ToastLifecycle;
/**
 * A toast queue over a building-block queue, adding a default timeout, replacement by `id`,
 * in-place updates, promise toasts and closing exits. Every close (its timer, its dismiss button,
 * its action or `close`) first lets a rendered toast play its exit, then removes it.
 */
export declare function createQueueOverStore(ariaQueue: ToastStore, { defaultTimeout }?: ToastQueueOptions): ToastQueue;
//# sourceMappingURL=toast-queue.d.ts.map