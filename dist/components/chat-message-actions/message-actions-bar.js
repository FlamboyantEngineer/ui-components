import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from 'react';
import { Toolbar } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
export const actionHooks = createHooks('chat-message-actions', [
    'copy',
    'status',
    'rating',
    'reply',
    'react',
    'edit',
    'delete',
    'feedback',
    'reasons',
    'reason',
    'comment',
    'feedback-actions',
    'emoji-popover',
]);
const copyGlyphs = { idle: 'copy', copied: 'check', failed: 'error' };
/**
 * React passes events from portalled overlays up the component tree, so keys, secondary clicks and
 * touches in the bar's overlays would reach the message around it; they stop at the overlays.
 */
function stopPortalledEvent(event) {
    event.stopPropagation();
}
/** Copy, which shows the outcome in its glyph and announces it. */
function CopyCommand({ state }) {
    const strings = useUiStrings();
    const announcements = { idle: '', copied: strings.copied, failed: strings.copyFailed };
    return (_jsxs(_Fragment, { children: [_jsx(Button, { icon: copyGlyphs[state.copyStatus], label: strings.copy, size: "sm", className: actionHooks.slotClass('copy'), onPress: state.copy }), _jsxs(VisuallyHidden, { elementType: "span", role: "status", className: actionHooks.slotClass('status'), children: [announcements[state.copyStatus], state.copyStatus !== 'idle' && state.copies % 2 === 0 ? '​' : null] })] }));
}
/** A rating toggle; with feedback reasons it opens the details. */
function RatingButton({ state, rating }) {
    const strings = useUiStrings();
    const ref = useRef(null);
    const asksDetails = state.commands.feedbackReasons !== undefined;
    const isOpen = state.open?.overlay === 'feedback' && state.open.anchor === ref;
    return (_jsx(Button, { ref: ref, icon: rating === 'up' ? 'thumbs-up' : 'thumbs-down', label: rating === 'up' ? strings.goodResponse : strings.badResponse, size: "sm", className: actionHooks.slotClass('rating'), "data-rating": rating, isSelected: state.rating === rating, onChange: () => state.rate(rating, ref), "aria-haspopup": asksDetails ? 'dialog' : undefined, "aria-expanded": asksDetails ? isOpen : undefined }));
}
/** A command that opens an overlay placed against it. */
function OverlayButton({ state, overlay, icon, label }) {
    const ref = useRef(null);
    return (_jsx(Button, { ref: ref, icon: icon, label: label, size: "sm", className: actionHooks.slotClass(overlay), "aria-haspopup": "dialog", "aria-expanded": state.open?.overlay === overlay && state.open.anchor === ref, onPress: () => state.openOverlay(overlay, ref) }));
}
/** The toolbar of a message's commands, in a fixed order; arrow keys move between them. */
export function MessageActionsBar({ state, children, className, ...rest }) {
    const strings = useUiStrings();
    const { commands } = state;
    const label = rest['aria-labelledby']
        ? undefined
        : (rest['aria-label'] ?? strings.messageActions);
    return (_jsxs(Toolbar, { ...rest, ...actionHooks.root({
            className,
            props: rest,
            data: { open: state.open !== null, copied: state.copyStatus === 'copied' },
        }), "aria-label": label, children: [commands.copyText === undefined ? null : _jsx(CopyCommand, { state: state }), commands.onFeedback ? (_jsxs(_Fragment, { children: [_jsx(RatingButton, { state: state, rating: "up" }), _jsx(RatingButton, { state: state, rating: "down" })] })) : null, commands.onReply ? (_jsx(Button, { icon: "reply", label: strings.reply, size: "sm", className: actionHooks.slotClass('reply'), onPress: commands.onReply })) : null, commands.onReact ? (_jsx(OverlayButton, { state: state, overlay: "react", icon: "emoji", label: strings.addReaction })) : null, commands.onEdit ? (_jsx(Button, { icon: "edit", label: strings.edit, size: "sm", className: actionHooks.slotClass('edit'), onPress: commands.onEdit })) : null, commands.onDelete ? (_jsx(OverlayButton, { state: state, overlay: "delete", icon: "delete", label: strings.delete })) : null, children ? (_jsx("span", { hidden: true, onKeyDown: stopPortalledEvent, onContextMenu: stopPortalledEvent, onPointerDown: stopPortalledEvent, children: children })) : null] }));
}
//# sourceMappingURL=message-actions-bar.js.map