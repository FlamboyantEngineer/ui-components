import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useRef, } from 'react';
import { Group, Input, TextArea } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { useAutoGrow } from '../../utils/use-auto-grow.js';
import { Button } from '../button/button.js';
export const textFieldHooks = createHooks('text-field', [
    'box',
    'group',
    'start',
    'input',
    'end',
    'reveal',
    'count',
    'completions',
]);
const hooks = textFieldHooks;
/**
 * The input alone, or with adornments or a reveal button a group around them all, which the host
 * frames as one box.
 */
export function TextFieldFrame({ startAdornment, endAdornment, reveal, children, }) {
    if (!startAdornment && !endAdornment && !reveal)
        return children;
    return (_jsxs(Group, { ...hooks.slot('group'), children: [startAdornment ? _jsx("span", { ...hooks.slot('start'), children: startAdornment }) : null, children, endAdornment ? _jsx("span", { ...hooks.slot('end'), children: endAdornment }) : null, reveal ? _jsx(RevealButton, { ...reveal }) : null] }));
}
/**
 * A toggle button that shows a masked value while pressed (`aria-pressed`). A pointer press keeps
 * focus, and the caret, in the input.
 */
function RevealButton({ label, isRevealed, isDisabled, onChange }) {
    const strings = useUiStrings();
    return (_jsx(Button, { className: hooks.slotClass('reveal'), icon: isRevealed ? 'eye-slash' : 'eye', label: strings.revealValue(label), size: "sm", isSelected: isRevealed, isDisabled: isDisabled, preventFocusOnPress: true, onChange: onChange }));
}
/** The text's length, against `maxLength` when it has one. */
function CharacterCount({ count, maxLength }) {
    const strings = useUiStrings();
    return _jsx("span", { ...hooks.slot('count'), children: strings.characterCount(count, maxLength) });
}
/** The description, followed by the character count when there is one, so the count describes the control too. */
export function withCharacterCount(description, { count, maxLength }) {
    if (count === null)
        return description;
    // The space keeps the description and the count apart when they are read as one text.
    return (_jsxs(_Fragment, { children: [description ? _jsxs(_Fragment, { children: [description, " "] }) : null, _jsx(CharacterCount, { count: count, maxLength: maxLength })] }));
}
/** The text area, at least `minRows` tall, growing with its text when a row limit is set. */
export function TextFieldArea({ controlRef, minRows, maxRows, value, ...rest }) {
    const area = useRef(null);
    const ref = useCallback((node) => {
        area.current = node;
        controlRef(node);
    }, [controlRef]);
    useAutoGrow(area, { minRows, maxRows, value });
    return _jsx(TextArea, { ...rest, ref: ref, rows: minRows });
}
/** The text area of a multiline field, else the input. */
export function TextFieldControl({ input, multiline, controlRef, ...grow }) {
    if (multiline)
        return _jsx(TextFieldArea, { ...input, ...grow, controlRef: controlRef });
    return _jsx(Input, { ...input, ref: controlRef });
}
//# sourceMappingURL=text-field-parts.js.map