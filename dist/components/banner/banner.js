import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { Button } from '../button/button.js';
import { Icon, toIconProps } from '../icon/icon.js';
const hooks = createHooks('banner', [
    'icon',
    'spinner',
    'content',
    'title',
    'description',
    'actions',
    'dismiss',
]);
const toneGlyphs = {
    neutral: null,
    info: 'info',
    success: 'success',
    warning: 'warning',
    danger: 'error',
};
/** A slot that renders only when its content renders something. */
function BannerPart({ as: Element, slot, children, }) {
    return isEmptyNode(children) ? null : _jsx(Element, { ...hooks.slot(slot), children: children });
}
/** The decorative lead: a spinner while pending, else the icon, if any. */
function BannerLead({ icon, isPending }) {
    if (isPending)
        return _jsx("span", { ...hooks.slot('spinner'), "aria-hidden": "true" });
    if (isEmptyNode(icon))
        return null;
    return _jsx(Icon, { ...toIconProps(icon), className: hooks.slotClass('icon') });
}
function BannerDismiss({ label, onDismiss, }) {
    const strings = useUiStrings();
    return (_jsx(Button, { icon: "close", label: label ?? strings.dismiss, size: "sm", className: hooks.slotClass('dismiss'), onPress: () => onDismiss() }));
}
/** Focuses the element once, when it first renders with `autoFocus`. */
function useFocusOnMount(ref, autoFocus) {
    const shouldFocus = useRef(autoFocus);
    useEffect(() => {
        if (shouldFocus.current)
            ref.current?.focus();
    }, [ref]);
}
/** The built-in glyph that introduces a message of `tone`; none for `neutral`. */
export function getToneGlyph(tone) {
    return toneGlyphs[tone];
}
/**
 * An inline message about the state of a surface, with optional actions and dismissal.
 * Danger banners are assertive alerts; every other tone is a polite status.
 */
export function Banner({ tone = 'neutral', title, description, actions, icon, onDismiss, dismissLabel, isPending = false, isEntering = false, isExiting = false, inline = false, autoFocus = false, className, ref, ...rest }) {
    const [own, setRef] = useForwardedRef(ref);
    useFocusOnMount(own, autoFocus);
    const Element = inline ? 'span' : 'div';
    const isUrgent = tone === 'danger';
    const data = { tone, inline, pending: isPending, entering: isEntering, exiting: isExiting };
    return (_jsxs(Element, { ...rest, 
        // The root is a `<div>` or a `<span>`; either is the `HTMLElement` the caller's ref expects.
        ref: setRef, ...hooks.root({ className, data }), tabIndex: autoFocus ? -1 : undefined, role: isUrgent ? 'alert' : 'status', "aria-live": isUrgent ? 'assertive' : 'polite', "aria-atomic": "true", "aria-busy": isPending || undefined, children: [_jsx(BannerLead, { icon: icon === undefined ? getToneGlyph(tone) : icon, isPending: isPending }), _jsxs(Element, { ...hooks.slot('content'), children: [_jsx(BannerPart, { as: Element, slot: "title", children: title }), _jsx(BannerPart, { as: Element, slot: "description", children: description })] }), _jsx(BannerPart, { as: Element, slot: "actions", children: actions }), onDismiss ? _jsx(BannerDismiss, { label: dismissLabel, onDismiss: onDismiss }) : null] }));
}
//# sourceMappingURL=banner.js.map