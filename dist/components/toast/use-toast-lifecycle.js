// How a rendered toast follows its queue entry: its current content, its timer and its exit.
import { useEffect, useSyncExternalStore } from 'react';
/** The toast's current content and lifetime, as its queue entry holds them. */
export function useToastSnapshot(lifecycle) {
    return useSyncExternalStore(lifecycle.subscribe, lifecycle.getSnapshot, lifecycle.getSnapshot);
}
/**
 * Runs the toast's timer for its current lifetime while it is shown and open, and restarts it when
 * an update gives a new lifetime. While `isPaused` (its region is hovered or holds focus) the timer
 * holds, also when it starts or restarts meanwhile, and runs on with the time that remained after.
 */
export function useToastTimer(timer, snapshot, isPaused) {
    const { timeout, lifetime, isOpen } = snapshot;
    useEffect(() => {
        if (!timer || !isOpen)
            return undefined;
        timer.reset(timeout);
        return () => timer.pause();
    }, [timer, timeout, lifetime, isOpen]);
    useEffect(() => {
        if (!timer || !isOpen)
            return;
        // Pausing first leaves a single timeout running once resumed.
        timer.pause();
        if (!isPaused)
            timer.resume();
    }, [timer, timeout, lifetime, isOpen, isPaused]);
}
/** Registers the rendered toast with its entry and removes it from the queue once it has exited. */
export function useToastPresence(lifecycle, isMounted) {
    useEffect(() => lifecycle.mount(), [lifecycle]);
    useEffect(() => {
        if (!isMounted)
            lifecycle.finishExit();
    }, [lifecycle, isMounted]);
}
//# sourceMappingURL=use-toast-lifecycle.js.map