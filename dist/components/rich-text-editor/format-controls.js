import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isSafeUrl } from '../../utils/safe-url.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { SelectField } from '../select-field/select-field.js';
import { TextField } from '../text-field/text-field.js';
import { getBlockItems } from './format-items.js';
function isToggle({ command }) {
    return command.type === 'toggle-mark' || command.type === 'toggle-wrap';
}
/**
 * Buttons for the commands the schema supports; marks, lists and the quote are toggle buttons,
 * pressed while their effect holds. A pointer press keeps focus, and the selection, in the document.
 */
export function FormatButtons({ controller, items }) {
    return items
        .filter((item) => controller.supports(item.command))
        .map((item) => {
        const run = () => controller.run(item.command);
        const toggle = isToggle(item)
            ? { isSelected: controller.isActive(item.command), onChange: run }
            : { onPress: run };
        return (_jsx(Button, { ...toggle, icon: item.icon, label: item.label, tooltip: item.label, shortcut: item.shortcut, size: "sm", isDisabled: !controller.can(item.command), preventFocusOnPress: true }, item.id));
    });
}
/** The select of text block types; choosing one turns the selected blocks into it. */
export function BlockTypeSelect({ controller, className, onCommand }) {
    const strings = useUiStrings();
    const items = getBlockItems(strings).filter((item) => controller.supports(item.command));
    const value = items.find((item) => controller.isActive(item.command))?.id ?? null;
    const choose = (key) => {
        const item = items.find((candidate) => candidate.id === key);
        if (item && controller.run(item.command))
            onCommand();
    };
    return (_jsx(SelectField, { size: "sm", className: className, label: strings.blockType, labelLayout: "control-only", placeholder: strings.blockType, options: items.map(({ id, label, icon }) => ({ id, label, icon })), value: value, committedValue: value, onChange: choose, isDisabled: !controller.isEditable }));
}
/**
 * The link button, pressed on a link, and its popover: an address field that links the selection
 * (or inserts the address at a caret), and a button that removes the link.
 */
export function LinkButton({ controller, className, onCommand }) {
    const strings = useUiStrings();
    const [isOpen, setOpen] = useState(false);
    const [address, setAddress] = useState('');
    if (isOpen && !controller.isEditable)
        setOpen(false);
    const href = address.trim();
    const finish = (isDone) => {
        if (!isDone)
            return;
        setOpen(false);
        onCommand();
    };
    const apply = (event) => {
        event.preventDefault();
        finish(controller.run({ type: 'set-link', href }));
    };
    return (_jsxs(PopoverTrigger, { isOpen: isOpen && controller.isEditable, onOpenChange: (open) => {
            if (open)
                setAddress(controller.link ?? '');
            setOpen(open);
        }, children: [_jsx(Button, { icon: "link", label: strings.link, tooltip: strings.link, size: "sm", isSelected: controller.link !== null, isDisabled: !controller.isEditable }), _jsx(Popover, { className: className, placement: "bottom start", "aria-label": strings.link, children: _jsxs("form", { onSubmit: apply, children: [_jsx(TextField, { label: strings.linkAddress, inputMode: "url", spellCheck: false, autoFocus: true, value: address, onChange: setAddress }), _jsx(Button, { type: "submit", variant: "primary", size: "sm", isDisabled: !href || !isSafeUrl(href), children: strings.apply }), controller.link === null ? null : (_jsx(Button, { size: "sm", startIcon: "unlink", onPress: () => finish(controller.run({ type: 'set-link', href: null })), children: strings.removeLink }))] }) })] }));
}
//# sourceMappingURL=format-controls.js.map