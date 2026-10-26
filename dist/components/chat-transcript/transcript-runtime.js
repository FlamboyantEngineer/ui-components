import { createTranscriptRegistry } from './transcript-registry.js';
import { createScrollKeeper } from './transcript-scroll.js';
import { createTabbablesManager } from './transcript-tabbables.js';
import { createWindowModel } from './transcript-window.js';
/** Creates the runtime once per transcript. */
export function createTranscriptRuntime() {
    const registry = createTranscriptRegistry();
    const viewport = { current: null };
    const spacer = { current: null };
    const runtime = {
        registry,
        keeper: createScrollKeeper({
            viewport: () => viewport.current,
            spacer: () => spacer.current,
            element: (key) => registry.element(key),
            mounted: () => runtime.mounted,
        }),
        windowModel: createWindowModel(),
        tabbables: createTabbablesManager(registry),
        viewport,
        feed: { current: null },
        spacer,
        keys: null,
        indexOf: new Map(),
        mountedItems: [],
        mounted: { keys: [], elements: [] },
        seen: new Set(),
        activeKey: null,
        pendingFocus: null,
        unseen: new Set(),
        streaming: new Set(),
        olderRequested: false,
        wasLoadingOlder: false,
        handledHighlight: null,
        readKey: null,
        reportedKey: null,
        timers: new Map(),
        isPaging: false,
    };
    return runtime;
}
/** Whether a child is a message: it registered as one, or it never mounted to say otherwise. */
export function isTranscriptMessage(runtime, key) {
    return runtime.registry.hasRegistered(key) || !runtime.seen.has(key);
}
/** Every message's key, oldest first. */
export function listMessageKeys(runtime) {
    return (runtime.keys ?? []).filter((key) => isTranscriptMessage(runtime, key));
}
/** The newest message's key. */
export function findLastMessageKey(runtime) {
    return (runtime.keys ?? []).findLast((key) => runtime.registry.hasRegistered(key)) ?? null;
}
/** Re-reads which messages are mounted, after a commit. */
export function refreshMounted(runtime) {
    const keys = [];
    const elements = [];
    for (const key of runtime.keys ?? []) {
        const element = runtime.registry.element(key);
        if (element) {
            keys.push(key);
            elements.push(element);
        }
    }
    runtime.mounted = { keys, elements };
}
/** The child key of a message id the host names, if any. */
export function resolveMessageKey(runtime, id) {
    return id === undefined ? undefined : runtime.registry.keyFor(id);
}
/** Publishes the tab stop, positions and highlight each message reads. */
export function publishView(runtime, settings) {
    const keys = listMessageKeys(runtime);
    const active = runtime.activeKey;
    const positions = new Map(keys.map((key, index) => [key, index + 1]));
    const highlighted = resolveMessageKey(runtime, settings.highlightedMessageId) ?? null;
    runtime.registry.view.set({
        tabStopKey: active !== null && positions.has(active) ? active : findLastMessageKey(runtime),
        highlightedKey: highlighted !== null && positions.has(highlighted) ? highlighted : null,
        positions,
        setSize: settings.hasOlder ? -1 : keys.length,
    });
}
/** The text a message announces without a summary: its content's text, whitespace collapsed. */
export function readMessageText(element) {
    const content = element?.querySelector('.ui-chat-message__content') ?? element;
    return (content?.textContent ?? '').replace(/\s+/g, ' ').trim();
}
/** Starts over for another conversation. */
export function resetConversation(runtime) {
    runtime.keeper.reset();
    runtime.activeKey = null;
    runtime.unseen.clear();
    runtime.streaming.clear();
    runtime.readKey = null;
    runtime.reportedKey = null;
    runtime.handledHighlight = null;
}
//# sourceMappingURL=transcript-runtime.js.map