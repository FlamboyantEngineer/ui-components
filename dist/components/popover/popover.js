import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useState } from 'react';
import { Dialog, DialogTrigger, Heading, OverlayArrow, OverlayTriggerStateContext, Popover as AriaPopover, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { useLayerZIndex } from '../portal/portal.js';
import { usePopoverGutter } from './use-popover-gutter.js';
const hooks = createHooks('popover', ['arrow', 'dialog', 'header', 'title', 'close', 'body']);
function PopoverHeader({ title, showCloseButton, onClose }) {
    const strings = useUiStrings();
    if (isEmptyNode(title) && !showCloseButton)
        return null;
    return (_jsxs("div", { ...hooks.slot('header'), children: [isEmptyNode(title) ? null : (_jsx(Heading, { slot: "title", className: hooks.slotClass('title'), children: title })), showCloseButton ? (_jsx(Button, { icon: "close", label: strings.close, size: "sm", className: hooks.slotClass('close'), onPress: onClose })) : null] }));
}
/** Opens the `Popover` among its children when its trigger, such as a `Button`, is pressed. */
export function PopoverTrigger({ children, ...openState }) {
    return _jsx(DialogTrigger, { ...openState, children: children });
}
/**
 * The floating panel the library's anchored overlays share: a React Aria popover on the `dropdown`
 * layer, with an optional arrow. It adds no hooks of its own; the caller passes them.
 */
export function PopoverPanel({ arrowClassName, children, style, ...rest }) {
    const zIndex = useLayerZIndex('dropdown');
    const [panel, setPanel] = useState(null);
    const gutter = usePopoverGutter(panel);
    return (_jsxs(AriaPopover, { ...rest, style: ({ placement }) => ({
            ...style,
            zIndex,
            translate: placement === 'left' && gutter > 0 ? `${gutter}px 0` : style?.translate,
        }), ref: setPanel, children: [arrowClassName ? _jsx(OverlayArrow, { className: arrowClassName }) : null, children] }));
}
/**
 * A dialog floating against its trigger: an optional title and close button, then the body, with an
 * optional arrow. Inside a `PopoverTrigger` it opens when the trigger is pressed; otherwise `isOpen`,
 * `onOpenChange` and `triggerRef` control it. Focus moves in on open, stays inside while open and
 * returns to the trigger on close; Escape and outside presses close it.
 */
export function Popover({ title, showCloseButton = false, showArrow = false, offset, children, id, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, className, ...rest }) {
    const trigger = useContext(OverlayTriggerStateContext);
    // A controlled popover outside a trigger closes through its caller.
    const close = () => (rest.isOpen === undefined ? trigger?.close() : rest.onOpenChange?.(false));
    return (_jsx(PopoverPanel, { ...rest, offset: offset ?? (showArrow ? 7 : 8), ...hooks.root({ className, props: rest }), arrowClassName: showArrow ? hooks.slotClass('arrow') : undefined, children: _jsxs(Dialog, { id: id, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledby, className: hooks.slotClass('dialog'), children: [_jsx(PopoverHeader, { title: title, showCloseButton: showCloseButton, onClose: close }), children === undefined || children === null ? null : (_jsx("div", { ...hooks.slot('body'), children: typeof children === 'function' ? children({ close }) : children }))] }) }));
}
//# sourceMappingURL=popover.js.map