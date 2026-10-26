// The chat composer's public handle and draft reports, for the host's own controls outside the
// chat (specs/CHAT.md, UIC-CHAT-3.11).
import { useEffect, useImperativeHandle } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { toComposerTokens, toDisplayTokens } from './chat-model.js';
function toChatDraft(draft) {
    return { text: draft.text, tokens: toDisplayTokens(draft.tokens) };
}
/** The composer's draft as the chat reports it, for the conversation it shows. */
function readChatDraft(composer, conversationId) {
    return { conversationId, ...toChatDraft(composer?.getDraft() ?? { text: '', tokens: [] }) };
}
/**
 * Gives `handleRef` a handle bound to the shown conversation, and reports the draft to
 * `onDraftChange` when it loads (on mount and on each change of conversation); the composer's
 * edits report through the returned function.
 */
export function useChatComposerHandle(options) {
    const { handleRef, composerRef, conversationId } = options;
    const latest = useLatest(options);
    useImperativeHandle(handleRef, () => ({
        insertToken: (token, insert) => {
            const shown = latest.current.conversationId;
            const asked = insert?.conversationId ?? conversationId;
            if (shown !== conversationId || asked !== shown)
                return 'other-conversation';
            const composer = composerRef.current;
            if (!composer)
                return 'unavailable';
            const [pill = token] = toComposerTokens([token]);
            const result = composer.insertToken(pill);
            if (result === 'inserted')
                latest.current.focusComposer();
            return result;
        },
        getDraft: () => readChatDraft(composerRef.current, latest.current.conversationId),
    }), [conversationId, composerRef, latest]);
    useEffect(() => {
        const composer = composerRef.current;
        if (composer)
            latest.current.onDraftChange?.(readChatDraft(composer, conversationId));
    }, [composerRef, conversationId, latest]);
    return (draft) => latest.current.onDraftChange?.({ conversationId, ...toChatDraft(draft) });
}
//# sourceMappingURL=chat-composer-handle.js.map