import { useLayoutEffect, useRef, useState } from 'react';
import { matchCompletions } from './completion-match.js';
const NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);
const closed = {
    start: 0,
    end: 0,
    caret: 0,
    options: [],
    activeIndex: 0,
    isOpen: false,
    revision: 0,
};
function step(index, delta, count) {
    return (index + delta + count) % count;
}
function isPromise(value) {
    return typeof value?.then === 'function';
}
function isExplicitRequest(event) {
    return event.ctrlKey && !event.metaKey && !event.altKey && event.key === ' ';
}
/** The options an answer shows: filtered by the typed text, and none for a bare caret move. */
function toState(answer, lookup, revision) {
    const result = 'options' in answer ? answer : { options: answer };
    const start = result.from ?? lookup.caret - lookup.query.length;
    const end = Math.max(result.to ?? lookup.caret, lookup.caret);
    const typed = lookup.value.slice(start, lookup.caret);
    const matched = result.filter === false ? [...result.options] : matchCompletions(result.options, typed);
    const options = lookup.reason === 'move' && !typed ? [] : matched;
    const { caret } = lookup;
    return { start, end, caret, options, activeIndex: 0, isOpen: options.length > 0, revision };
}
/** What to look up: a list completes a typed word (any word when asked); a source decides itself. */
function lookUp(completions, lookup) {
    if (typeof completions === 'function') {
        const { value, caret, query } = lookup;
        return completions({ value, caret, query, isExplicit: lookup.reason === 'explicit' });
    }
    return lookup.query || lookup.reason === 'explicit' ? completions : [];
}
function hideCompletionState(state) {
    return state.isOpen ? { ...state, isOpen: false } : state;
}
/**
 * The open list while a source's answer to an edit is pending: it stays open, narrowed to the
 * options that still match the typed text, with its range following the caret, so it does not
 * blink shut on every keystroke. A caret move, or an edit before the list's start, hides it.
 */
function toPendingState(state, lookup) {
    if (!state.isOpen || lookup.reason === 'move' || lookup.caret < state.start) {
        return hideCompletionState(state);
    }
    const options = matchCompletions(state.options, lookup.value.slice(state.start, lookup.caret));
    const active = options.indexOf(state.options[state.activeIndex]);
    return {
        ...state,
        end: lookup.caret + Math.max(state.end - state.caret, 0),
        caret: lookup.caret,
        options,
        activeIndex: Math.max(active, 0),
        isOpen: options.length > 0,
        revision: state.revision + 1,
    };
}
function useCompletionState(options) {
    const [state, setState] = useState(closed);
    const request = useRef(0);
    const latest = useRef({ state, options });
    // Every commit: callers pass a fresh options object each render.
    useLayoutEffect(() => {
        latest.current = { state, options };
    });
    const { isLocked } = options;
    useLayoutEffect(() => {
        if (!isLocked)
            return;
        request.current += 1;
        setState(hideCompletionState);
    }, [isLocked]);
    useLayoutEffect(() => () => {
        request.current += 1;
        latest.current.state = hideCompletionState(latest.current.state);
    }, []);
    return { state, setState, request, latest };
}
function closeCompletions(session) {
    session.request.current += 1;
    session.latest.current.state = hideCompletionState(session.latest.current.state);
    session.setState(hideCompletionState);
}
function applyCompletion(session, option) {
    const current = session.latest.current;
    if (current.options.isLocked || !current.state.isOpen || !current.state.options.includes(option))
        return;
    const { start, end } = current.state;
    current.state = hideCompletionState(current.state);
    try {
        current.options.insert(option, { start, end });
    }
    finally {
        closeCompletions(session);
    }
}
function trackCompletions(session, reason) {
    const current = session.latest.current.options;
    const input = current.inputRef.current;
    if (!input || !current.completions || current.isLocked)
        return;
    // Inputs without a caret (such as `email`) report none; complete at the end.
    const caret = input.selectionStart ?? input.value.length;
    const lookup = {
        value: input.value,
        caret,
        query: current.findQuery(input.value, caret),
        reason,
    };
    const id = (session.request.current += 1);
    const show = (answer) => {
        if (id === session.request.current && !session.latest.current.options.isLocked)
            session.setState((state) => toState(answer, lookup, state.revision + 1));
    };
    const answer = lookUp(current.completions, lookup);
    if (!isPromise(answer))
        return show(answer);
    session.setState((state) => toPendingState(state, lookup));
    answer.then(show, () => undefined);
}
/**
 * Completion for a text control that keeps focus: the options for the place at the caret, from a
 * vocabulary or a source, ranked against the typed text; an active option moved with the arrow
 * keys; Enter or Tab inserts it, Escape closes the list and Ctrl+Space asks for it. Only the latest
 * lookup's answer shows.
 */
export function useCompletions(options) {
    const { completions, isLocked } = options;
    const session = useCompletionState(options);
    const { state, setState, request } = session;
    const usedKey = useRef(null);
    const isOpen = state.isOpen && !isLocked;
    const close = () => closeCompletions(session);
    const setActiveIndex = (index) => setState((current) => ({ ...current, activeIndex: index }));
    const apply = (option) => applyCompletion(session, option);
    const track = (reason) => trackCompletions(session, reason);
    /** The list's own keys while it is open; returns whether the key was used. */
    const choose = (key, shiftKey) => {
        const option = state.options[state.activeIndex];
        const count = state.options.length;
        if (key === 'ArrowDown')
            setActiveIndex(step(state.activeIndex, 1, count));
        else if (key === 'ArrowUp')
            setActiveIndex(step(state.activeIndex, -1, count));
        else if ((key === 'Enter' || (key === 'Tab' && !shiftKey)) && option)
            apply(option);
        else if (key === 'Escape')
            close();
        else
            return false;
        return true;
    };
    const handleKeyDown = (event) => {
        // Escape also drops a lookup that has not answered yet.
        if (!isOpen && event.key === 'Escape')
            request.current += 1;
        if (event.nativeEvent.isComposing)
            return false;
        const isRequest = isExplicitRequest(event) && Boolean(completions) && !isLocked;
        if (isRequest)
            track('explicit');
        else if (!isOpen || !choose(event.key, event.shiftKey))
            return false;
        usedKey.current = event.key;
        event.preventDefault();
        event.stopPropagation();
        return true;
    };
    return {
        isOpen,
        options: state.options,
        activeIndex: state.activeIndex,
        caret: state.caret,
        setActiveIndex,
        apply,
        track,
        reposition: () => setState((current) => ({ ...current, revision: current.revision + 1 })),
        close,
        handleKeyDown,
        handleKeyUp(event) {
            const used = usedKey.current === event.key;
            usedKey.current = null;
            if (!used && NAVIGATION_KEYS.has(event.key))
                track('move');
        },
    };
}
//# sourceMappingURL=use-completions.js.map