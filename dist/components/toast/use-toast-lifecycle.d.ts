import type { ToastLifecycle, ToastSnapshot } from './toast-queue.js';
/** The building block's timer of a shown toast, which region hover and focus also pause. */
export interface ToastTimer {
    reset: (delay: number) => void;
    pause: () => void;
    /** Runs on with the time that remained; resuming a running timer starts a second timeout. */
    resume: () => void;
}
/** The toast's current content and lifetime, as its queue entry holds them. */
export declare function useToastSnapshot(lifecycle: ToastLifecycle): ToastSnapshot;
/**
 * Runs the toast's timer for its current lifetime while it is shown and open, and restarts it when
 * an update gives a new lifetime. While `isPaused` (its region is hovered or holds focus) the timer
 * holds, also when it starts or restarts meanwhile, and runs on with the time that remained after.
 */
export declare function useToastTimer(timer: ToastTimer | undefined, snapshot: ToastSnapshot, isPaused: boolean): void;
/** Registers the rendered toast with its entry and removes it from the queue once it has exited. */
export declare function useToastPresence(lifecycle: ToastLifecycle, isMounted: boolean): void;
//# sourceMappingURL=use-toast-lifecycle.d.ts.map