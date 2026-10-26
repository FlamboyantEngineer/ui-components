// The menubar's shared state: which menu is open, which top-level item is the tab stop, and the
// keys and pointer moves that pass from one menu to another.
import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, } from 'react';
import { resolveMenubarKey } from './menubar-keys.js';
export const MenubarContext = createContext(null);
/** The enclosing menubar's state; a `MenubarMenu` works only inside a `Menubar`. */
export function useMenubarContext() {
    const context = useContext(MenubarContext);
    if (!context)
        throw new Error('A MenubarMenu must be rendered inside a Menubar.');
    return context;
}
function sortByDocumentOrder(triggers) {
    return [...triggers].sort(([, a], [, b]) => a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
}
/** Where a key press starts; a press inside a menu comes from its popover, portaled out of the bar. */
function findPlace(target, isTrigger) {
    if (isTrigger)
        return 'bar';
    const popover = target.closest('[data-trigger]');
    if (!popover)
        return null;
    return popover.getAttribute('data-trigger') === 'SubmenuTrigger' ? 'submenu' : 'menu';
}
function resolveIndex(to, from, count) {
    if (to === 'first')
        return 0;
    if (to === 'last')
        return count - 1;
    return (from + (to === 'next' ? 1 : -1) + count) % count;
}
function hasModifier(event) {
    return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}
/** Focuses a top-level item and, when asked, opens its menu through React Aria's state. */
function focusTrigger(trigger, focus) {
    trigger?.element.focus();
    if (focus !== undefined)
        trigger?.state.current?.open(focus);
}
/**
 * The top-level items, keyed by their `MenubarMenu`. `register` is stable, and `version` changes
 * whenever an item comes or goes, since the map itself is not state.
 */
function useTriggerRegistry() {
    const triggers = useRef(new Map());
    const [version, setVersion] = useState(0);
    const register = useCallback((key, trigger) => {
        if (!trigger)
            return undefined;
        triggers.current.set(key, trigger);
        setVersion((current) => current + 1);
        return () => {
            triggers.current.delete(key);
            setVersion((current) => current + 1);
        };
    }, []);
    return { triggers, register, version };
}
/** The first top-level item is the tab stop until another takes focus, and again if that one leaves. */
function useTabStop(triggers, version) {
    const [tabKey, setTabKey] = useState(null);
    useLayoutEffect(() => {
        if (tabKey !== null && triggers.current.has(tabKey))
            return;
        const first = sortByDocumentOrder(triggers.current)[0]?.[0] ?? null;
        if (first !== tabKey)
            setTabKey(first);
    }, [triggers, tabKey, version]);
    return [tabKey, setTabKey];
}
/**
 * Which menu is open, and moves from one top-level item to another. React Aria keeps focus inside
 * an open submenu, so a move away from an open menu closes it first, through React Aria's state so
 * its submenus close too, and focuses the next item once the closing menus have let focus go.
 */
function useOpenMenu(triggers) {
    const [openKey, setOpenKey] = useState(null);
    const pending = useRef(null);
    useLayoutEffect(() => {
        const move = pending.current;
        if (openKey !== null || !move)
            return;
        pending.current = null;
        focusTrigger(triggers.current.get(move.key), move.focus);
    }, [triggers, openKey]);
    const close = (key) => triggers.current.get(key)?.state.current?.close();
    const moveTo = ({ key, focus }) => {
        if (openKey === null || openKey === key)
            return focusTrigger(triggers.current.get(key), focus);
        pending.current = { key, focus: focus ?? null };
        return close(openKey);
    };
    const setOpen = (key, isOpen) => {
        if (!isOpen)
            return setOpenKey((current) => (current === key ? null : current));
        if (openKey !== null && openKey !== key)
            return moveTo({ key, focus: null });
        return setOpenKey(key);
    };
    return { openKey, close, moveTo, setOpen };
}
/**
 * The state behind a `Menubar`: its context value and the capture-phase key handler for its root,
 * which sees key presses on the top-level items and, through React's tree, in their open menus.
 */
export function useMenubarState({ rootRef, orientation, size, direction }) {
    const { triggers, register, version } = useTriggerRegistry();
    const [tabKey, setTabKey] = useTabStop(triggers, version);
    const { openKey, close, moveTo, setOpen } = useOpenMenu(triggers);
    const apply = (action, { list, from, place }) => {
        const [fromKey, fromTrigger] = list[from] ?? [];
        if (!fromKey || !fromTrigger)
            return;
        if (action.type === 'close')
            close(fromKey);
        else if (action.type === 'open')
            focusTrigger(fromTrigger, 'first');
        else {
            const [key] = list[resolveIndex(action.to, from, list.length)] ?? [];
            const isOpening = place !== 'bar' || openKey !== null;
            if (key)
                moveTo({ key, focus: isOpening ? 'first' : undefined });
        }
    };
    const onKeyDownCapture = (event) => {
        if (hasModifier(event))
            return;
        const target = event.target;
        const list = sortByDocumentOrder(triggers.current);
        const barIndex = list.findIndex(([, trigger]) => trigger.element === target);
        const place = findPlace(target, barIndex >= 0);
        if (!place)
            return;
        const hasSubmenu = target.hasAttribute('aria-haspopup');
        const action = resolveMenubarKey({ key: event.key, orientation, direction, place, hasSubmenu });
        const from = barIndex >= 0 ? barIndex : list.findIndex(([key]) => key === openKey);
        if (!action || from < 0)
            return;
        event.preventDefault();
        event.stopPropagation();
        apply(action, { list, from, place });
    };
    const context = {
        orientation,
        size,
        openKey,
        tabKey,
        register,
        setOpen,
        close,
        setTabKey,
        switchTo: (key) => {
            if (openKey !== null && openKey !== key)
                moveTo({ key, focus: null });
        },
        isInside: (element) => Boolean(rootRef.current?.contains(element)) ||
            element.closest('[data-trigger="SubmenuTrigger"]') !== null,
    };
    return { context, onKeyDownCapture };
}
//# sourceMappingURL=menubar-state.js.map