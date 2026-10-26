import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useRemovalFocus } from '../../utils/use-removal-focus.js';
import { Button } from '../button/button.js';
import { chatHooks as hooks } from './chat-hooks.js';
/**
 * The messages waiting for the running reply to end, in the order they will go out, each with Edit
 * (in the composer) and Remove. Focus stays in the list as messages are removed.
 */
export function ChatQueue({ queue, onQueueChange, onEdit, editingId, composerRef, }) {
    const strings = useUiStrings();
    const labelId = useId();
    const removal = useRemovalFocus(queue, composerRef);
    if (queue.length === 0)
        return null;
    return (_jsxs("div", { ...hooks.slot('queue'), children: [_jsx("div", { id: labelId, ...hooks.slot('queue-label'), children: strings.chatQueuedMessages(queue.length) }), _jsx("ol", { ...hooks.slot('queue-list'), "aria-labelledby": labelId, children: queue.map((entry, index) => (_jsxs("li", { ...hooks.slot('queue-item', { editing: entry.id === editingId }), children: [_jsx("span", { ...hooks.slot('queue-text'), children: entry.text }), onQueueChange ? (_jsxs(_Fragment, { children: [_jsx(Button, { icon: "edit", label: strings.chatEditQueued(index + 1), size: "sm", className: hooks.slotClass('queue-edit'), onPress: () => onEdit(entry.id) }), _jsx(Button, { ref: (button) => removal.register(entry.id, button), icon: "close", label: strings.chatRemoveQueued(index + 1), size: "sm", className: hooks.slotClass('queue-remove'), onPress: () => {
                                        removal.willRemove(entry.id);
                                        onQueueChange(queue.filter((item) => item.id !== entry.id));
                                    } })] })) : null] }, entry.id))) })] }));
}
//# sourceMappingURL=chat-queue.js.map