'use client';

// Renaming a tab in place: a text field laid over the tab; Enter or leaving the field renames the
// tab when the name is valid, and Escape keeps the old name.

import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Input } from '../../primitives/index.js';
import { isFocused } from '../../utils/focus-target.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import {
  findTabElement,
  isTabAvailable,
  type TabListModel,
  type TabsShared,
  TabsSharedContext,
} from './tab-actions.js';
import { tabsHooks as hooks } from './tab-hooks.js';

/** Checks a new tab name: a message says why it is refused; nothing accepts it. */
export type TabNameValidate = (key: Key, name: string) => string | null | undefined;

/** A list's in-place renaming, shared with its tabs. */
export interface TabRename {
  /** The tab being renamed, or `null`. */
  editingKey: Key | null;
  /** Starts renaming an enabled tab. */
  start: (key: Key) => void;
  /** Whether the tab `key` is in the list and enabled now, so it can be renamed. */
  canRename: (key: Key) => boolean;
  /** Closes the field of the tab `key`. */
  end: (key: Key) => void;
  onRename: (key: Key, name: string) => void;
  validate: TabNameValidate | undefined;
}

interface TabRenameOptions {
  shared: TabsShared;
  onRename: ((key: Key, name: string) => void) | undefined;
  validateName: TabNameValidate | undefined;
}

interface TabRenameFieldProps {
  tabKey: Key;
  /** The tab's current name. */
  name: string;
  rename: TabRename;
  listRef: RefObject<HTMLElement | null>;
}

interface TabRenameOverlayProps {
  rename: TabRename | null;
  state: TabListModel;
  listRef: RefObject<HTMLElement | null>;
}

/** A list's renaming while the owner takes renames. */
export function createTabRename({ shared, onRename, validateName }: TabRenameOptions) {
  if (!onRename) return null;
  const rename: TabRename = {
    editingKey: shared.editingKey,
    canRename: (key) => isTabAvailable(shared, key),
    start(key) {
      const manager = shared.stateRef.current?.selectionManager;
      if (!rename.canRename(key)) return;
      // Focus returns to the renamed tab, so the list must treat it as its focused tab.
      manager?.setFocusedKey(key);
      shared.setEditingKey(() => key);
    },
    end: (key) => shared.setEditingKey((current) => (current === key ? null : current)),
    onRename,
    validate: validateName,
  };
  return rename;
}

/**
 * Where the tab `tabKey` sits within the offset parent of the element `ref`, kept current as the
 * list scrolls.
 */
function useTabBox(
  listRef: RefObject<HTMLElement | null>,
  { tabKey, ref }: { tabKey: Key; ref: RefObject<HTMLElement | null> },
) {
  const [box, setBox] = useState<CSSProperties | null>(null);
  // The list element changes when a presentation change wraps it in a bar, so measuring follows the
  // current list on every render.
  useLayoutEffect(() => {
    const list = listRef.current;
    const measure = () => {
      const tab = findTabElement(list, tabKey);
      const parent = ref.current?.offsetParent;
      if (!tab || !isHTMLElement(parent)) return;
      const tabBox = tab.getBoundingClientRect();
      const parentBox = parent.getBoundingClientRect();
      const next = {
        left: tabBox.left - parentBox.left - parent.clientLeft + parent.scrollLeft,
        top: tabBox.top - parentBox.top - parent.clientTop + parent.scrollTop,
        width: tabBox.width,
        height: tabBox.height,
      };
      setBox((current) => (current && isShallowEqual(current, next) ? current : next));
    };
    measure();
    list?.addEventListener('scroll', measure);
    return () => list?.removeEventListener('scroll', measure);
  });
  return box;
}

/**
 * A field closed by the list, for a tab that left or turned disabled, gives up focus it held to the
 * list's tab as it is torn down; a field the reader closed has already placed focus.
 */
function useFocusReleaseOnClose({
  inputRef,
  isDone,
  listRef,
  tabKey,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  isDone: RefObject<boolean>;
  listRef: RefObject<HTMLElement | null>;
  tabKey: Key;
}) {
  useLayoutEffect(() => {
    const input = inputRef.current;
    const list = listRef.current;
    // The tree the field lives in, read before the field leaves it.
    const root = input?.getRootNode();
    return () => {
      if (isDone.current) return;
      isDone.current = true;
      if (isFocused(input, root)) focusListTab(list, tabKey);
    };
  }, [inputRef, isDone, listRef, tabKey]);
}

/**
 * The name field of a tab being renamed, laid over the tab outside the list, since a tab holds no
 * control of its own. It holds the tab's name selected. Typing checks the trimmed name with the
 * owner's `validate` and shows its message. Enter renames the tab with a valid, changed, non-blank
 * name and returns focus to it (a refused name keeps the field open); Escape abandons the edit and
 * returns focus too. Leaving the field renames a valid name and abandons a refused one.
 */
function TabRenameField({ tabKey, name, rename, listRef }: TabRenameFieldProps) {
  const strings = useUiStrings();
  const errorId = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDone = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const box = useTabBox(listRef, { tabKey, ref });
  // Focus returning to the renamed tab, as a closing menu returns it, goes on to the field once
  // the list has handled the focus.
  useEffect(() => {
    const tab = findTabElement(listRef.current, tabKey);
    const view = getOwnerWindow(tab);
    let frame = 0;
    const refocus = () => {
      view.cancelAnimationFrame(frame);
      frame = view.requestAnimationFrame(() => {
        if (!isDone.current && isFocused(tab)) {
          inputRef.current?.focus();
        }
      });
    };
    tab?.addEventListener('focus', refocus);
    return () => {
      view.cancelAnimationFrame(frame);
      tab?.removeEventListener('focus', refocus);
    };
  }, [listRef, tabKey]);
  const check = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === name) return null;
    return rename.validate?.(tabKey, trimmed) || null;
  };
  useFocusReleaseOnClose({ inputRef, isDone, listRef, tabKey });
  const finish = (isCommit: boolean, returnFocus: boolean) => {
    const value = inputRef.current?.value.trim() ?? '';
    isDone.current = true;
    rename.end(tabKey);
    // The tab may have left or turned disabled since the edit started.
    const isRenamed = isCommit && rename.canRename(tabKey) && value !== '' && value !== name;
    if (isRenamed && !check(value)) rename.onRename(tabKey, value);
    if (returnFocus) findTabElement(listRef.current, tabKey)?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if ((event.key !== 'Enter' && event.key !== 'Escape') || isComposingKey(event.nativeEvent)) {
      return;
    }
    event.preventDefault();
    const refused = event.key === 'Enter' ? check(event.currentTarget.value) : null;
    if (refused) setError(refused);
    else finish(event.key === 'Enter', true);
  };
  const onBlur = (event: FocusEvent<HTMLInputElement>) => {
    const tab = findTabElement(listRef.current, tabKey);
    if (!isDone.current && (!tab || event.relatedTarget !== tab)) finish(true, false);
  };
  return (
    <span ref={ref} {...hooks.slot('rename')} style={{ position: 'absolute', ...box }}>
      <Input
        ref={inputRef}
        className={hooks.slotClass('rename-input')}
        aria-label={strings.renameItem(name)}
        aria-invalid={error === null ? undefined : true}
        aria-describedby={error === null ? undefined : errorId}
        defaultValue={name}
        autoFocus
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => setError(check(event.currentTarget.value))}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
      {error === null ? null : (
        <span {...hooks.slot('rename-error')} id={errorId}>
          {error}
        </span>
      )}
    </span>
  );
}

/** Focuses the tab `key` when it can take focus, else the list's selected or first enabled tab. */
function focusListTab(list: HTMLElement | null, key: Key) {
  const tabs = list ? [...list.querySelectorAll<HTMLElement>('[role="tab"]')] : [];
  const usable = tabs.filter((tab) => tab.getAttribute('aria-disabled') !== 'true');
  const own = findTabElement(list, key);
  const target =
    usable.find((tab) => tab === own) ??
    usable.find((tab) => tab.getAttribute('aria-selected') === 'true') ??
    usable[0];
  target?.focus({ preventScroll: true });
}

/**
 * The name field of the list's tab being renamed, if any. An edit whose tab left the list or turned
 * disabled, or whose list stopped taking renames, ends without renaming, so the tab coming back
 * does not reopen it.
 */
export function TabRenameOverlay({ rename, state, listRef }: TabRenameOverlayProps) {
  const shared = useContext(TabsSharedContext);
  const key = shared.editingKey;
  const isOpen = key !== null && rename !== null && isTabAvailable(shared, key, state);
  const { setEditingKey } = shared;
  useLayoutEffect(() => {
    if (key !== null && !isOpen) setEditingKey((current) => (current === key ? null : current));
  }, [key, isOpen, setEditingKey]);
  const node = key === null ? null : state.collection.getItem(key);
  if (!isOpen || !rename || !node) return null;
  return (
    <TabRenameField
      key={toKeyIdentity(key)}
      tabKey={key}
      name={node.textValue}
      rename={rename}
      listRef={listRef}
    />
  );
}
