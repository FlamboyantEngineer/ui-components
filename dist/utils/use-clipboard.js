import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText } from './clipboard.js';
/** How long the outcome of a copy shows before it returns to idle. */
export const DEFAULT_COPY_TIMEOUT = 2000;
/**
 * Copies text and keeps the outcome as `status` (`copied` or `failed`) for `timeout` milliseconds,
 * for feedback such as a check mark. A new copy restarts the timeout; unmounting clears it.
 */
export function useClipboard({ timeout = DEFAULT_COPY_TIMEOUT, clipboard, fallback, } = {}) {
    const [status, setStatus] = useState('idle');
    const timer = useRef(null);
    const isMounted = useRef(true);
    const request = useRef(0);
    const clearTimer = useCallback(() => {
        if (timer.current !== null)
            clearTimeout(timer.current);
        timer.current = null;
    }, []);
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            request.current += 1;
            clearTimer();
        };
    }, [clearTimer]);
    const reset = useCallback(() => {
        request.current += 1;
        clearTimer();
        setStatus('idle');
    }, [clearTimer]);
    const copy = useCallback(async (text) => {
        const current = ++request.current;
        const copied = await copyText(text, { clipboard, fallback });
        if (!isMounted.current || current !== request.current)
            return copied;
        clearTimer();
        setStatus(copied ? 'copied' : 'failed');
        timer.current = setTimeout(() => {
            timer.current = null;
            setStatus('idle');
        }, timeout);
        return copied;
    }, [clipboard, fallback, timeout, clearTimer]);
    return { copy, status, reset };
}
//# sourceMappingURL=use-clipboard.js.map