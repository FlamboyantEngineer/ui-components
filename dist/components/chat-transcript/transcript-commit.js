import { isEditableTarget } from '../../utils/is-editable-target.js';
import { readOffset } from './transcript-geometry.js';
import { isTranscriptMessage, readMessageText, resolveMessageKey, } from './transcript-runtime.js';
import { syncWithScroll } from './transcript-sync.js';
/** Announces a message that arrived, or that finished streaming. */
export function announceMessage(runtime, settings, key) {
    const entry = runtime.registry.entry(key);
    if (!entry)
        return;
    settings.announcer.message({
        author: entry.authorName ?? null,
        text: entry.summary ?? readMessageText(runtime.registry.element(key)),
    });
}
/**
 * Handles what arrived: the reader's own message brings the view to it (anchored at the top in
 * anchor mode, else following the bottom); messages from others are announced, a streaming one
 * once it completes.
 */
export function applyArrivals(runtime, settings, arrivals) {
    let sent = null;
    for (const key of arrivals) {
        const entry = runtime.registry.entry(key);
        if (!entry)
            continue;
        if (entry.origin === 'sent')
            sent = key;
        else if (entry.status === 'streaming')
            runtime.streaming.add(key);
        else if (entry.status === 'complete')
            announceMessage(runtime, settings, key);
    }
    if (sent === null)
        return;
    runtime.unseen.clear();
    if (settings.scrollMode === 'anchor')
        runtime.keeper.anchor(sent);
    else
        runtime.keeper.holdBottom();
}
/** Counts the messages from others that arrived below the view. */
export function countUnseen(runtime, arrivals) {
    const viewport = runtime.viewport.current;
    if (!viewport)
        return;
    for (const key of arrivals) {
        const entry = runtime.registry.entry(key);
        if (!entry || entry.origin === 'sent')
            continue;
        const element = runtime.registry.element(key);
        if (!element || readOffset(element, viewport) >= viewport.clientHeight)
            runtime.unseen.add(key);
    }
}
/** Announces loading older messages, and how many arrived once they do. */
export function noteOlder(runtime, settings, older) {
    const { isLoadingOlder, announcer, strings } = settings;
    if (isLoadingOlder && !runtime.wasLoadingOlder)
        announcer.notice(strings.loadingOlderMessages);
    if (!isLoadingOlder && runtime.wasLoadingOlder)
        runtime.olderRequested = false;
    runtime.wasLoadingOlder = isLoadingOlder;
    if (older.length === 0)
        return;
    runtime.olderRequested = false;
    const count = older.filter((key) => isTranscriptMessage(runtime, key)).length;
    if (count > 0)
        announcer.notice(strings.olderMessagesLoaded(count));
}
/** The element to bring to the top for a message: a separator right before it comes along. */
function resolveRevealTarget(runtime, element) {
    const previous = element.previousElementSibling;
    const isPart = previous instanceof HTMLElement &&
        runtime.registry.keyOf(previous) === undefined &&
        !runtime.windowModel.isSpacer(previous);
    return isPart ? previous : element;
}
/**
 * Brings a message into view and focuses it. A message the virtualized window left unmounted
 * mounts first, then comes into view after that commit.
 */
export function focusMessage(runtime, settings, target) {
    const element = runtime.registry.element(target.key);
    if (!element) {
        runtime.pendingFocus = target;
        settings.requestRender();
        return;
    }
    runtime.pendingFocus = null;
    const revealed = target.align === 'start' ? resolveRevealTarget(runtime, element) : element;
    runtime.keeper.reveal(revealed, target.align);
    if (target.focus !== false)
        element.focus({ preventScroll: true });
    syncWithScroll(runtime, settings);
}
/** Whether focus may move to a message: not while the reader types in a field outside. */
function isFocusFree(runtime) {
    const active = document.activeElement;
    if (runtime.viewport.current?.contains(active))
        return true;
    return !isEditableTarget(active);
}
/**
 * Scrolls to a newly highlighted message once it is among the children, and focuses it unless the
 * reader is typing in a field outside the transcript, such as a find box.
 */
export function applyHighlight(runtime, settings) {
    const key = resolveMessageKey(runtime, settings.highlightedMessageId) ?? null;
    if (key === runtime.handledHighlight)
        return;
    if (key === null) {
        runtime.handledHighlight = null;
        return;
    }
    if (!runtime.indexOf.has(key))
        return;
    runtime.handledHighlight = key;
    focusMessage(runtime, settings, { key, align: 'center', focus: isFocusFree(runtime) });
}
//# sourceMappingURL=transcript-commit.js.map