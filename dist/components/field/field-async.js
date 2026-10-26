// The asynchronous check of a field: debounced, aborted when the value moves on.
import { useEffect, useRef, useState } from 'react';
import { toFieldValueKey } from './field-value.js';
import { toIssueList } from './field-validation.js';
/**
 * Runs `validateAsync` once the value has stayed unchanged for `debounce` milliseconds. A result
 * counts only for the value it checked: a newer value aborts the older check. A check that rejects
 * reports no issue.
 */
export function useAsyncCheck(value, options) {
    const { validateAsync, debounce, isSkipped } = options;
    const key = toFieldValueKey(value);
    const [result, setResult] = useState(null);
    const latest = useRef({ value, validateAsync });
    latest.current = { value, validateAsync };
    const isEnabled = Boolean(validateAsync) && !isSkipped;
    useEffect(() => {
        if (!isEnabled)
            return;
        const controller = new AbortController();
        const settle = (issues) => {
            if (!controller.signal.aborted)
                setResult({ key, issues: toIssueList(issues) });
        };
        const timer = setTimeout(() => {
            const check = latest.current;
            check.validateAsync?.(check.value, controller.signal).then(settle, () => settle(null));
        }, debounce);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [key, isEnabled, debounce]);
    const isCurrent = result?.key === key;
    return {
        issues: isEnabled && isCurrent ? result.issues : [],
        isRunning: isEnabled && !isCurrent,
    };
}
//# sourceMappingURL=field-async.js.map