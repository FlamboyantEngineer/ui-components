import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useContext, useMemo, useRef, useSyncExternalStore } from 'react';
import { Text, UNSTABLE_Toast as AriaToast, UNSTABLE_ToastContent as AriaToastContent, UNSTABLE_ToastList as AriaToastList, UNSTABLE_ToastQueue as AriaToastQueue, UNSTABLE_ToastRegion as AriaToastRegion, UNSTABLE_ToastStateContext as ToastStateContext, } from '../../primitives/index.js';
import { createHooks, measuredProperty, pickDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { mergeProps } from '../../utils/merge-props.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { getToneGlyph } from '../banner/banner.js';
import { Button } from '../button/button.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { createQueueOverStore, getToastLifecycle, } from './toast-queue.js';
import { ToastStackProvider, useIsStackPaused, useStackExpanded, useToastStack, useToastStackPosition, } from './toast-stack.js';
import { useToastPresence, useToastSnapshot, useToastTimer } from './use-toast-lifecycle.js';
import { useToastSwipe } from './use-toast-swipe.js';
const toastHooks = createHooks('toast', [
    'icon',
    'spinner',
    'content',
    'title',
    'description',
    'action',
    'close',
]);
const regionHooks = createHooks('toast-region');
const listHooks = createHooks('toast-list');
function isAssertive(tone) {
    return tone === 'warning' || tone === 'danger';
}
/** The building block's queue behind each library queue. */
const ariaQueues = new WeakMap();
function getAriaQueue(queue) {
    const ariaQueue = ariaQueues.get(queue);
    if (!ariaQueue)
        throw new Error('A toast queue must come from createToastQueue.');
    return ariaQueue;
}
/** The building block queue's visible toasts, following its changes. */
function useVisibleToasts(ariaQueue) {
    const subscribe = useCallback((onChange) => ariaQueue.subscribe(onChange), [ariaQueue]);
    const getSnapshot = () => ariaQueue.visibleToasts;
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
function renderToast({ toast }) {
    return _jsx(Toast, { toast: toast });
}
/** The toast's live region: its title and, when set, its description. */
function ToastText({ tone, title, description, }) {
    return (_jsxs(AriaToastContent, { ...toastHooks.slot('content'), role: isAssertive(tone) ? 'alert' : 'status', children: [_jsx(Text, { slot: "title", className: toastHooks.slotClass('title'), children: title }), isEmptyNode(description) ? null : (_jsx(Text, { slot: "description", className: toastHooks.slotClass('description'), children: description }))] }));
}
/** The action button: runs the action, then closes the toast through its region's state. */
function ToastActionButton({ action, toastKey }) {
    const state = useContext(ToastStateContext);
    return (_jsx(Button, { variant: "tertiary", size: "sm", className: toastHooks.slotClass('action'), onPress: () => {
            action.onAction();
            state?.close(toastKey);
        }, children: action.label }));
}
/**
 * One toast: tone glyph (or a busy indicator while pending), title, optional description, optional
 * action and a dismiss button. It renders inside a `ToastRegion` or `ToastList`, which supply its
 * queue; it follows in-place updates, plays its enter and exit, and can be swiped away.
 */
function Toast({ toast }) {
    const strings = useUiStrings();
    const state = useContext(ToastStateContext);
    const lifecycle = getToastLifecycle(toast.content);
    const snapshot = useToastSnapshot(lifecycle);
    const ref = useRef(null);
    const { isMounted, isEntering, isExiting } = useEnterExit(ref, snapshot.isOpen);
    const isPaused = useIsStackPaused();
    useToastTimer(toast.timer, snapshot, isPaused);
    useToastPresence(lifecycle, isMounted);
    const { index, offset, swipeDirection, swipeThreshold } = useToastStackPosition(toast.key, ref);
    const swipe = useToastSwipe({
        direction: swipeDirection,
        threshold: swipeThreshold,
        onDismiss: () => state?.close(toast.key),
    });
    if (!isMounted)
        return null;
    const { tone = 'info', title, description, icon, action, isPending = false } = snapshot.content;
    const data = {
        tone,
        pending: isPending,
        entering: isEntering,
        exiting: isExiting,
        swiping: swipe.isSwiping,
        swipeDirection,
    };
    const style = {
        ...measuredProperty('toast-index', String(index)),
        ...measuredProperty('toast-offset', offset),
        ...swipe.style,
    };
    return (_jsxs(AriaToast, { ...swipe.swipeProps, ref: ref, 
        // The queue's entry drives the timer (useToastTimer), so React Aria does not reset it.
        toast: { ...toast, timeout: undefined }, style: style, ...toastHooks.root({ data }), children: [isPending ? (_jsx("span", { ...toastHooks.slot('spinner'), "aria-hidden": "true" })) : (_jsx(Icon, { ...toIconProps(icon ?? getToneGlyph(tone)), className: toastHooks.slotClass('icon') })), _jsx(ToastText, { tone: tone, title: title, description: description }), action ? _jsx(ToastActionButton, { action: action, toastKey: toast.key }) : null, _jsx(Button, { slot: "close", icon: "close", label: strings.dismiss, size: "sm", className: toastHooks.slotClass('close') })] }));
}
/**
 * The live region for a queue: a landmark (reachable with F6) portalled into the document body
 * while it has toasts, pausing every timer and publishing `data-expanded` while it is hovered or
 * holds focus.
 */
export function ToastRegion({ queue, swipeDirection, swipeThreshold, className, ...rest }) {
    const ariaQueue = getAriaQueue(queue);
    const hasToasts = useVisibleToasts(ariaQueue).length > 0;
    const { isExpanded, regionProps } = useStackExpanded(hasToasts);
    const stack = useToastStack({ swipeDirection, swipeThreshold }, isExpanded);
    return (_jsx(ToastStackProvider, { value: stack, children: _jsx(AriaToastRegion, { ...rest, queue: ariaQueue, ...regionHooks.root({ className, data: { expanded: isExpanded } }), 
            // React Aria's region forwards no focus handlers, so they join its props here.
            render: (props) => _jsx("div", { ...mergeProps(props, regionProps) }), children: _jsx(AriaToastList, { className: listHooks.className, children: renderToast }) }) }));
}
/**
 * Draws a queue's toasts where it is rendered, without the region's portal, landmark and pausing:
 * for previews and pages that place a static stack themselves.
 */
export function ToastList({ queue, swipeDirection, swipeThreshold, className, ...rest }) {
    const ariaQueue = getAriaQueue(queue);
    const stack = useToastStack({ swipeDirection, swipeThreshold });
    const visibleToasts = useVisibleToasts(ariaQueue);
    const state = useMemo(() => ({
        visibleToasts,
        add: (content, options) => ariaQueue.add(content, options),
        close: (key) => ariaQueue.close(key),
        pauseAll: () => ariaQueue.pauseAll(),
        resumeAll: () => ariaQueue.resumeAll(),
    }), [ariaQueue, visibleToasts]);
    // React Aria's list forwards no DOM props, so the caller's id and data attributes go through render.
    const attributes = { ...pickDataAttributes(rest), id: rest.id };
    return (_jsx(ToastStackProvider, { value: stack, children: _jsx(ToastStateContext.Provider, { value: state, children: _jsx(AriaToastList, { className: listHooks.root({ className }).className, render: (props) => _jsx("ol", { ...props, ...attributes }), children: renderToast }) }) }));
}
/**
 * Creates a toast queue: the host renders it in a `ToastRegion` (or a `ToastList`) and adds toasts
 * to it from anywhere.
 */
export function createToastQueue(options = {}) {
    const ariaQueue = new AriaToastQueue({
        maxVisibleToasts: options.maxVisibleToasts,
    });
    const queue = createQueueOverStore(ariaQueue, options);
    ariaQueues.set(queue, ariaQueue);
    return queue;
}
//# sourceMappingURL=toast.js.map