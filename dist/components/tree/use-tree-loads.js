import { toErrorMessage } from '../../utils/to-error-message.js';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
/**
 * Loading children on demand, branch by branch: `onLoad` may return a promise; while it is pending
 * the branch is loading, and a rejection keeps its message until the next attempt.
 */
export function useTreeLoads(onLoad) {
    const strings = useUiStrings();
    const [loads, setLoads] = useState(() => new Map());
    // Requests can repeat before the loading state renders: the running ones are tracked here too.
    const running = useRef(new Set());
    const latest = useRef(onLoad);
    useLayoutEffect(() => {
        latest.current = onLoad;
    });
    return useMemo(() => {
        const settle = (key, next) => {
            if (next !== 'loading')
                running.current.delete(key);
            setLoads((current) => new Map(current).set(key, next));
        };
        return {
            load(key) {
                const run = latest.current;
                if (!run || running.current.has(key))
                    return;
                running.current.add(key);
                settle(key, 'loading');
                Promise.resolve()
                    .then(() => run(key))
                    .then(() => settle(key, 'loaded'), (error) => settle(key, { error: toErrorMessage(error, strings.actionFailed) }));
            },
            isLoading: (key) => loads.get(key) === 'loading',
            hasLoaded: (key) => loads.get(key) === 'loaded',
            errorOf(key) {
                const entry = loads.get(key);
                return typeof entry === 'object' ? entry.error : null;
            },
        };
    }, [loads, strings.actionFailed]);
}
//# sourceMappingURL=use-tree-loads.js.map