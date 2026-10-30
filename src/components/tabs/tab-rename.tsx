'use client';

// Renaming a tab in place: a text field laid over the tab; Enter or leaving the field renames the
// tab when the name is valid, and Escape keeps the old name.

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { Input } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import {
  findTabElement,
  isTabDisabled,
  type TabsShared,
  type TabListModel,
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
    start(key) {
      const manager = shared.stateRef.current?.selectionManager;
      if (isTabDisabled(shared, key) || manager?.isDisabled(key)) return;
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
  useLayoutEffect(() => {
    const list = listRef.current;
    const measure = () => {
      const tab = findTabElement(list, tabKey);
      const parent = ref.current?.offsetParent;
      if (!tab || !(parent instanceof HTMLElement)) return;
      const tabBox = tab.getBoundingClientRect();
      const parentBox = parent.getBoundingClientRect();
      setBox({
        left: tabBox.left - parentBox.left - parent.clientLeft + parent.scrollLeft,
        top: tabBox.top - parentBox.top - parent.clientTop + parent.scrollTop,
        width: tabBox.width,
        height: tabBox.height,
      });
    };
    measure();
    list?.addEventListener('scroll', measure);
    return () => list?.removeEventListener('scroll', measure);
  }, [listRef, tabKey, ref]);
  return box;
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
    let frame = 0;
    const refocus = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!isDone.current && document.activeElement === tab) inputRef.current?.focus();
      });
    };
    tab?.addEventListener('focus', refocus);
    return () => {
      cancelAnimationFrame(frame);
      tab?.removeEventListener('focus', refocus);
    };
  }, [listRef, tabKey]);
  const check = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === name) return null;
    return rename.validate?.(tabKey, trimmed) || null;
  };
  const finish = (isCommit: boolean, returnFocus: boolean) => {
    const value = inputRef.current?.value.trim() ?? '';
    isDone.current = true;
    rename.end(tabKey);
    if (isCommit && value !== '' && value !== name && !check(value)) rename.onRename(tabKey, value);
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

/** The name field of the list's tab being renamed, if any. */
export function TabRenameOverlay({ rename, state, listRef }: TabRenameOverlayProps) {
  const key = rename?.editingKey ?? null;
  const node = key === null ? null : state.collection.getItem(key);
  if (!rename || key === null || !node) return null;
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
