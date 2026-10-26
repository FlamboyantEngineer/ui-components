import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Heading, Sheet, SheetBackdrop, SheetContent, SheetOverlay, SheetTrigger, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { useLayerZIndex } from '../portal/portal.js';
const hooks = createHooks('drawer', [
    'backdrop',
    'panel',
    'dialog',
    'header',
    'title',
    'close',
    'body',
    'footer',
]);
function DrawerHeader({ title, showCloseButton, isDisabled, onClose }) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('header'), children: [_jsx(Heading, { slot: "title", className: hooks.slotClass('title'), children: title }), showCloseButton ? (_jsx(Button, { icon: "close", label: strings.close, className: hooks.slotClass('close'), isDisabled: isDisabled, onPress: onClose })) : null] }));
}
/** Opens the `Drawer` among its children when its trigger, such as a `Button`, is pressed. */
export function DrawerTrigger({ children, ...openState }) {
    return _jsx(SheetTrigger, { ...openState, children: children });
}
/**
 * A panel that slides in from an edge of the viewport over a page it blocks (React Aria `Sheet`):
 * a title, an optional close button, the body and a footer. Focus moves in once it has entered and
 * stays inside; Escape, an outside press and a swipe toward its edge close it, and focus returns to
 * the trigger. Snap points, swipe directions and nested drawers come from React Aria.
 */
export function Drawer({ position = 'end', size = 'md', title, showCloseButton = false, footer, children, isDismissable = true, isKeyboardDismissDisabled = false, shouldCloseOnInteractOutside, isDismissDisabled = false, snapPoints, id, className, ...rest }) {
    const zIndex = useLayerZIndex('drawer');
    // React Aria's sheet offers no keyboard-only refusal, so a refused Escape stops at the dialog.
    const onKeyDown = (event) => {
        if (event.key !== 'Escape' || !isKeyboardDismissDisabled)
            return;
        event.stopPropagation();
        event.preventDefault();
    };
    return (_jsxs(SheetOverlay, { ...rest, ...hooks.root({ className, props: rest, data: { size } }), position: position, snapPoints: snapPoints ? [...snapPoints] : undefined, preventDismissal: isDismissDisabled, shouldCloseOnInteractOutside: (element) => isDismissable && (shouldCloseOnInteractOutside?.(element) ?? true), style: { zIndex }, children: [_jsx(SheetBackdrop, { className: hooks.slotClass('backdrop') }), _jsx(Sheet, { className: hooks.slotClass('panel'), children: _jsx(SheetContent, { id: id, className: hooks.slotClass('dialog'), 
                    // React Aria's Dialog forwards no keyboard handlers, so the listener goes on its element.
                    render: (props) => _jsx("section", { ...props, onKeyDown: onKeyDown }), children: ({ close }) => (_jsxs(_Fragment, { children: [_jsx(DrawerHeader, { title: title, showCloseButton: showCloseButton, isDisabled: isDismissDisabled, onClose: close }), children === undefined || children === null ? null : (_jsx("div", { ...hooks.slot('body'), children: typeof children === 'function' ? children({ close }) : children })), isEmptyNode(footer) ? null : _jsx("div", { ...hooks.slot('footer'), children: footer })] })) }) })] }));
}
//# sourceMappingURL=drawer.js.map