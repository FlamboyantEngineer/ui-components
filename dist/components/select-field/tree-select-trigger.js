import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useRef } from 'react';
import { Button as AriaButton, DialogTrigger } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { Button } from '../button/button.js';
const hooks = createHooks('select-field', ['frame', 'trigger', 'value', 'chevron', 'clear']);
/**
 * The frame of a tree select field: the trigger, named by the field's label and its value, with a
 * chevron, which opens the popover, then the clear button, which returns focus to the trigger. The
 * clear button stays outside the dialog trigger, where every press would open the popover.
 */
export function TreeSelectTrigger({ control, text, isPlaceholder, isMissing, clearLabel, onClear, isOpen, onOpenChange, popover, }) {
    const valueId = useId();
    const triggerRef = useRef(null);
    const ref = useMemo(() => mergeRefs(triggerRef, control.ref), [control.ref]);
    const name = control['aria-labelledby'] ?? control.id;
    return (_jsxs("div", { ...hooks.slot('frame'), children: [_jsxs(DialogTrigger, { isOpen: isOpen, onOpenChange: onOpenChange, children: [_jsxs(AriaButton, { ...hooks.slot('trigger'), ref: ref, id: control.id, "aria-label": control['aria-label'], "aria-labelledby": `${name} ${valueId}`, "aria-describedby": control['aria-describedby'], isDisabled: control.disabled, children: [_jsx("span", { ...hooks.slot('value', { placeholder: isPlaceholder, missing: isMissing }), id: valueId, children: text }), _jsx(Glyph, { name: "chevron-down", className: hooks.slotClass('chevron') })] }), popover] }), clearLabel ? (_jsx(Button, { className: hooks.slotClass('clear'), icon: "close", label: clearLabel, variant: "bare", size: "xs", onPress: () => {
                    onClear();
                    triggerRef.current?.focus();
                } })) : null] }));
}
//# sourceMappingURL=tree-select-trigger.js.map