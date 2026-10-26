// One timer for every relative time on the page: each subscriber asks to be woken at a moment, and
// the clock keeps a single timeout for the earliest one.
import { useEffect, useReducer } from 'react';
const wakeTimes = new Map();
const wakeCounts = new Map();
let timer;
let timerAt = Infinity;
function findNextWake() {
    let next = Infinity;
    for (const at of wakeCounts.keys())
        next = Math.min(next, at);
    return next;
}
function schedule(next = findNextWake()) {
    if (next === timerAt)
        return;
    clearTimeout(timer);
    timer = undefined;
    timerAt = next;
    if (next !== Infinity)
        timer = setTimeout(fire, Math.max(next - Date.now(), 0));
}
function removeWake(wake) {
    const at = wakeTimes.get(wake);
    if (at === undefined)
        return undefined;
    wakeTimes.delete(wake);
    const count = wakeCounts.get(at);
    if (count === 1)
        wakeCounts.delete(at);
    else
        wakeCounts.set(at, count - 1);
    return at;
}
function fire() {
    timer = undefined;
    timerAt = Infinity;
    const now = Date.now();
    for (const [wake, at] of [...wakeTimes]) {
        if (at > now || wakeTimes.get(wake) !== at)
            continue;
        removeWake(wake);
        wake();
    }
    schedule();
}
/** Wakes `wake` once at `at` (epoch milliseconds); the returned function cancels it. */
export function subscribeClock(at, wake) {
    const previous = removeWake(wake);
    wakeTimes.set(wake, at);
    wakeCounts.set(at, (wakeCounts.get(at) ?? 0) + 1);
    if (at < timerAt)
        schedule(at);
    else if (previous === timerAt && !wakeCounts.has(timerAt))
        schedule();
    return () => {
        const cancelled = removeWake(wake);
        if (cancelled === timerAt && !wakeCounts.has(timerAt))
            schedule();
    };
}
/** Renders the calling component again `delay` milliseconds from now, on the shared clock. */
export function useClockTick(delay) {
    const [tick, wake] = useReducer((count) => count + 1, 0);
    useEffect(() => {
        if (delay === null)
            return undefined;
        return subscribeClock(Date.now() + delay, wake);
    }, [delay, tick]);
}
//# sourceMappingURL=relative-time-clock.js.map