'use client';

import {
  useEditorEventCallback,
  useEditorEventListener,
  useEditorState,
} from '@handlewithcare/react-prosemirror';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { useId, useMemo, useRef, useState } from 'react';
import {
  getCompletionOptionId,
  scoreCompletion,
  type CompletionListItem,
} from '../../completion-list/completion-list.js';
import { tokenTriggers, type MessageComposerTokenKind } from '../composer-message.js';
import { replaceWithPill } from './composer-commands.js';
import type { MessageComposerCommand, MessageComposerMention } from './rich-message-composer.js';

/** A mention or command offered in the list. */
export interface RichCompletionItem extends CompletionListItem {
  id: string;
  kind: MessageComposerTokenKind;
  source: MessageComposerMention | MessageComposerCommand;
}

/** The trigger and query before the caret that the list completes. */
interface TriggerRange {
  kind: MessageComposerTokenKind;
  from: number;
  to: number;
  query: string;
}

interface RichCompletionsOptions {
  mentions: readonly MessageComposerMention[] | undefined;
  commands: readonly MessageComposerCommand[] | undefined;
  isEditable: boolean;
}

const triggerBeforeCaret = /(?:^|\s)([@/])([^\s@/￼]*)$/;

function toItems(
  mentions: RichCompletionsOptions['mentions'] = [],
  commands: RichCompletionsOptions['commands'] = [],
): RichCompletionItem[] {
  const people = mentions.map((source) => ({
    id: `mention:${source.id}`,
    label: source.label,
    description: source.description,
    kind: 'mention' as const,
    source,
  }));
  const actions = commands.map((source) => ({
    id: `command:${source.id}`,
    label: `${tokenTriggers.command}${source.label}`,
    description: source.description,
    kind: 'command' as const,
    source,
  }));
  return [...people, ...actions];
}

/** A trigger character at the start of a line or after a space, then the query up to the caret. */
function findTrigger(state: EditorState): TriggerRange | null {
  const { selection } = state;
  const { $from } = selection;
  if (!selection.empty || $from.parent.type.spec.code) return null;
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼');
  const match = triggerBeforeCaret.exec(before);
  if (!match) return null;
  const query = match[2] ?? '';
  const kind = match[1] === tokenTriggers.mention ? 'mention' : 'command';
  return { kind, from: $from.pos - query.length - 1, to: $from.pos, query };
}

/** The items of the trigger's kind matching its query, best first, all of them for no query. */
function matchItems(items: readonly RichCompletionItem[], range: TriggerRange) {
  return items
    .filter((item) => item.kind === range.kind)
    .map((item) => ({
      item,
      score: range.query ? scoreCompletion(item.source.label, range.query) : 0,
    }))
    .filter(({ score }) => score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .map(({ item }) => item);
}

function isForwardTab(event: KeyboardEvent): boolean {
  return event.key === 'Tab' && !event.shiftKey;
}

/** Replaces the trigger and query with a pill and a space after it. */
function insertPill(view: EditorView, item: RichCompletionItem) {
  const range = findTrigger(view.state);
  if (!range) return;
  const { id, label } = item.source;
  replaceWithPill(view, range, { kind: item.kind, id, label });
}

/**
 * The rich composer's completions: `@` opens the mentions and `/` the commands, at the start of a
 * line or after a space, filtered by the query typed after the trigger. While the list is open,
 * the arrows move the active option (wrapping), Enter or Tab insert it as a pill and Escape closes
 * it until the next edit or caret move. It opens only while the editor has focus.
 */
export function useRichCompletions(options: RichCompletionsOptions) {
  const { mentions, commands } = options;
  const state = useEditorState();
  const items = useMemo(() => toItems(mentions, commands), [mentions, commands]);
  const range = options.isEditable ? findTrigger(state) : null;
  const matches = range ? matchItems(items, range) : [];
  const [hasFocus, setFocus] = useState(false);
  const [dismissedIn, setDismissedIn] = useState<EditorState | null>(null);
  const [active, setActive] = useState({ query: '', index: 0 });
  const shownRef = useRef(false);
  const listId = `${useId()}-completions`;
  const isOpen = hasFocus && matches.length > 0 && dismissedIn !== state;
  const query = range ? `${range.kind}${range.from}:${range.query}` : '';
  const activeIndex = active.query === query ? Math.min(active.index, matches.length - 1) : 0;
  const activeItem = isOpen ? matches[activeIndex] : undefined;

  useEditorEventListener('focus', () => (setFocus(true), false));
  useEditorEventListener('blur', () => (setFocus(false), false));
  const choose = useEditorEventCallback((view, item: RichCompletionItem) => {
    insertPill(view, item);
    view.focus();
  });

  const dismiss = () => {
    setDismissedIn(state);
    return true;
  };
  /** Tab while the list is dismissed shows it again without inserting. */
  const reveal = () => {
    const canReveal = hasFocus && matches.length > 0 && dismissedIn === state;
    if (canReveal) setDismissedIn(null);
    return canReveal;
  };

  /**
   * The list's keys while it is open; returns whether the key was used. Until the list is on screen
   * Enter and Tab wait for it, and Tab after Escape shows the list again without inserting.
   */
  const handleKeyDown = (event: KeyboardEvent): boolean => {
    if (event.isComposing) return false;
    if (!isOpen) return isForwardTab(event) && reveal();
    if (!shownRef.current) {
      return event.key === 'Enter' || isForwardTab(event) || (event.key === 'Escape' && dismiss());
    }
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    const count = matches.length;
    if (step !== undefined) setActive({ query, index: (activeIndex + step + count) % count });
    else if ((event.key === 'Enter' || event.key === 'Tab') && !event.shiftKey && activeItem) {
      choose(activeItem);
    } else if (event.key === 'Escape') dismiss();
    else return false;
    return true;
  };

  return {
    isOpen,
    kind: range?.kind,
    matches,
    activeItem,
    listId,
    choose,
    handleKeyDown,
    setShown: (shown: boolean) => {
      shownRef.current = shown;
    },
    close: () => setDismissedIn(state),
    setActiveKey: (key: string) =>
      setActive({ query, index: matches.findIndex((item) => item.id === key) }),
    contentAttributes: {
      'aria-autocomplete': 'list',
      'aria-haspopup': 'listbox',
      'aria-controls': isOpen ? listId : undefined,
      'aria-activedescendant': activeItem
        ? getCompletionOptionId(listId, activeItem.id)
        : undefined,
    } as const,
  };
}
