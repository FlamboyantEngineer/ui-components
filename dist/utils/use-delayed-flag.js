import { useEffect, useState } from 'react';
/** True once an active flag's delay elapses; an absent delay disables the timer. */
export function useDelayedFlag(isActive, delay) {
    const [isElapsed, setElapsed] = useState(false);
    useEffect(() => {
        if (!isActive || delay === undefined)
            return undefined;
        const timer = setTimeout(() => setElapsed(true), delay);
        return () => {
            clearTimeout(timer);
            setElapsed(false);
        };
    }, [isActive, delay]);
    return isActive && isElapsed;
}
/** An active flag held back until it has stayed active for `delay` milliseconds; at once without one. */
export function useActiveAfter(isActive, delay) {
    const isElapsed = useDelayedFlag(isActive, delay > 0 ? delay : undefined);
    return delay > 0 ? isElapsed : isActive;
}
//# sourceMappingURL=use-delayed-flag.js.map