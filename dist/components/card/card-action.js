import { jsx as _jsx } from "react/jsx-runtime";
// The whole-card action: the card's title is a link or a button, and a click anywhere on the card
// that is not meant for an inner control or a text selection activates it.
import { useMemo, useRef, } from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import { UiLink } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
/** Elements that own their clicks: a click inside one never reaches the card's action. */
const controlSelector = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    'summary',
    'label',
    '[contenteditable="true"]',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="switch"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[role="tab"]',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');
function hasCardAction({ href, onAction }) {
    return href !== undefined || onAction !== undefined;
}
function toLinkRel({ target, rel }) {
    return rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);
}
/** Whether a click on `target` was meant for the card: not for an inner control or a text selection. */
function isCardClick(target, card) {
    const control = target.closest(controlSelector);
    if (control && card.contains(control))
        return false;
    const selection = card.ownerDocument.getSelection();
    return !selection || selection.isCollapsed || !card.contains(selection.anchorNode);
}
/** Repeats a click on the action element, with the same button and modifier keys. */
function repeatClick(action, event) {
    const View = action.ownerDocument.defaultView?.MouseEvent ?? MouseEvent;
    const { button, ctrlKey, metaKey, shiftKey, altKey } = event;
    action.dispatchEvent(new View('click', {
        bubbles: true,
        cancelable: true,
        button,
        ctrlKey,
        metaKey,
        shiftKey,
        altKey,
    }));
}
/** The action element the card registers, and the root click handler that forwards to it. */
export function useCardAction(options) {
    const action = useRef(null);
    const isActionable = hasCardAction(options);
    const actionRef = useMemo(() => mergeRefs(action), []);
    const onClick = (event) => {
        const element = action.current;
        if (!isActionable || !element || event.defaultPrevented)
            return;
        if (!(event.target instanceof Element) || element.contains(event.target))
            return;
        // React bubbles clicks out of portals; content portalled out of the card is not the card.
        if (!event.currentTarget.contains(event.target))
            return;
        if (isCardClick(event.target, event.currentTarget))
            repeatClick(element, event);
    };
    return { isActionable, actionRef, onClick };
}
/**
 * The card's action element: a link through the provider's renderer, or a button. The card's title
 * draws it, and so does a `CardAction` in a custom header.
 */
export function CardActionTitle({ options, actionRef, className, children, ...rest }) {
    const { href, target, onAction } = options;
    if (href !== undefined) {
        return (_jsx(UiLink, { ...rest, ref: actionRef, href: href, target: target, rel: toLinkRel(options), className: className, onClick: () => onAction?.(), children: children }));
    }
    return (_jsx(AriaButton, { ...rest, ref: actionRef, className: className, onPress: () => onAction?.(), children: children }));
}
//# sourceMappingURL=card-action.js.map