'use client';

// The menubar's shared state: which menu is open, which top-level item is the tab stop, and the
// keys and pointer moves that pass from one menu to another.

import {
  createContext,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { Orientation } from '../../core/props.js';
import { isFocusLost } from '../../utils/focus-target.js';
import { getOwnerDocument, getOwnerWindow } from '../../utils/owner-window.js';
import type { MenuSize } from '../menu/menu.js';
import { type MenubarKeyAction, type MenubarKeyPlace, resolveMenubarKey } from './menubar-keys.js';

/** Where focus goes in a menu the bar opens: its first or last item, or (`null`) the menu itself. */
type MenuFocus = 'first' | 'last' | null;

/** The part of a top-level item's menu state the bar drives; closing also closes its submenus. */
interface MenubarMenuState {
  open: (focus: MenuFocus) => void;
  close: () => void;
}

interface MenubarContextValue {
  orientation: Orientation;
  size: MenuSize;
  /** The open menu's key. */
  openKey: string | null;
  /** The top-level item in the tab sequence. */
  tabKey: string | null;
  /** Records a top-level item and its menu state, returning the cleanup; the function is stable. */
  register: (key: string, trigger: TriggerEntry | null) => (() => void) | undefined;
  /** React Aria's trigger opened or closed a menu. */
  setOpen: (key: string, isOpen: boolean) => void;
  /** Closes a menu with its submenus. */
  close: (key: string) => void;
  /** A top-level item took focus, so it becomes the tab stop. */
  setTabKey: (key: string) => void;
  /** The pointer entered a top-level item: while another menu is open, its menu opens instead. */
  switchTo: (key: string) => void;
  /** Whether an element is part of the bar or of an open submenu, so a press on it is not outside. */
  isInside: (element: Element) => boolean;
}

/** A top-level item's element and the latest state of its menu. */
interface TriggerEntry {
  element: HTMLElement;
  state: RefObject<MenubarMenuState | null>;
}

interface MenubarStateOptions {
  rootRef: RefObject<HTMLElement | null>;
  orientation: Orientation;
  size: MenuSize;
  direction: 'ltr' | 'rtl';
}

type TriggerList = Array<[string, TriggerEntry]>;

/** The top-level items, the index of the one a key press acts from, and where the press started. */
interface KeyTarget {
  list: TriggerList;
  from: number;
  place: MenubarKeyPlace;
}

/** A move to another top-level item; `focus` opens its menu, `undefined` only focuses the item. */
interface Move {
  key: string;
  focus: MenuFocus | undefined;
}

export const MenubarContext = createContext<MenubarContextValue | null>(null);

/** The enclosing menubar's state; a `MenubarMenu` works only inside a `Menubar`. */
export function useMenubarContext(): MenubarContextValue {
  const context = useContext(MenubarContext);
  if (!context) throw new Error('A MenubarMenu must be rendered inside a Menubar.');
  return context;
}

function sortByDocumentOrder(triggers: Map<string, TriggerEntry>): TriggerList {
  return [...triggers].sort(([, a], [, b]) =>
    a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
}

/** Where a key press starts; a press inside a menu comes from its popover, portaled out of the bar. */
function findPlace(target: Element, isTrigger: boolean): MenubarKeyPlace | null {
  if (isTrigger) return 'bar';
  const popover = target.closest('[data-trigger]');
  if (!popover) return null;
  return popover.getAttribute('data-trigger') === 'SubmenuTrigger' ? 'submenu' : 'menu';
}

function resolveIndex(to: 'previous' | 'next' | 'first' | 'last', from: number, count: number) {
  if (to === 'first') return 0;
  if (to === 'last') return count - 1;
  return (from + (to === 'next' ? 1 : -1) + count) % count;
}

function hasModifier(event: KeyboardEvent<HTMLElement>): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

type FocusTrigger = (trigger: TriggerEntry | undefined, focus: MenuFocus | undefined) => void;

/** The scroll offsets of the scrolling boxes around `element`, outermost last. */
function readScrollOffsets(element: Element): number[] {
  const offsets: number[] = [];
  for (let node = element.parentElement; node; node = node.parentElement) {
    offsets.push(node.scrollTop, node.scrollLeft);
  }
  return offsets;
}

/**
 * Focuses a top-level item and, when asked, opens its menu through React Aria's state. When
 * focusing scrolled a box around the item into view, the menu opens on the next frame: React Aria
 * closes a non-modal popover when an ancestor of its trigger scrolls, and the scroll event of the
 * reveal arrives after the focus. A newer focus or unmounting cancels a menu still waiting.
 */
function useFocusTrigger(): FocusTrigger {
  const frame = useRef<{ id: number; view: Window } | null>(null);
  const cancel = useCallback(() => {
    if (frame.current) frame.current.view.cancelAnimationFrame(frame.current.id);
    frame.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);
  return useCallback(
    (trigger, focus) => {
      cancel();
      if (!trigger) return;
      const before = readScrollOffsets(trigger.element);
      trigger.element.focus();
      if (focus === undefined) return;
      const open = () => trigger.state.current?.open(focus);
      const view = getOwnerWindow(trigger.element);
      if (readScrollOffsets(trigger.element).every((offset, index) => offset === before[index])) {
        return open();
      }
      frame.current = { view, id: view.requestAnimationFrame(open) };
    },
    [cancel],
  );
}

/**
 * The top-level items, keyed by their `MenubarMenu`. `register` is stable, and `version` changes
 * whenever an item comes or goes, since the map itself is not state.
 */
function useTriggerRegistry() {
  const triggers = useRef(new Map<string, TriggerEntry>());
  const [version, setVersion] = useState(0);
  const register = useCallback((key: string, trigger: TriggerEntry | null) => {
    if (!trigger) return undefined;
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
function useTabStop(triggers: RefObject<Map<string, TriggerEntry>>, version: number) {
  const [tabKey, setTabKey] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (tabKey !== null && triggers.current.has(tabKey)) return;
    const first = sortByDocumentOrder(triggers.current)[0]?.[0] ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The registry is filled by ref callbacks, so the first item is known only after commit.
    if (first !== tabKey) setTabKey(first);
  }, [triggers, tabKey, version]);
  return [tabKey, setTabKey] as const;
}

/**
 * Which menu is open, and moves from one top-level item to another. React Aria keeps focus inside
 * an open submenu, so a move away from an open menu closes it first, through React Aria's state so
 * its submenus close too, and focuses the next item once the closing menus have let focus go.
 */
function useOpenMenu(
  triggers: RefObject<Map<string, TriggerEntry>>,
  version: number,
  rootRef: RefObject<HTMLElement | null>,
) {
  const focusTrigger = useFocusTrigger();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const pending = useRef<Move | null>(null);
  // A top-level item that leaves takes its menu with it: forget it as open or as a destination, and
  // give focus the menu held to the bar's tab stop, so the next move or press has a place to start.
  useLayoutEffect(() => {
    const items = triggers.current;
    if (pending.current && !items.has(pending.current.key)) pending.current = null;
    if (openKey === null || items.has(openKey)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The registry is filled by ref callbacks, so a removed item is known only after commit.
    setOpenKey(null);
    if (!pending.current && isFocusLost(getOwnerDocument(rootRef.current))) {
      focusTrigger(sortByDocumentOrder(items)[0]?.[1], undefined);
    }
  }, [triggers, openKey, version, rootRef, focusTrigger]);
  useLayoutEffect(() => {
    const move = pending.current;
    if (openKey !== null || !move) return;
    pending.current = null;
    focusTrigger(triggers.current.get(move.key), move.focus);
  }, [triggers, openKey, focusTrigger]);
  const close = (key: string) => triggers.current.get(key)?.state.current?.close();
  const moveTo = ({ key, focus }: Move) => {
    if (openKey === null || openKey === key) return focusTrigger(triggers.current.get(key), focus);
    pending.current = { key, focus: focus ?? null };
    return close(openKey);
  };
  const setOpen = (key: string, isOpen: boolean) => {
    if (!isOpen) return setOpenKey((current) => (current === key ? null : current));
    if (openKey !== null && openKey !== key) return moveTo({ key, focus: null });
    return setOpenKey(key);
  };
  return { openKey, close, moveTo, setOpen, focusTrigger };
}

/**
 * The state behind a `Menubar`: its context value and the capture-phase key handler for its root,
 * which sees key presses on the top-level items and, through React's tree, in their open menus.
 */
export function useMenubarState({ rootRef, orientation, size, direction }: MenubarStateOptions) {
  const { triggers, register, version } = useTriggerRegistry();
  const [tabKey, setTabKey] = useTabStop(triggers, version);
  const { openKey, close, moveTo, setOpen, focusTrigger } = useOpenMenu(triggers, version, rootRef);

  const apply = (action: MenubarKeyAction, { list, from, place }: KeyTarget) => {
    const [fromKey, fromTrigger] = list[from] ?? [];
    if (!fromKey || !fromTrigger) return;
    if (action.type === 'close') close(fromKey);
    else if (action.type === 'open') focusTrigger(fromTrigger, 'first');
    else {
      const [key] = list[resolveIndex(action.to, from, list.length)] ?? [];
      const isOpening = place !== 'bar' || openKey !== null;
      if (key) moveTo({ key, focus: isOpening ? 'first' : undefined });
    }
  };

  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    if (hasModifier(event)) return;
    const target = event.target as HTMLElement;
    const list = sortByDocumentOrder(triggers.current);
    const barIndex = list.findIndex(([, trigger]) => trigger.element === target);
    const place = findPlace(target, barIndex >= 0);
    if (!place) return;
    const hasSubmenu = target.hasAttribute('aria-haspopup');
    const action = resolveMenubarKey({ key: event.key, orientation, direction, place, hasSubmenu });
    const from = barIndex >= 0 ? barIndex : list.findIndex(([key]) => key === openKey);
    if (!action || from < 0) return;
    event.preventDefault();
    event.stopPropagation();
    apply(action, { list, from, place });
  };

  const context: MenubarContextValue = {
    orientation,
    size,
    openKey,
    tabKey,
    register,
    setOpen,
    close,
    setTabKey,
    switchTo: (key) => {
      if (openKey !== null && openKey !== key) moveTo({ key, focus: null });
    },
    isInside: (element) =>
      Boolean(rootRef.current?.contains(element)) ||
      element.closest('[data-trigger="SubmenuTrigger"]') !== null,
  };
  return { context, onKeyDownCapture };
}
