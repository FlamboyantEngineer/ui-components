'use client';

import {
  useEditorEffect,
  useEditorEventCallback,
  useEditorEventListener,
  useEditorState,
} from '@handlewithcare/react-prosemirror';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { type RefObject, useState } from 'react';
import { measureScale, toLocalPoint } from '../../utils/element-scale.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { autoUpdateOverlay } from '../../utils/overlay-auto-update.js';
import { type InsertMenuItem, matchInsertItems } from './insert-items.js';
import { useRichTextEditorContext } from './rich-text-context.js';
import {
  canRunSlash,
  createSlashTransaction,
  previewSlash,
  type SlashRange,
} from './slash-commands.js';

/** The caret marker's place in the surface, in pixels. */
interface CaretPlace {
  left: number;
  top: number;
  height: number;
}

/** A slash at the start of a text block or after white space, then the query up to the caret. */
function findSlashRange(state: EditorState): SlashRange | null {
  const { selection } = state;
  const { $from } = selection;
  if (!selection.empty || !$from.parent.isTextblock || $from.parent.type.spec.code) return null;
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼');
  const match = /(?:^|\s)\/([^\s/]*)$/.exec(before);
  if (!match) return null;
  const query = match[1] ?? '';
  return { from: $from.pos - query.length - 1, to: $from.pos, query };
}

function placeCaret(view: EditorView, surface: HTMLElement | null, pos: number): CaretPlace | null {
  if (!surface) return null;
  const caret = view.coordsAtPos(pos);
  const at = toLocalPoint(surface, { x: caret.left, y: caret.top });
  return {
    left: at.x,
    top: at.y,
    height: (caret.bottom - caret.top) / measureScale(surface).y,
  };
}

function findMatches(state: EditorState, range: SlashRange, items: readonly InsertMenuItem[]) {
  const matches = matchInsertItems(items, range.query);
  if (matches.length === 0) return matches;
  const preview = previewSlash(state, state.tr.delete(range.from, range.to));
  return matches.filter(({ command }) => canRunSlash(command, preview, state));
}

/**
 * The slash menu's state: open while the editor has focus and a slash query sits before the caret
 * (until Escape closes it for that slash), its matching items, the active one, and the caret
 * marker's place. Arrow keys move the active item, Enter or Tab runs it in place of the query.
 */
export function useSlashMenu(
  items: readonly InsertMenuItem[],
  surfaceRef: RefObject<HTMLElement | null>,
) {
  const { isEditable } = useRichTextEditorContext('InsertMenu');
  const state = useEditorState();
  const range = isEditable ? findSlashRange(state) : null;
  const [hasFocus, setFocus] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [active, setActive] = useState({ query: '', index: 0 });
  const [caret, setCaret] = useState<CaretPlace | null>(null);
  if (!range && dismissedAt !== null) setDismissedAt(null);
  const matches =
    range && hasFocus && dismissedAt !== range.from ? findMatches(state, range, items) : [];
  const openPosition = matches.length > 0 ? range?.from : undefined;
  const isOpen = openPosition !== undefined;
  const activeIndex =
    active.query === range?.query ? Math.max(0, Math.min(active.index, matches.length - 1)) : 0;

  useEditorEventListener('focus', () => (setFocus(true), false));
  useEditorEventListener('blur', () => (setFocus(false), false));
  const measure = useEditorEventCallback((view, position: number) => {
    const place = placeCaret(view, surfaceRef.current, position);
    setCaret((current) => (isShallowEqual(current, place) ? current : place));
  });
  useEditorEffect(() => {
    if (openPosition !== undefined) measure(openPosition);
  }, [measure, openPosition, state]);
  useEditorEffect(
    (view) => {
      if (openPosition === undefined) return;
      return autoUpdateOverlay({ anchor: view.dom, update: () => measure(openPosition) });
    },
    [measure, openPosition],
  );

  const choose = useEditorEventCallback((view, item: InsertMenuItem) => {
    if (!isOpen || !matches.includes(item)) return false;
    const current = findSlashRange(view.state);
    if (!current || current.from !== range?.from || current.query !== range.query) return false;
    const tr = createSlashTransaction(view.state, current, item.command);
    if (!tr) return false;
    view.dispatch(tr);
    view.focus();
    return true;
  });

  useEditorEventListener('keydown', (_view, event) => {
    if (!isOpen || isComposingKey(event)) return false;
    const count = matches.length;
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step !== undefined)
      setActive({ query: range?.query ?? '', index: (activeIndex + step + count) % count });
    else if ((event.key === 'Enter' || event.key === 'Tab') && !event.shiftKey) {
      const item = matches[activeIndex];
      if (!item || !choose(item)) return false;
    } else if (event.key === 'Escape') setDismissedAt(range?.from ?? null);
    else return false;
    event.preventDefault();
    return true;
  });

  return {
    isOpen,
    matches,
    activeIndex,
    caret,
    choose,
    setActiveIndex: (index: number) => setActive({ query: range?.query ?? '', index }),
  };
}
