// The events an assistant's reply streams in, and the pure reducer that folds them into the reply.
import { addPart, appendFile, appendSource, closeOpenParts, endChatReply, updatePart, } from './chat-stream-parts.js';
const withParts = (message, parts) => ({
    ...message,
    parts,
});
/**
 * Appends to the open text part, the last part but for the sources list (sources arriving
 * between citations do not break the text), or starts a text part.
 */
function appendText(message, { text }, context) {
    const parts = closeOpenParts(message.parts, context, (part) => part.type === 'text');
    const index = parts.findLastIndex((part) => part.type !== 'sources');
    const open = parts[index];
    if (open?.type === 'text' && open.status === 'streaming') {
        return withParts(message, parts.map((part, position) => position === index ? { ...open, text: open.text + text } : part));
    }
    return withParts(message, [...parts, { type: 'text', text, status: 'streaming' }]);
}
function appendReasoning(message, { id, text }, context) {
    const isSame = (part) => part.type === 'reasoning' && part.id === id;
    const parts = closeOpenParts(message.parts, context, isSame);
    if (!parts.some(isSame)) {
        return withParts(message, [...parts, { type: 'reasoning', id, text, status: 'streaming' }]);
    }
    return withParts(message, updatePart(parts, { type: 'reasoning', id }, (part) => ({ ...part, text: part.text + text })));
}
/** Starts a tool call, running, or updates the name, label and arguments of the one with its id. */
function upsertToolCall(message, { type: _type, ...call }, context) {
    if (!message.parts.some((part) => part.type === 'tool-call' && part.id === call.id)) {
        return withParts(message, addPart(message.parts, { type: 'tool-call', status: 'running', ...call }, context));
    }
    return withParts(message, updatePart(message.parts, { type: 'tool-call', id: call.id }, (part) => ({ ...part, ...call })));
}
const handlers = {
    'text-delta': appendText,
    'reasoning-delta': appendReasoning,
    'reasoning-end': (message, { id, durationMs }, context) => withParts(message, updatePart(message.parts, { type: 'reasoning', id }, (part) => ({
        ...part,
        status: 'complete',
        durationMs: durationMs ?? part.durationMs ?? context.getElapsed?.(id),
    }))),
    'tool-call': upsertToolCall,
    'tool-result': (message, { id, result, error, durationMs }, context) => withParts(message, updatePart(message.parts, { type: 'tool-call', id }, (part) => ({
        ...part,
        status: part.status === 'denied' ? part.status : error ? 'failed' : 'succeeded',
        result,
        error,
        durationMs: durationMs ?? part.durationMs ?? context.getElapsed?.(id),
    }))),
    'approval-request': (message, { id, scopeLabel }, context) => withParts(message, updatePart(message.parts, { type: 'tool-call', id }, (part) => context.alwaysAllowed?.includes(part.name)
        ? { ...part, status: 'running', approval: { scopeLabel, isAutoApproved: true } }
        : { ...part, status: 'approval-requested', approval: { scopeLabel } })),
    question: (message, { id, questions }, context) => withParts(message, addPart(message.parts, { type: 'question', id, questions, status: 'pending' }, context)),
    plan: (message, { type: _type, ...plan }, context) => withParts(message, addPart(message.parts, { type: 'plan', ...plan }, context)),
    'plan-step': (message, { planId, stepId, status }) => withParts(message, updatePart(message.parts, { type: 'plan', id: planId }, (part) => ({
        ...part,
        steps: part.steps.map((step) => (step.id === stepId ? { ...step, status } : step)),
    }))),
    source: (message, { source }) => withParts(message, appendSource(message.parts, source)),
    file: (message, { attachment }, context) => withParts(message, appendFile(closeOpenParts(message.parts, context), attachment)),
    code: (message, { type: _type, ...code }, context) => withParts(message, addPart(message.parts, { type: 'code', ...code }, context)),
    diff: (message, { type: _type, ...diff }, context) => withParts(message, addPart(message.parts, { type: 'diff', ...diff }, context)),
    custom: (message, { type: _type, ...custom }, context) => withParts(message, addPart(message.parts, { type: 'custom', ...custom }, context)),
    status: (message, { text }) => ({ ...message, statusText: text || undefined }),
    finish: (message, _event, context) => endChatReply(message, { status: 'complete' }, context),
    error: (message, { message: error }, context) => endChatReply(message, { status: 'error', error }, context),
};
/**
 * Folds one stream event into the assistant's reply and returns the new reply, leaving the given
 * one unchanged. Events about a part the reply does not hold (a result for an unknown tool call, a
 * step of an unknown plan) change nothing.
 */
export function reduceChatStream(message, event, context = {}) {
    const handler = handlers[event.type];
    return handler(message, event, context);
}
//# sourceMappingURL=chat-stream.js.map