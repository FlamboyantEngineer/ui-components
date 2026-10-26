// The controller's state, the host's functions it calls, and the mutable context its parts share.
/** A promise settled from outside; an unawaited rejection is not reported as unhandled. */
export function createDeferred() {
    let resolve = () => { };
    let reject = () => { };
    const promise = new Promise((onResolve, onReject) => {
        resolve = onResolve;
        reject = onReject;
    });
    promise.catch(() => { });
    return { promise, resolve, reject };
}
/** Ids unique across sessions, so stored messages never clash with new ones. */
export function createIdFactory() {
    const prefix = `chat-${Math.random().toString(36).slice(2, 10)}`;
    let count = 0;
    return () => {
        count += 1;
        return `${prefix}-${count}`;
    };
}
/** Merges `patch` into the state. */
export function patchState(engine, patch) {
    engine.store.set({ ...engine.store.get(), ...patch });
}
/** Applies `update` to the message `id`, when the conversation still holds it. */
export function updateMessage(engine, id, update) {
    const { messages } = engine.store.get();
    if (!messages.some((message) => message.id === id))
        return;
    patchState(engine, {
        messages: messages.map((message) => (message.id === id ? update(message) : message)),
    });
}
/** The tools the reader always allows: the host's, else the controller's own. */
export function readAlwaysAllowed(engine) {
    return engine.getConfig().alwaysAllowed ?? engine.store.get().alwaysAllowed;
}
//# sourceMappingURL=chat-controller-state.js.map