import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton, ButtonContext, SelectValueContext, useSlottedContext, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { FieldPreviousValue } from '../field/field.js';
import { Button } from '../button/button.js';
import { Icon, toIconProps } from '../icon/icon.js';
const hooks = createHooks('select-field', [
    'frame',
    'trigger',
    'previous',
    'value',
    'value-icon',
    'value-label',
    'chevron',
    'clear',
]);
function OptionIcon({ option, slot }) {
    return option.icon ? (_jsx(Icon, { ...toIconProps(option.icon), className: hooks.slotClass(slot) })) : null;
}
/**
 * The frame of a select field: the previous value while a single select is dirty, then the trigger
 * with the chosen option's icon and label (a multiple select's count, or the placeholder) and a
 * chevron, then the clear button. The value element is
 * the one React Aria names the trigger with, so the trigger reads as its value and the field's
 * label; the previous value stays outside the button, readable on its own.
 */
export function SelectTrigger({ ref, chosen, previous, placeholder, summary, clearLabel, onClear, onKeyDownCapture, }) {
    const valueProps = useSlottedContext(SelectValueContext);
    return (_jsxs("div", { ...hooks.slot('frame'), onKeyDownCapture: onKeyDownCapture, children: [previous ? (_jsxs(FieldPreviousValue, { className: hooks.slotClass('previous'), children: [_jsx(OptionIcon, { option: previous, slot: "value-icon" }), previous.label] })) : null, _jsxs(AriaButton, { ref: ref, className: hooks.slotClass('trigger'), children: [_jsxs("span", { ...hooks.slot('value', {
                            placeholder: !chosen && !summary,
                            missing: chosen?.isMissing,
                        }), id: valueProps?.id, children: [chosen ? _jsx(OptionIcon, { option: chosen, slot: "value-icon" }) : null, _jsx("span", { ...hooks.slot('value-label'), children: chosen?.label ?? summary ?? placeholder })] }), _jsx(Glyph, { name: "chevron-down", className: hooks.slotClass('chevron') })] }), clearLabel ? (_jsx(ButtonContext.Provider, { value: null, children: _jsx(Button, { className: hooks.slotClass('clear'), icon: "close", label: clearLabel, variant: "bare", size: "xs", onPress: onClear }) })) : null] }));
}
//# sourceMappingURL=select-trigger.js.map