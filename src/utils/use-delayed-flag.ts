import { useEffect, useState } from 'react';

/** True once an active flag's delay elapses; an absent delay disables the timer. */
export function useDelayedFlag(isActive: boolean, delay: number | undefined): boolean {
  const [isElapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (!isActive || delay === undefined) return undefined;
    const timer = setTimeout(() => setElapsed(true), delay);
    return () => {
      clearTimeout(timer);
      setElapsed(false);
    };
  }, [isActive, delay]);
  return isActive && isElapsed;
}
