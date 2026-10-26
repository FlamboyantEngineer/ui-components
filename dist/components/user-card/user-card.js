import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { Button as AriaButton, Dialog, DialogTrigger, OverlayTriggerStateContext, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { getDisplayName, splitAvatarIdentity } from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import { DescriptionList, DescriptionRow } from '../description-list/description-list.js';
import { HoverCard, HoverCardTrigger, } from '../hover-card/hover-card.js';
import { PopoverPanel } from '../popover/popover.js';
import { Skeleton } from '../skeleton/skeleton.js';
import { UserIdentity } from '../user-identity/user-identity.js';
const hooks = createHooks('user-card', [
    'identity',
    'status',
    'indicator',
    'status-label',
    'details',
    'actions',
    'action',
    'trigger',
    'popover',
    'skeleton',
]);
/** Set inside a hover card's popover, where the card must not take focus as a dialog would. */
const UserCardPreviewContext = createContext(false);
function CardStatus({ statusLabel }) {
    const text = statusLabel?.trim();
    if (!text)
        return null;
    return (_jsxs("div", { ...hooks.slot('status'), children: [_jsx("span", { ...hooks.slot('indicator'), "aria-hidden": "true" }), _jsx("span", { ...hooks.slot('status-label'), children: text })] }));
}
function CardDetails({ details }) {
    if (!details?.length)
        return null;
    return (_jsx(DescriptionList, { className: hooks.slotClass('details'), children: details.map((detail, index) => (_jsx(DescriptionRow, { label: detail.label, children: detail.value }, index))) }));
}
function CardActions({ actions, onAction }) {
    const overlay = useContext(OverlayTriggerStateContext);
    if (!actions?.length)
        return null;
    return (_jsx("div", { ...hooks.slot('actions'), children: actions.map((action) => (_jsx(Button, { size: "sm", startIcon: action.icon, className: hooks.slotClass('action'), onPress: () => {
                overlay?.close();
                onAction?.(action.id);
            }, children: action.label }, action.id))) }));
}
/**
 * The card's dialog. React Aria's Dialog takes focus when it mounts, which suits a card that opens in
 * an overlay; a card shown on hover or in place must not move focus, so there it is a plain dialog
 * element.
 */
function UserCardRoot({ isLoading, children, ...props }) {
    const isPreview = useContext(UserCardPreviewContext);
    const overlay = useContext(OverlayTriggerStateContext);
    if (isPreview || !overlay) {
        return (_jsx("section", { ...props, role: "dialog", "aria-busy": isLoading || undefined, children: children }));
    }
    return (_jsx(Dialog, { ...props, render: isLoading ? (dialog) => _jsx("section", { ...dialog, "aria-busy": "true" }) : undefined, children: children }));
}
/**
 * The identity card of a person or group: avatar, name, a secondary line, an optional status row,
 * detail rows and actions. A dialog named by the person, usually opened by a `UserCardTrigger`.
 */
export function UserCard(props) {
    const [identity, cardProps] = splitAvatarIdentity(props);
    const { colorCount, description, status, statusLabel, details, actions, onAction, isLoading = false, className, 'aria-label': ariaLabel, ...rest } = cardProps;
    const strings = useUiStrings();
    return (_jsxs(UserCardRoot, { ...rest, ...hooks.root({
            className,
            data: { status: status?.trim() || undefined, loading: isLoading },
        }), "aria-label": ariaLabel ?? getDisplayName(identity.name, strings.unnamed), isLoading: isLoading, children: [_jsx(UserIdentity, { ...identity, colorCount: colorCount, description: description, className: hooks.slotClass('identity') }), isLoading ? (_jsx(Skeleton, { className: hooks.slotClass('skeleton') })) : (_jsxs(_Fragment, { children: [_jsx(CardStatus, { statusLabel: statusLabel }), _jsx(CardDetails, { details: details }), _jsx(CardActions, { actions: actions, onAction: onAction })] }))] }));
}
/**
 * Makes its content (an avatar, a name, a user identity row) a button that opens `card` in a
 * popover on the `dropdown` layer, on press or, with `trigger="hover"`, in a `HoverCard` on hover and
 * keyboard focus. Escape and the card's actions close it, returning focus to the trigger.
 */
export function UserCardTrigger({ card, children, trigger = 'press', isOpen, defaultOpen, onOpenChange, delay, closeDelay, className, ...rest }) {
    const openState = { isOpen, defaultOpen, onOpenChange };
    const button = (_jsx(AriaButton, { ...rest, ...hooks.slot('trigger', undefined, className), children: children }));
    if (trigger === 'hover') {
        return (_jsxs(HoverCardTrigger, { ...openState, delay: delay, closeDelay: closeDelay, isDisabled: rest.isDisabled, children: [button, _jsx(HoverCard, { className: hooks.slotClass('popover'), children: _jsx(UserCardPreviewContext.Provider, { value: true, children: card }) })] }));
    }
    return (_jsxs(DialogTrigger, { ...openState, children: [button, _jsx(PopoverPanel, { className: hooks.slotClass('popover'), children: card })] }));
}
//# sourceMappingURL=user-card.js.map