// Sending a composer's value: at once, or once the host accepts it (specs/MESSAGE-COMPOSER.md,
// UIC-MESSAGE-COMPOSER-3.9).
import { useRef, useState } from 'react';
import { useUiStorage } from '../../core/provider.js';
import { isThenable } from '../../utils/is-thenable.js';
import { useLatest } from '../../utils/use-latest.js';
/**
 * Sends through `onSubmit`. A promise it returns holds sending from the same draft until it
 * settles: once it resolves the draft empties, unless the reader has changed it since, and where
 * the draft was another key's (the conversation changed) only that key's stored draft empties. A
 * throw or a rejection keeps the draft and goes to `onSubmitError`, or is rethrown without it.
 */
export function useSubmission(options) {
    const storage = useUiStorage();
    const latest = useLatest(options);
    const scope = options.persistKey ?? '';
    const [waiting, setWaiting] = useState(() => new Set());
    const inFlight = useRef(new Set());
    const fail = (error) => {
        const onSubmitError = latest.current.onSubmitError;
        if (!onSubmitError)
            throw error;
        onSubmitError(error);
    };
    const clear = (key, sent) => {
        const { format, persistKey, draft, setDraft } = latest.current;
        if (persistKey === key) {
            if (format.codec.stringify(draft) === sent)
                setDraft(format.empty);
        }
        else if (key !== undefined && storage.getItem(key) === sent) {
            storage.setItem(key, format.codec.stringify(format.empty));
        }
    };
    const track = (isWaiting) => {
        if (isWaiting)
            inFlight.current.add(scope);
        else
            inFlight.current.delete(scope);
        setWaiting((current) => {
            const next = new Set(current);
            if (isWaiting)
                next.add(scope);
            else
                next.delete(scope);
            return next;
        });
    };
    const send = (value, clearsDraft) => {
        if (inFlight.current.has(scope))
            return;
        let result;
        try {
            result = options.onSubmit?.(value);
        }
        catch (error) {
            fail(error);
            return;
        }
        if (!isThenable(result)) {
            if (clearsDraft)
                options.setDraft(options.format.empty);
            return;
        }
        const key = options.persistKey;
        const sent = options.format.codec.stringify(value);
        track(true);
        void Promise.resolve(result).then(() => {
            track(false);
            if (clearsDraft)
                clear(key, sent);
        }, (error) => {
            track(false);
            fail(error);
        });
    };
    return { isSubmitting: waiting.has(scope), send };
}
//# sourceMappingURL=use-submission.js.map