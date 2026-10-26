// A running reply: streaming `send`'s events into the reply, waiting for the reader, and ending.
import { toErrorMessage } from '../../utils/to-error-message.js';
import { createDeferred, patchState, readAlwaysAllowed, updateMessage, } from './chat-controller-state.js';
import { findAwaitingMessage, recordResponse } from './chat-reply.js';
import { reduceChatStream } from './chat-stream.js';
import { endChatReply } from './chat-stream-parts.js';
/** The waiter that hands the response to the part `id` over to `waitFor`. */
function waiterFor(run, id) {
    let waiter = run.waiters.get(id);
    if (!waiter) {
        waiter = createDeferred();
        run.waiters.set(id, waiter);
    }
    return waiter;
}
function waitFor(run, id) {
    const { signal } = run.controller;
    return signal.aborted ? Promise.reject(signal.reason) : waiterFor(run, id).promise;
}
/** The reducer's context at `now`: the tools always allowed, and the run's clock. */
function readContext(engine, run, now) {
    return {
        alwaysAllowed: readAlwaysAllowed(engine),
        getElapsed: (id) => {
            const start = run.starts.get(id);
            return start === undefined ? undefined : now - start;
        },
    };
}
/** After an approval request or question: hands an automatic approval over, or notes an await. */
function noteRequest(engine, run, event) {
    const reply = engine.store.get().messages.find((message) => message.id === run.replyId);
    const part = reply?.parts.find((entry) => entry.type === 'tool-call' && entry.id === event.id);
    const isAutoApproved = part?.type === 'tool-call' && part.approval?.isAutoApproved === true;
    if (isAutoApproved && event.await) {
        waiterFor(run, event.id).resolve({ type: 'approval', decision: 'approved', isAutoApproved });
    }
    else if (isAutoApproved) {
        run.needsContinuation = true;
    }
    else if (event.await) {
        run.awaited.add(event.id);
    }
}
function applyEvent(engine, run, event) {
    const now = Date.now();
    if ((event.type === 'reasoning-delta' || event.type === 'tool-call') &&
        !run.starts.has(event.id)) {
        run.starts.set(event.id, now);
    }
    const context = readContext(engine, run, now);
    updateMessage(engine, run.replyId, (message) => reduceChatStream(message, event, context));
    if (event.type === 'approval-request' || event.type === 'question') {
        noteRequest(engine, run, event);
    }
}
/**
 * Ends the run once: settles the reply, rejects the waiters still open and, for a stopped or
 * failed reply, aborts the signal. Then the controller continues the reply or sends the next
 * queued message.
 */
export function endRun(engine, run, outcome) {
    if (engine.run !== run)
        return;
    engine.run = undefined;
    const isComplete = outcome.status === 'complete';
    if (!isComplete)
        run.controller.abort();
    const reason = run.controller.signal.reason ?? new DOMException('The reply ended.', 'AbortError');
    for (const waiter of run.waiters.values())
        waiter.reject(reason);
    const context = readContext(engine, run, Date.now());
    updateMessage(engine, run.replyId, (message) => endChatReply(message, outcome, context));
    patchState(engine, { isPending: false });
    engine.onSettle({ replyId: run.replyId, isComplete, needsContinuation: run.needsContinuation });
}
async function streamRun(engine, run, messages) {
    const { send, failureText } = engine.getConfig();
    try {
        const events = send(messages, {
            signal: run.controller.signal,
            waitFor: (id) => waitFor(run, id),
        });
        for await (const event of events) {
            if (engine.run !== run)
                break;
            if (event.type === 'error') {
                endRun(engine, run, { status: 'error', error: event.message || failureText });
                break;
            }
            if (event.type === 'finish')
                break;
            applyEvent(engine, run, event);
        }
        endRun(engine, run, { status: 'complete' });
    }
    catch (error) {
        endRun(engine, run, { status: 'error', error: toErrorMessage(error, failureText) });
    }
}
/** Streams `send`'s reply to `messages` into the conversation's reply `replyId`. */
export function startRun(engine, plan) {
    const run = {
        replyId: plan.replyId,
        controller: new AbortController(),
        waiters: new Map(),
        awaited: new Set(),
        starts: new Map(),
        needsContinuation: false,
    };
    engine.run = run;
    patchState(engine, { isPending: true });
    void streamRun(engine, run, plan.messages);
}
/**
 * Records the reader's response on the part `id` while it waits for them. An awaited part hands
 * the response to `waitFor`; any other continues its reply (`continues`) once nothing else waits,
 * or once the running reply ends.
 */
export function respond(engine, answer) {
    const { id, response, continues } = answer;
    const { messages } = engine.store.get();
    const index = findAwaitingMessage(messages, id);
    const message = messages[index];
    if (!message)
        return;
    updateMessage(engine, message.id, (current) => recordResponse(current, id, response));
    const { run } = engine;
    if (run && (run.awaited.has(id) || run.waiters.has(id))) {
        waiterFor(run, id).resolve(response);
    }
    else if (run?.replyId === message.id) {
        run.needsContinuation ||= continues;
    }
    else if (!run && continues) {
        engine.onSettle({ replyId: message.id, isComplete: true, needsContinuation: true });
    }
}
//# sourceMappingURL=chat-run.js.map