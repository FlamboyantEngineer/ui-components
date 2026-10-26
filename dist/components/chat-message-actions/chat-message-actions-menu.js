import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { cloneElement, isValidElement, useMemo, useRef, } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { ContextMenuTrigger } from '../context-menu/context-menu.js';
import { Menu, MenuItem, MenuSection } from '../menu/menu.js';
import { MessageActionsBar } from './message-actions-bar.js';
import { MessageCommandOverlays } from './message-command-overlays.js';
import { hasCommands, splitCommands, useMessageCommands, } from './message-commands.js';
/** The rating a menu selection change chose, or the shown rating when the reader unchecked it. */
function toChosenRating(keys, shown) {
    const chosen = keys === 'all' ? undefined : [...keys].find((key) => key !== shown);
    return chosen === 'up' || chosen === 'down' ? chosen : shown;
}
/** The menu of the commands, in the bar's order; the ratings are checkable. */
function CommandMenu({ state, anchor, }) {
    const strings = useUiStrings();
    const { commands, rating } = state;
    const run = (key) => {
        if (key === 'copy')
            state.copy();
        else if (key === 'reply')
            commands.onReply?.();
        else if (key === 'edit')
            commands.onEdit?.();
        else if (key === 'react' || key === 'delete')
            state.openOverlay(key, anchor);
    };
    return (_jsxs(Menu, { onAction: run, children: [commands.copyText === undefined ? null : (_jsx(MenuItem, { id: "copy", icon: "copy", children: strings.copy })), commands.onFeedback ? (_jsxs(MenuSection, { "aria-label": strings.messageFeedback, selectionMode: "multiple", selectedKeys: rating ? [rating] : [], shouldCloseOnSelect: true, onSelectionChange: (keys) => {
                    const chosen = toChosenRating(keys, rating);
                    if (chosen)
                        state.rate(chosen, anchor);
                }, children: [_jsx(MenuItem, { id: "up", icon: "thumbs-up", children: strings.goodResponse }), _jsx(MenuItem, { id: "down", icon: "thumbs-down", children: strings.badResponse })] })) : null, commands.onReply ? (_jsx(MenuItem, { id: "reply", icon: "reply", children: strings.reply })) : null, commands.onReact ? (_jsx(MenuItem, { id: "react", icon: "emoji", children: strings.addReaction })) : null, commands.onEdit ? (_jsx(MenuItem, { id: "edit", icon: "edit", children: strings.edit })) : null, commands.onDelete ? (_jsx(MenuItem, { id: "delete", icon: "delete", tone: "danger", children: strings.delete })) : null] }));
}
/**
 * Offers a message's commands in a context menu, on a secondary click, a long touch, the Context
 * Menu key or Shift+F10 on the message, and hands the message its action bar. The menu and the bar
 * share one state: a rating, a copy or an overlay opened from either shows in both. Overlays opened
 * from the menu are placed against the message.
 */
export function ChatMessageActionsMenu(props) {
    const strings = useUiStrings();
    const [commands, { children, 'aria-label': ariaLabel, ...rest }] = splitCommands(props);
    const state = useMessageCommands(commands);
    const targetRef = useRef(null);
    const isEnabled = hasCommands(commands);
    const message = children(isEnabled ? _jsx(MessageActionsBar, { state: state }) : null);
    const target = isValidElement(message) ? message : null;
    const ownRef = target?.props.ref;
    const ref = useMemo(() => mergeRefs(ownRef, targetRef), [ownRef]);
    if (!target) {
        throw new Error('ChatMessageActionsMenu needs its children to return a message element.');
    }
    return (_jsxs(_Fragment, { children: [_jsxs(ContextMenuTrigger, { ...rest, isDisabled: !isEnabled, "aria-label": ariaLabel ?? strings.messageActions, children: [cloneElement(target, { ref }), _jsx(CommandMenu, { state: state, anchor: targetRef })] }), isEnabled ? _jsx(MessageCommandOverlays, { state: state }) : null] }));
}
//# sourceMappingURL=chat-message-actions-menu.js.map