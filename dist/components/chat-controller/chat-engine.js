// The controller without React: the conversation's store and what the reader and the host do to it.
import { createValueStore } from '../../utils/value-store.js';
import { createIdFactory, patchState, readAlwaysAllowed, } from './chat-controller-state.js';
import { createOutgoingMessage, isAwaitingReader, toDismissal, } from './chat-reply.js';
import { endRun, respond, startRun } from './chat-run.js';
import { abortUploads, attachFiles, hasUploadedFiles, removeAttachment, retryAttachment, takeUploadedFiles, } from './chat-uploads.js';
/** Dismisses what the last message waits for: denies its approvals, dismisses its questions. */
function dismissWaiting(engine) {
    if (engine.run)
        engine.run.needsContinuation = false;
    const last = engine.store.get().messages.at(-1);
    for (const part of last?.parts.filter(isAwaitingReader) ?? []) {
        if (part.id)
            respond(engine, { id: part.id, response: toDismissal(part), continues: false });
    }
}
/** Streams the reply to `conversation` into a new, empty reply after it. */
function startReply(engine, conversation) {
    const replyId = engine.createId();
    const reply = {
        id: replyId,
        authorId: engine.getConfig().assistantId,
        createdAt: new Date().toISOString(),
        parts: [],
        status: 'streaming',
    };
    patchState(engine, { messages: [...conversation, reply] });
    engine.lastRun = { replyId };
    startRun(engine, { replyId, messages: conversation });
}
/** Sends the reader's message and streams the reply to it. */
function startTurn(engine, outgoing) {
    dismissWaiting(engine);
    const author = {
        authorId: engine.getConfig().currentUserId,
        createdAt: new Date().toISOString(),
    };
    const sent = createOutgoingMessage(outgoing, author);
    startReply(engine, [...engine.store.get().messages, sent]);
}
/** Streams on into the last message, from the conversation as it stands with `reply` last. */
function continueReply(engine, reply) {
    const { status: _status, error: _error, ...rest } = reply;
    const earlier = engine.store.get().messages.slice(0, -1);
    patchState(engine, { messages: [...earlier, { ...rest, status: 'streaming' }] });
    engine.lastRun = { replyId: reply.id, baseParts: reply.parts };
    startRun(engine, { replyId: reply.id, messages: [...earlier, { ...rest, status: 'complete' }] });
}
function sendNextQueued(engine) {
    const [next, ...rest] = engine.store.get().queue;
    if (!next)
        return;
    patchState(engine, { queue: rest });
    startTurn(engine, next);
}
/**
 * After a reply stopped streaming: a reply that ended by itself continues when the reader gave
 * responses it has not streamed on from, unless it still waits for the reader; otherwise the next
 * queued message goes out. A stopped or failed reply holds the queue.
 */
function settle(engine, settled) {
    if (!settled.isComplete || engine.run)
        return;
    const reply = engine.store.get().messages.at(-1);
    const isWaiting = reply?.parts.some(isAwaitingReader) ?? false;
    if (reply?.id === settled.replyId && settled.needsContinuation && !isWaiting) {
        continueReply(engine, reply);
    }
    else {
        sendNextQueued(engine);
    }
}
function send(engine, text, tokens) {
    if (!text.trim() && !hasUploadedFiles(engine))
        return;
    const attachments = takeUploadedFiles(engine);
    const outgoing = {
        id: engine.createId(),
        text,
        ...(tokens?.length ? { tokens } : {}),
        ...(attachments.length ? { attachments } : {}),
    };
    dismissWaiting(engine);
    const { queue } = engine.store.get();
    if (!engine.run && queue.length === 0) {
        startTurn(engine, outgoing);
        return;
    }
    patchState(engine, { queue: [...queue, outgoing] });
    if (!engine.run)
        sendNextQueued(engine);
}
/** Runs the last turn again after its reply failed: as it stood before, or from scratch. */
function retry(engine) {
    const { messages } = engine.store.get();
    const reply = messages.at(-1);
    if (engine.run || reply?.status !== 'error')
        return;
    const baseParts = engine.lastRun?.replyId === reply.id ? engine.lastRun.baseParts : undefined;
    if (baseParts) {
        continueReply(engine, { ...reply, parts: baseParts });
        return;
    }
    startReply(engine, messages.slice(0, -1));
}
/** Records Always allow for the call's tool and lets the call run. */
function alwaysAllow(engine, callId) {
    const call = engine.store
        .get()
        .messages.flatMap((message) => message.parts)
        .findLast((part) => part.type === 'tool-call' && part.id === callId && isAwaitingReader(part));
    if (call?.type !== 'tool-call')
        return;
    const allowed = readAlwaysAllowed(engine);
    if (!allowed.includes(call.name)) {
        const next = [...allowed, call.name];
        if (engine.getConfig().alwaysAllowed === undefined)
            patchState(engine, { alwaysAllowed: next });
        engine.getConfig().onAlwaysAllowedChange?.(next);
    }
    respond(engine, {
        id: callId,
        response: { type: 'approval', decision: 'always' },
        continues: true,
    });
}
/** Creates the controller over `initialMessages`, reading the host's options through `getConfig`. */
export function createChatEngine(getConfig, initialMessages) {
    const engine = {
        store: createValueStore({
            messages: initialMessages,
            isPending: false,
            queue: [],
            attachments: [],
            alwaysAllowed: [],
        }),
        getConfig,
        createId: createIdFactory(),
        uploads: new Map(),
        run: undefined,
        lastRun: undefined,
        onSettle: (settled) => settle(engine, settled),
    };
    const answer = (id, response) => {
        respond(engine, { id, response, continues: true });
    };
    return {
        store: engine.store,
        send: (text, tokens) => send(engine, text, tokens),
        stop: () => {
            if (engine.run)
                endRun(engine, engine.run, { status: 'cancelled' });
        },
        retry: () => retry(engine),
        setMessages: (update) => {
            const { messages } = engine.store.get();
            patchState(engine, { messages: typeof update === 'function' ? update(messages) : update });
        },
        setQueue: (queue) => patchState(engine, { queue }),
        approve: (id) => answer(id, { type: 'approval', decision: 'approved' }),
        deny: (id, reason) => answer(id, { type: 'approval', decision: 'denied', reason }),
        alwaysAllow: (id) => alwaysAllow(engine, id),
        answerQuestion: (id, answers) => answer(id, { type: 'question', status: 'answered', answers }),
        dismissQuestion: (id) => answer(id, { type: 'question', status: 'dismissed', answers: [] }),
        attach: (files) => attachFiles(engine, files),
        removeAttachment: (id) => removeAttachment(engine, id),
        retryAttachment: (id) => retryAttachment(engine, id),
        /** Stops the running reply and the uploads, as when the hook's component unmounts. */
        dispose: () => {
            if (engine.run)
                endRun(engine, engine.run, { status: 'cancelled' });
            abortUploads(engine);
        },
    };
}
//# sourceMappingURL=chat-engine.js.map