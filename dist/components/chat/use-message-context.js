import { useMemo } from 'react';
import { useLatest } from '../../utils/use-latest.js';
/** The command handlers: each present while its callback is, calling the latest callback. */
function useCommandHandlers(options, state) {
    const latest = useLatest(options);
    const { startEdit, startReply } = state;
    const has = [
        options.onCopy,
        options.onFeedback,
        options.onReply,
        options.onReact,
        options.onEdit,
        options.onDelete,
    ].map((callback) => callback !== undefined);
    const [copy, feedback, reply, react, edit, remove] = has;
    return useMemo(() => ({
        copy: copy ? (id) => latest.current.onCopy?.(id) : undefined,
        feedback: feedback
            ? (id, rating) => latest.current.onFeedback?.(id, rating)
            : undefined,
        reply: reply ? startReply : undefined,
        react: react
            ? (id, emoji, isReacted) => latest.current.onReact?.(id, emoji, isReacted)
            : undefined,
        edit: edit ? (id) => startEdit({ kind: 'message', id }) : undefined,
        delete: remove ? (id) => latest.current.onDelete?.(id) : undefined,
    }), [copy, feedback, reply, react, edit, remove, latest, startEdit, startReply]);
}
/**
 * What every message shares, kept while the chat's options stay the same, so a streamed token
 * re-renders the streaming message only.
 */
export function useMessageContext(options, state, { participants, isAssistantChat, }) {
    const handlers = useCommandHandlers(options, state);
    const latest = useLatest(options);
    const hasRetry = options.onRetry !== undefined;
    const onRetry = useMemo(() => (hasRetry ? (id) => latest.current.onRetry?.(id) : undefined), [hasRetry, latest]);
    const { textFormat, toolRenderers, renderPart, onApplyCode, expandsActivity } = options;
    const { onApprove, onDeny, onAlwaysAllow, onAnswerQuestion, onDismissQuestion } = options;
    const { questionAnsweredMark, getReference } = options;
    const parts = useMemo(() => ({
        ...{ textFormat, toolRenderers, renderPart, onApplyCode, expandsActivity },
        ...{ onApprove, onDeny, onAlwaysAllow, onAnswerQuestion, onDismissQuestion },
        ...{ questionAnsweredMark, getReference },
    }), [
        textFormat,
        toolRenderers,
        renderPart,
        onApplyCode,
        expandsActivity,
        onApprove,
        onDeny,
        onAlwaysAllow,
        onAnswerQuestion,
        onDismissQuestion,
        questionAnsweredMark,
        getReference,
    ]);
    const { conversationId, currentUserId, getNow, feedbackReasons } = options;
    const { thinkingText, thinkingIcon, thinkingUntil = 'text' } = options;
    const { jumpTo, setExpandedParts } = state;
    return useMemo(() => ({
        ...{ handlers, currentUserId, isAssistantChat, participants, feedbackReasons },
        ...{ conversationId, parts, getNow, onRetry },
        ...{ thinkingText, thinkingIcon, thinkingUntil },
        onQuotePress: jumpTo,
        onExpandedPartsChange: setExpandedParts,
    }), [
        handlers,
        currentUserId,
        isAssistantChat,
        participants,
        feedbackReasons,
        conversationId,
        parts,
        getNow,
        onRetry,
        thinkingText,
        thinkingIcon,
        thinkingUntil,
        jumpTo,
        setExpandedParts,
    ]);
}
//# sourceMappingURL=use-message-context.js.map