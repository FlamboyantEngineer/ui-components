import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { FieldRestoreButton } from './field-restore-button.js';
const hooks = createHooks('field-previous-value', ['value']);
/**
 * Marks a value that differs from the field's committed value: the previous value in a `<del>`
 * element, and, when the control can put that one value back, a restore button.
 */
export function FieldPreviousValue({ children, onRestore, restoreLabel, isDisabled, className, id, ...rest }) {
    const valueRef = useRef(null);
    // Content that is not plain text (an icon and its label) is named by the text it renders.
    const [text, setText] = useState(typeof children === 'string' ? children : '');
    useLayoutEffect(() => setText(valueRef.current?.textContent?.trim() ?? ''), [children]);
    const label = restoreLabel ?? text;
    return (_jsxs("span", { ...hooks.root({ className, props: rest }), id: id, children: [_jsx("del", { ...hooks.slot('value'), ref: valueRef, children: children }), onRestore && label ? (_jsx(FieldRestoreButton, { label: label, size: "sm", isDisabled: isDisabled, onPress: onRestore })) : null] }));
}
//# sourceMappingURL=field-previous-value.js.map