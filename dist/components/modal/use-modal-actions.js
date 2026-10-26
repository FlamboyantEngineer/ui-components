import { toErrorMessage } from '../../utils/to-error-message.js';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { OverlayTriggerStateContext } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { runPendingAction } from '../button/button.js';
/**
 * Runs the footer actions of the enclosing modal. Each opening gets a generation, so a request from
 * an earlier opening never releases, fails or closes a later one, and closing clears the state.
 */
export function useModalActions({ primaryAction, secondaryAction, }) {
    const state = useContext(OverlayTriggerStateContext);
    const strings = useUiStrings();
    const [running, setRunning] = useState(null);
    // Refuses a second request issued in the same turn, before the pending state renders.
    const runningRef = useRef(null);
    const [failure, setFailure] = useState(null);
    const generation = useRef(0);
    const isOpen = state?.isOpen ?? true;
    useEffect(() => {
        if (isOpen)
            return;
        generation.current += 1;
        runningRef.current = null;
        setRunning(null);
        setFailure(null);
    }, [isOpen]);
    useEffect(() => () => {
        generation.current += 1;
    }, []);
    const closeOpening = useCallback((opening) => {
        if (generation.current === opening)
            state?.close();
    }, [state]);
    const close = useCallback(() => closeOpening(generation.current), [closeOpening]);
    const actionIn = (slot) => slot === 'primary' ? primaryAction : secondaryAction;
    const canRun = (slot) => {
        const action = actionIn(slot);
        return Boolean(action && !action.isDisabled && !action.isPending && !runningRef.current);
    };
    const run = (slot) => {
        const opening = generation.current;
        const onPress = actionIn(slot)?.onPress;
        void runPendingAction({
            blocked: !canRun(slot),
            setPending: (pending) => {
                if (generation.current !== opening)
                    return;
                runningRef.current = pending ? slot : null;
                setRunning(pending ? slot : null);
                if (pending)
                    setFailure(null);
            },
            action: onPress ? () => onPress(() => closeOpening(opening)) : undefined,
            onError: (error) => {
                if (generation.current === opening)
                    setFailure(toErrorMessage(error, strings.actionFailed));
            },
        });
    };
    return { running, failure, close, canRun, run };
}
//# sourceMappingURL=use-modal-actions.js.map