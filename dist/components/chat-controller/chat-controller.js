import { useEffect, useMemo, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useLatest } from '../../utils/use-latest.js';
import { useStoreValue } from '../../utils/value-store.js';
import { createChatEngine } from './chat-engine.js';
import { listPrompts } from './chat-reply.js';
export { isAwaitingReader } from './chat-reply.js';
export { reduceChatStream } from './chat-stream.js';
function useChatProps(engine, state, options) {
    const { messages, isPending, queue, attachments } = state;
    const { currentUserId, upload } = options;
    const canUpload = upload !== undefined;
    const history = useMemo(() => listPrompts(messages, currentUserId), [messages, currentUserId]);
    return useMemo(() => ({
        messages,
        isPending,
        onSend: engine.send,
        onStop: engine.stop,
        onRetry: (messageId) => {
            if (messages.at(-1)?.id === messageId)
                engine.retry();
        },
        onApprove: engine.approve,
        onDeny: engine.deny,
        onAlwaysAllow: engine.alwaysAllow,
        onAnswerQuestion: engine.answerQuestion,
        onDismissQuestion: engine.dismissQuestion,
        queue,
        onQueueChange: engine.setQueue,
        history,
        attachments,
        onAttach: canUpload ? engine.attach : undefined,
        onRemoveAttachment: canUpload ? engine.removeAttachment : undefined,
        onRetryAttachment: canUpload ? engine.retryAttachment : undefined,
    }), [engine, messages, isPending, queue, history, attachments, canUpload]);
}
/**
 * Turns a host's `send`, which streams library events, into a chat's state and callbacks: the
 * messages with their streaming reply, stop, retry, errors, a queue of follow-ups, approvals,
 * questions, prompt history and uploads. It keeps no backend of its own.
 */
export function useChatController(options) {
    const strings = useUiStrings();
    const config = useLatest({ ...options, failureText: strings.chatReplyFailed });
    const [engine] = useState(() => createChatEngine(() => config.current, options.initialMessages ?? []));
    useEffect(() => () => engine.dispose(), [engine]);
    const state = useStoreValue(engine.store);
    const props = useChatProps(engine, state, options);
    return {
        messages: state.messages,
        isPending: state.isPending,
        queue: state.queue,
        statusText: state.isPending ? state.messages.at(-1)?.statusText : undefined,
        send: engine.send,
        stop: engine.stop,
        retry: engine.retry,
        setMessages: engine.setMessages,
        props,
    };
}
//# sourceMappingURL=chat-controller.js.map