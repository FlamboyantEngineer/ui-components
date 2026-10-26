import { toErrorMessage } from '../../utils/to-error-message.js';
import { useEffect, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { runPendingAction } from '../button/button.js';
/** A check's answer that keeps the reader on the step: `false`, or a message to show. */
function toFailure(result) {
    if (result === false)
        return { message: null };
    return typeof result === 'string' && result !== '' ? { message: result } : null;
}
function withMark(keys, key, isMarked) {
    const next = new Set(keys);
    if (isMarked)
        next.add(key);
    else
        next.delete(key);
    return next;
}
/** Where each step stands: settled before the shown one, upcoming after it. */
function toStatuses(steps, { index, skipped, hasFailed }) {
    return steps.map((step, position) => {
        if (position > index)
            return 'upcoming';
        if (position === index)
            return hasFailed ? 'error' : 'current';
        return skipped.has(step.id) ? 'skipped' : 'complete';
    });
}
/**
 * The navigation of a wizard: the shown step (controlled or not), the steps skipped on the way, the
 * pending check and its failure, and focus moving to the step's heading after each move.
 */
export function useWizardNavigation(options) {
    const { steps, onFinish } = options;
    const strings = useUiStrings();
    const [currentId, setCurrentId] = useControllableState(options.currentId, options.defaultCurrentId ?? steps[0]?.id, (id) => (id === undefined ? undefined : options.onCurrentIdChange?.(id)));
    const [skipped, setSkipped] = useState(() => new Set());
    const [failure, setFailure] = useState(null);
    const [isPending, setPending] = useState(false);
    const headingRef = useRef(null);
    const movedRef = useRef(false);
    // Refuses a second submit in the same turn, before the pending state renders.
    const runningRef = useRef(false);
    const index = Math.max(0, steps.findIndex((step) => step.id === currentId));
    useEffect(() => {
        if (!movedRef.current)
            return;
        movedRef.current = false;
        headingRef.current?.focus();
    }, [currentId]);
    const goTo = (id) => {
        setFailure(null);
        movedRef.current = true;
        setCurrentId(id);
    };
    const advance = async (step) => {
        const stay = toFailure(await step.validate?.());
        if (stay)
            return setFailure(stay);
        setSkipped((keys) => withMark(keys, step.id, false));
        const next = steps[index + 1];
        if (next)
            goTo(next.id);
        else
            await onFinish?.();
    };
    const submit = (event) => {
        event.preventDefault();
        const step = steps[index];
        void runPendingAction({
            blocked: runningRef.current || !step,
            setPending: (pending) => {
                runningRef.current = pending;
                setPending(pending);
                if (pending)
                    setFailure(null);
            },
            action: step ? () => advance(step) : undefined,
            onError: (error) => setFailure({ message: toErrorMessage(error, strings.actionFailed) }),
        });
    };
    const skip = () => {
        const step = steps[index];
        const next = steps[index + 1];
        if (!step || !next)
            return;
        setSkipped((keys) => withMark(keys, step.id, true));
        goTo(next.id);
    };
    const statuses = toStatuses(steps, { index, skipped, hasFailed: failure !== null });
    return { index, statuses, isPending, failure, headingRef, submit, goTo, skip };
}
//# sourceMappingURL=wizard-navigation.js.map