import { jsx as _jsx } from "react/jsx-runtime";
import { MessageActionsBar } from './message-actions-bar.js';
import { MessageCommandOverlays } from './message-command-overlays.js';
import { hasCommands, splitCommands, useMessageCommands, } from './message-commands.js';
/**
 * The action bar for a message's `actions`: a toolbar of the commands whose callbacks are given
 * (Copy, the ratings, Reply, React, Edit, Delete), with the feedback details, the emoji picker and
 * the delete confirmation they open. Arrow keys move between the commands. To offer the same
 * commands on a secondary click or long press, use `ChatMessageActionsMenu`, which draws this bar.
 */
export function ChatMessageActions(props) {
    const [commands, rest] = splitCommands(props);
    const state = useMessageCommands(commands);
    if (!hasCommands(commands))
        return null;
    return (_jsx(MessageActionsBar, { ...rest, state: state, children: _jsx(MessageCommandOverlays, { state: state }) }));
}
export { ChatMessageActionsMenu } from './chat-message-actions-menu.js';
//# sourceMappingURL=chat-message-actions.js.map