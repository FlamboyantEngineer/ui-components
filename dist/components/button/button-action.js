import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useRef, useState } from 'react';
import { useActiveAfter } from '../../utils/use-delayed-flag.js';
/**
 * Runs `action` unless `blocked`, keeping `setPending(true)` until it settles. Resolves to whether the
 * action ran. A rejection reaches `onError`, or is rethrown.
 */
export async function runPendingAction(options) {
    if (options.blocked)
        return false;
    options.setPending(true);
    try {
        await options.action?.();
        return true;
    }
    catch (error) {
        if (options.onError) {
            options.onError(error);
            return false;
        }
        throw error;
    }
    finally {
        options.setPending(false);
    }
}
/**
 * The pending lifecycle of a control that runs actions: `pending` is the caller's `isPending`, else
 * whether an action the control started is unsettled. `run` starts an action unless the control is
 * disabled or pending, and `isBusy` says, ahead of the next render, whether one is still running.
 */
export function usePendingAction({ isPending, isDisabled, onError, }) {
    const [internalPending, setInternalPending] = useState(false);
    const running = useRef(false);
    const pending = isPending ?? internalPending;
    const run = useCallback((action) => {
        if (running.current)
            return;
        if (isDisabled || pending)
            return;
        let result;
        try {
            result = action?.();
        }
        catch (error) {
            if (!onError)
                throw error;
            onError(error);
            return;
        }
        if (!result ||
            typeof result !== 'object' ||
            !('then' in result) ||
            typeof result.then !== 'function')
            return;
        void runPendingAction({
            blocked: false,
            setPending: (next) => {
                running.current = next;
                setInternalPending(next);
            },
            action: () => result,
            onError,
        });
    }, [isDisabled, pending, onError]);
    return { pending, run, isBusy: () => running.current || pending };
}
/**
 * Draws a submit or reset button that keeps its type while pending and cancels the native
 * activation of a click that arrives while `isBusy`. React Aria turns a pending submit button into a
 * plain one, which in a browser lands before the click that started the action submits; a click
 * guard instead lets that click submit and refuses the repeats, also during `pendingDelay`.
 */
function guardActivation(type, isBusy, render) {
    return (props, state) => {
        const guarded = {
            ...props,
            type,
            onClick: (event) => {
                if (isBusy())
                    event.preventDefault();
                props.onClick?.(event);
            },
        };
        return render ? render(guarded, state) : _jsx("button", { ...guarded });
    };
}
/** Runs a promise-returning press and keeps native submit activation guarded while it settles. */
export function useButtonAction({ onPress, onError, isPending, isDisabled = false, pendingDelay = 0, type, render, href, }) {
    const { pending, run, isBusy } = usePendingAction({ isPending, isDisabled, onError });
    const showsPending = useActiveAfter(pending, pendingDelay);
    const handlePress = useCallback((event) => run(onPress ? () => onPress(event) : undefined), [run, onPress]);
    const submits = !isDisabled && (type === 'submit' || type === 'reset');
    return {
        onPress: href === undefined ? handlePress : onPress,
        isPending: href === undefined && showsPending,
        render: submits ? guardActivation(type, isBusy, render) : render,
    };
}
//# sourceMappingURL=button-action.js.map