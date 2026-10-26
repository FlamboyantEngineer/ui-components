// The toast queue: a building-block queue for order and visibility, plus content that updates in
// place, lifetimes the toasts restart, promise toasts and exits that play before removal.
/** The longest timer a browser keeps; React Aria needs a timer on every toast the queue restarts. */
const timerlessTimeout = 2 ** 31 - 1;
const defaultToastTimeout = 5000;
/** Lifecycles by the content object the React Aria queue holds for each toast. */
const lifecycles = new WeakMap();
/** The lifecycle of a toast, which every toast gets as `createToastQueue` adds it. */
export function getToastLifecycle(content) {
    const lifecycle = lifecycles.get(content);
    if (!lifecycle)
        throw new Error('A toast must come from createToastQueue.');
    return lifecycle;
}
function resolveContent(content, value) {
    return typeof content === 'function' ? content(value) : content;
}
/** The lifetime an update starts: its own, none while pending, the default once done, else none. */
function resolveUpdateTimeout(previous, next, { options, defaultTimeout }) {
    if (options?.timeout !== undefined)
        return options.timeout;
    if (next.isPending && !previous.isPending)
        return 0;
    if (previous.isPending && !next.isPending)
        return defaultTimeout;
    return undefined;
}
function createRecord(content, timeout) {
    const snapshot = { content, timeout, lifetime: 0, isOpen: true };
    return { snapshot, listeners: new Set(), mounted: 0 };
}
function setSnapshot(record, snapshot) {
    record.snapshot = snapshot;
    for (const listener of record.listeners)
        listener();
}
function createLifecycle(record, remove) {
    return {
        subscribe: (listener) => {
            record.listeners.add(listener);
            return () => record.listeners.delete(listener);
        },
        getSnapshot: () => record.snapshot,
        mount: () => {
            record.mounted += 1;
            return () => {
                record.mounted -= 1;
            };
        },
        finishExit: remove,
    };
}
/** Adds the pending toast of a promise and settles it in place when the promise does. */
function startPromiseToast({ queue, work, contents: { pending, success, error }, options: { timeout, ...options } = {}, }) {
    const key = queue.add({ ...pending, isPending: true }, { ...options, timeout: 0 });
    const settle = (content) => queue.update(key, { ...content, isPending: false }, timeout === undefined ? {} : { timeout });
    work.then((value) => settle({ tone: 'success', ...resolveContent(success, value) }), (reason) => settle({ tone: 'danger', ...resolveContent(error, reason) }));
    return key;
}
/**
 * A toast queue over a building-block queue, adding a default timeout, replacement by `id`,
 * in-place updates, promise toasts and closing exits. Every close (its timer, its dismiss button,
 * its action or `close`) first lets a rendered toast play its exit, then removes it.
 */
export function createQueueOverStore(ariaQueue, { defaultTimeout = defaultToastTimeout } = {}) {
    const removeNow = ariaQueue.close.bind(ariaQueue);
    const records = new Map();
    const keysById = new Map();
    const replacedKeys = new Set();
    // The building block's timers, dismiss buttons and state all close through the queue's `close`.
    ariaQueue.close = (key) => {
        const record = records.get(key);
        if (record && record.mounted > 0) {
            if (record.snapshot.isOpen)
                setSnapshot(record, { ...record.snapshot, isOpen: false });
            return;
        }
        removeNow(key);
    };
    // Each toast holds its own timer while its region is hovered or holds focus (useToastTimer). The
    // building block's region pauses and resumes every timer only as its hover and focus change, which
    // misses a timer started meanwhile, and resuming a running timer starts a second timeout, so its
    // calls do nothing.
    ariaQueue.pauseAll = () => { };
    ariaQueue.resumeAll = () => { };
    function add(content, { id, onClose, timeout } = {}) {
        const lifetime = timeout ?? (content.isPending ? 0 : defaultTimeout);
        const previous = id === undefined ? undefined : keysById.get(id);
        if (previous !== undefined) {
            replacedKeys.add(previous);
            ariaQueue.close(previous);
        }
        const queued = { ...content };
        const key = ariaQueue.add(queued, {
            timeout: lifetime > 0 ? lifetime : timerlessTimeout,
            onClose: () => {
                records.delete(key);
                if (id !== undefined && keysById.get(id) === key)
                    keysById.delete(id);
                if (!replacedKeys.delete(key))
                    onClose?.();
            },
        });
        const record = createRecord(content, lifetime);
        records.set(key, record);
        lifecycles.set(queued, createLifecycle(record, () => removeNow(key)));
        if (id !== undefined)
            keysById.set(id, key);
        return key;
    }
    function update(key, content, options) {
        const record = records.get(key);
        if (!record?.snapshot.isOpen)
            return;
        const previous = record.snapshot;
        const timeout = resolveUpdateTimeout(previous.content, content, { options, defaultTimeout });
        const lifetime = timeout === undefined ? {} : { timeout, lifetime: previous.lifetime + 1 };
        setSnapshot(record, { ...previous, content, ...lifetime });
    }
    function clear() {
        keysById.clear();
        replacedKeys.clear();
        records.clear();
        ariaQueue.clear();
    }
    return {
        add,
        update,
        promise: (work, contents, options) => startPromiseToast({ queue: { add, update }, work, contents, options }),
        close: (key) => ariaQueue.close(key),
        clear,
        defaultTimeout,
    };
}
//# sourceMappingURL=toast-queue.js.map