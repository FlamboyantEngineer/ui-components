import { useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isThenable } from '../../utils/is-thenable.js';
import { toErrorMessage } from '../../utils/to-error-message.js';
function startState(scope) {
    return { scope, attempt: 0, running: null, failure: null };
}
/**
 * The requests of a pending card, one at a time. The state belongs to `scope`, the card's id
 * while it is pending: it starts over when the card changes id or leaves pending, so a request
 * sent for one card never marks or fails another. A callback that returns no promise leaves no
 * trace unless it throws.
 */
export function useQuestionRequest(scope) {
    const strings = useUiStrings();
    const [state, setState] = useState(() => startState(scope));
    const attempts = useRef(0);
    // The request in flight, which refuses a second one for the card before the first renders.
    const inFlight = useRef(null);
    let current = state;
    if (state.scope !== scope) {
        current = startState(scope);
        setState(current);
    }
    const run = (kind, action) => {
        if (scope === undefined || current.running || inFlight.current?.scope === scope)
            return;
        attempts.current += 1;
        const attempt = attempts.current;
        const fallback = kind === 'submit' ? strings.questionSubmitFailed : strings.actionFailed;
        const settle = (failure) => {
            if (inFlight.current?.attempt === attempt)
                inFlight.current = null;
            setState((last) => (last.attempt === attempt ? { ...last, running: null, failure } : last));
        };
        let result;
        try {
            result = action();
        }
        catch (error) {
            setState({ scope, attempt, running: null, failure: toErrorMessage(error, fallback) });
            return;
        }
        if (!isThenable(result)) {
            setState((last) => (last.failure === null ? last : { ...last, attempt, failure: null }));
            return;
        }
        inFlight.current = { scope, attempt };
        setState({ scope, attempt, running: kind, failure: null });
        result.then(() => settle(null), (error) => settle(toErrorMessage(error, fallback)));
    };
    return { running: current.running, failure: current.failure, run };
}
//# sourceMappingURL=chat-question-request.js.map