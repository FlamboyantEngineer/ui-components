import { useRef } from 'react';
import { breakLine, deletePair, indentSelection, insertPair, outdentSelection, skipCloser, } from './code-editing.js';
const brackets = new Set(['(', '[', '{', '"', "'", '`']);
const pairClosers = new Set([')', ']', '}', '"', "'", '`']);
/** Keys pressed on their own before a chord, which keep Escape's "Tab leaves" until the chord. */
const modifierKeys = new Set(['Shift', 'Control', 'Alt', 'Meta']);
function hasModifier(event) {
    return event.ctrlKey || event.metaKey || event.altKey;
}
/**
 * The editing keys of a code editor: Tab and Shift+Tab indentation (left by Escape then Tab or
 * Shift+Tab), Enter keeping the indentation, bracket and quote pairs, and the shortcuts for search
 * and problems. Returns a handler that reports whether it used the key.
 */
export function useCodeKeys(options) {
    const { inputRef, applyEdit, indent, isLocked } = options;
    const tabLeaves = useRef(false);
    /** Closers the editor inserted, as distances from the end of the text, innermost last. */
    const insertedClosers = useRef([]);
    const editFor = ({ key, shiftKey, value, selection }) => {
        if (key === 'Tab') {
            return shiftKey
                ? outdentSelection(value, selection, indent)
                : indentSelection(value, selection, indent);
        }
        if (key === 'Enter')
            return breakLine(value, selection, indent);
        if (!options.autoCloseBrackets)
            return null;
        if (key === 'Backspace')
            return deletePair(value, selection);
        const distance = value.length - selection.end;
        if (pairClosers.has(key) && insertedClosers.current.at(-1) === distance) {
            const skip = skipCloser(value, selection, key);
            if (skip)
                insertedClosers.current.pop();
            if (skip)
                return skip;
        }
        const pair = brackets.has(key) ? insertPair(value, selection, key) : null;
        if (pair && selection.start === selection.end)
            insertedClosers.current.push(distance + 1);
        return pair;
    };
    const handleShortcut = (event) => {
        const key = event.key.toLowerCase();
        const isCommand = (event.ctrlKey || event.metaKey) && !event.altKey;
        if (event.key === 'F8' && !hasModifier(event))
            return options.onProblem(event.shiftKey ? -1 : 1);
        if (!isCommand || key !== 'f' || !options.onFind)
            return false;
        options.onFind();
        return true;
    };
    return (event) => {
        const input = inputRef.current;
        if (!input || event.nativeEvent.isComposing)
            return false;
        const leaving = tabLeaves.current;
        if (!modifierKeys.has(event.key))
            tabLeaves.current = event.key === 'Escape';
        if (handleShortcut(event)) {
            event.preventDefault();
            return true;
        }
        if (event.key === 'Enter' && !options.multiline) {
            event.preventDefault();
            return false;
        }
        const isTab = event.key === 'Tab';
        if (isLocked || hasModifier(event) || (isTab && (leaving || !options.indentWithTab))) {
            return false;
        }
        const selection = { start: input.selectionStart, end: input.selectionEnd };
        const edit = editFor({
            key: event.key,
            shiftKey: event.shiftKey,
            value: input.value,
            selection,
        });
        // Tab stays in an editor that indents with it, even with nothing to outdent.
        if (!edit && !isTab)
            return false;
        event.preventDefault();
        if (edit)
            applyEdit(edit);
        return true;
    };
}
//# sourceMappingURL=use-code-keys.js.map