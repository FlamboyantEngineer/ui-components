import { useRef } from 'react';
/**
 * Stepping through a snippet's fields. The reader edits only the current field, so the fields
 * before it keep their offsets and those after it move by however much the text grew.
 */
export function useCodeSnippet(inputRef) {
    const session = useRef(null);
    const end = () => {
        session.current = null;
    };
    const step = (input, state, delta) => {
        const grown = input.value.length - state.length;
        const stops = state.stops.map((stop, index) => {
            if (index < state.index)
                return stop;
            if (index === state.index)
                return { start: stop.start, end: stop.end + grown };
            return { start: stop.start + grown, end: stop.end + grown };
        });
        const current = stops[state.index];
        const caret = input.selectionStart;
        if (caret < current.start || caret > current.end)
            return false;
        const index = Math.max(0, state.index + delta);
        const target = stops[index];
        input.setSelectionRange(target.start, target.end);
        session.current =
            index >= stops.length - 1 ? null : { stops, index, length: input.value.length };
        return true;
    };
    return {
        start(stops, length) {
            session.current = stops.length < 2 ? null : { stops, index: 0, length };
        },
        handleKeyDown(event) {
            const input = inputRef.current;
            const state = session.current;
            if (!input || !state || event.key !== 'Tab')
                return false;
            if (!step(input, state, event.shiftKey ? -1 : 1)) {
                end();
                return false;
            }
            event.preventDefault();
            return true;
        },
        end,
    };
}
//# sourceMappingURL=use-code-snippet.js.map