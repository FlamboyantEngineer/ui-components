import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Modal } from '../modal/modal.js';
import { createUnsavedChangesStore, } from './unsaved-changes-store.js';
const hooks = createHooks('unsaved-changes-guard', ['list']);
const GuardContext = createContext(null);
function useGuardContext(hook) {
    const context = useContext(GuardContext);
    if (!context)
        throw new Error(`${hook} needs an UnsavedChangesGuard above it.`);
    return context;
}
/** Keeps `entry` registered in `store` under this component's key until it unmounts. */
function useRegistration(store, entry) {
    const key = useId();
    // A layout effect, so a navigation in the same task as the edit already sees it.
    useLayoutEffect(() => {
        store?.set(key, entry);
    });
    useLayoutEffect(() => () => store?.delete(key), [store, key]);
}
function preventUnload(event) {
    event.preventDefault();
    // Browsers that predate `preventDefault` here ask when `returnValue` is set.
    event.returnValue = '';
}
/** Asks the browser to confirm leaving the page while `isActive`. */
function useUnloadConfirmation(isActive) {
    useEffect(() => {
        if (!isActive)
            return undefined;
        window.addEventListener('beforeunload', preventUnload);
        return () => window.removeEventListener('beforeunload', preventUnload);
    }, [isActive]);
}
/** The open confirmation and `confirmLeave`, which replaces any confirmation still open. */
function useLeaveRequests(store) {
    const pending = useRef(null);
    const [shown, setShown] = useState(null);
    const [isOpen, setOpen] = useState(false);
    const confirmLeave = useCallback((options = {}) => {
        const summary = store.getSummary();
        if (!summary.isDirty)
            return Promise.resolve(true);
        return new Promise((resolve) => {
            pending.current?.settle(false);
            const request = {
                ...options,
                summary,
                settle: (allowed) => {
                    if (pending.current === request)
                        pending.current = null;
                    resolve(allowed);
                },
            };
            pending.current = request;
            setShown(request);
            setOpen(true);
        });
    }, [store]);
    useEffect(() => () => pending.current?.settle(false), []);
    return { shown, isOpen, setOpen, confirmLeave };
}
function resolveLeaveActions({ canSave, strings, leaveAfter, store, }) {
    return {
        primaryAction: {
            label: canSave ? strings.save : strings.discard,
            pendingLabel: canSave ? strings.saving : undefined,
            onPress: leaveAfter(canSave ? store.save : store.discard),
        },
        secondaryAction: canSave
            ? { label: strings.discard, onPress: leaveAfter(store.discard) }
            : undefined,
    };
}
/** Save, Discard and Stay when every dirty source can save; otherwise Discard and Stay. */
function LeaveConfirmation({ store, request, summary, title, message, className, ...rest }) {
    const strings = useUiStrings();
    const { canSave, labels } = request?.summary ?? summary;
    const leaveAfter = (run) => async (close) => {
        await run();
        request?.settle(true);
        close();
    };
    return (_jsx(Modal, { ...rest, role: "alertdialog", tone: canSave ? 'neutral' : 'danger', onOpenChange: (next) => {
            if (!next)
                request?.settle(false);
            rest.onOpenChange(next);
        }, ...resolveLeaveActions({ canSave, strings, leaveAfter, store }), className: hooks.root({ className }).className, title: request?.title ?? title ?? strings.unsavedChanges, description: request?.message ??
            message ??
            (canSave ? strings.saveBeforeLeaving : strings.discardBeforeLeaving), cancelAction: { label: strings.stay, autoFocus: true }, children: labels.length > 0 ? (_jsx("ul", { ...hooks.slot('list'), children: labels.map((label, index) => (_jsx("li", { children: label }, `${index}:${label}`))) })) : null }));
}
/**
 * Protects unsaved edits. Editors under it register with `useUnsavedChanges`; code that leaves
 * (a route change, a tab switch, closing a panel) awaits `confirmLeave()` from
 * `useUnsavedChangesGuard`, which asks the reader to save, discard or stay while anything is dirty.
 * The browser confirms closing the page meanwhile. A guard inside another stands in its parent for
 * the sources under it, so a panel can ask about its own edits alone.
 */
export function UnsavedChangesGuard({ children, shouldConfirmUnload = true, ...rest }) {
    const parent = useContext(GuardContext);
    const [store] = useState(createUnsavedChangesStore);
    const summary = useSyncExternalStore(store.subscribe, store.getSummary, store.getSummary);
    const { shown, isOpen, setOpen, confirmLeave } = useLeaveRequests(store);
    const context = useMemo(() => ({ store, confirmLeave }), [store, confirmLeave]);
    useRegistration(parent?.store ?? null, {
        isDirty: summary.isDirty,
        labels: summary.labels,
        onSave: summary.canSave ? store.save : undefined,
        onDiscard: store.discard,
    });
    useUnloadConfirmation(shouldConfirmUnload && summary.isDirty);
    return (_jsxs(GuardContext, { value: context, children: [children, _jsx(LeaveConfirmation, { ...rest, store: store, request: shown, summary: summary, isOpen: isOpen, onOpenChange: setOpen })] }));
}
/**
 * Registers an editor's changes with the nearest `UnsavedChangesGuard` while it is mounted: whether
 * they are dirty, what to call them, and how to save or discard them.
 */
export function useUnsavedChanges({ isDirty, label, onSave, onDiscard }) {
    const { store } = useGuardContext('useUnsavedChanges');
    useRegistration(store, { isDirty, labels: label ? [label] : [], onSave, onDiscard });
}
/** The nearest `UnsavedChangesGuard`'s dirty state and its `confirmLeave`. */
export function useUnsavedChangesGuard() {
    const { store, confirmLeave } = useGuardContext('useUnsavedChangesGuard');
    const { isDirty } = useSyncExternalStore(store.subscribe, store.getSummary, store.getSummary);
    return { isDirty, confirmLeave };
}
//# sourceMappingURL=unsaved-changes-guard.js.map