import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton, ListBox, ListBoxItem, Popover, Select as AriaSelect, SelectValueContext, useSlottedContext, } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { triggerWidthProperty, useLayerZIndex } from '../portal/portal.js';
const hooks = createHooks('relative-date-field', [
    'select',
    'trigger',
    'value',
    'chevron',
    'popover',
    'listbox',
    'option',
]);
function RelativeTrigger({ control, text, placeholder, }) {
    const valueProps = useSlottedContext(SelectValueContext);
    return (_jsxs(AriaButton, { ref: control.ref, className: hooks.slotClass('trigger'), children: [_jsx("span", { ...hooks.slot('value', { placeholder: !text }), id: valueProps?.id, children: text ? text.relative : placeholder }), _jsx(Glyph, { name: "chevron-down", className: hooks.slotClass('chevron') })] }));
}
/**
 * The preset list: a select that never holds a choice, so picking the same preset again commits.
 * Only the open list picks; a locked field neither opens it nor reports opening. Its popover can
 * hold more beside the list, such as a calendar.
 */
export function PresetSelect({ control, state, items, text, placeholder, onPick, aside, isOpen, defaultOpen, onOpenChange, }) {
    const zIndex = useLayerZIndex('dropdown');
    const [open, setOpen] = useControllableState(isOpen, Boolean(defaultOpen), onOpenChange);
    const isLocked = state.isReadOnly || state.isDisabled;
    const isListOpen = open && !isLocked;
    return (_jsxs(AriaSelect, { className: hooks.slotClass('select'), id: control.id, "aria-label": control['aria-label'], "aria-labelledby": control['aria-labelledby'], "aria-describedby": control['aria-describedby'], value: null, onChange: (key) => {
            // The closed trigger's Arrow Left, Arrow Right and typing pick the first match when the
            // select holds no choice, which would commit a preset the reader never saw.
            if (key !== null && isListOpen)
                onPick(String(key));
        }, isOpen: isListOpen, onOpenChange: (next) => {
            if (!isLocked)
                setOpen(next);
        }, isDisabled: state.isDisabled, isRequired: state.isRequired, isInvalid: state.validation.status === 'invalid', validationBehavior: "aria", children: [_jsx(RelativeTrigger, { control: control, text: text, placeholder: placeholder }), _jsxs(Popover, { ...hooks.slot('popover', { layer: 'dropdown' }), offset: 4, style: { ...triggerWidthProperty, zIndex }, children: [_jsx(ListBox, { className: hooks.slotClass('listbox'), items: items, children: (item) => (_jsx(ListBoxItem, { id: item.id, textValue: item.label, isDisabled: item.isDisabled, className: hooks.slotClass('option'), children: item.label })) }), aside] })] }));
}
//# sourceMappingURL=relative-date-select.js.map