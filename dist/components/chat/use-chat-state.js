import { useCallback, useMemo, useRef, useState } from 'react';
function createState(conversationId) {
    return { conversationId, editing: null, replyingId: null, jumpedId: undefined, expanded: {} };
}
/**
 * The editing, replying, quote jump and expansion state of a chat, which starts over when the
 * conversation changes. The commands keep their identities, so the messages need not re-render.
 */
export function useChatState(conversationId) {
    const [own, setOwn] = useState(() => createState(conversationId));
    const composerRef = useRef(null);
    // The editor detaches and reattaches its ref on each render, after the layout effects of the
    // queue above it; keeping the last text box lets those effects still find it.
    const setComposer = useCallback((element) => {
        if (element)
            composerRef.current = element;
    }, []);
    let current = own;
    if (own.conversationId !== conversationId) {
        current = createState(conversationId);
        setOwn(current);
    }
    // Focus moves at once, and again once an overlay that ran the command, such as a context menu,
    // has handed focus back to where it opened.
    const focusComposer = useCallback(() => {
        composerRef.current?.focus();
        requestAnimationFrame(() => requestAnimationFrame(() => composerRef.current?.focus()));
    }, []);
    const commands = useMemo(() => {
        const update = (patch) => setOwn((state) => ({ ...state, ...patch }));
        return {
            startEdit: (editing) => {
                update({ editing, replyingId: null });
                focusComposer();
            },
            cancelEdit: () => update({ editing: null }),
            startReply: (replyingId) => {
                update({ replyingId, editing: null });
                focusComposer();
            },
            cancelReply: () => update({ replyingId: null }),
            endReply: (scope, messageId) => setOwn((state) => state.conversationId === scope && state.replyingId === messageId
                ? { ...state, replyingId: null }
                : state),
            endEdit: (scope, editing) => setOwn((state) => state.conversationId === scope &&
                state.editing?.kind === editing.kind &&
                state.editing.id === editing.id
                ? { ...state, editing: null }
                : state),
            jumpTo: (jumpedId) => update({ jumpedId }),
            setExpandedParts: (messageId, parts) => setOwn((state) => ({ ...state, expanded: { ...state.expanded, [messageId]: parts } })),
        };
    }, [focusComposer]);
    const { conversationId: _scope, ...state } = current;
    return { ...state, ...commands, composerRef, setComposer, focusComposer };
}
//# sourceMappingURL=use-chat-state.js.map