'use client';

import {
  useEditorEventCallback,
  useEditorEventListener,
  useEditorState,
} from '@handlewithcare/react-prosemirror';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getCompletionOptionId } from '../../completion-list/completion-list.js';
import { isThenable } from '../../../utils/is-thenable.js';
import { useLatest } from '../../../utils/use-latest.js';
import { tokenTriggers } from '../composer-message.js';
import { replaceWithPill } from './composer-commands.js';
import {
  findTrigger,
  toBuiltInVocabulary,
  toTriggerVocabulary,
  type MessageComposerTrigger,
  type RichCompletionItem,
  type TriggerRange,
  type Vocabulary,
} from './composer-triggers.js';
import type { MessageComposerCommand, MessageComposerMention } from './rich-message-composer.js';

export type { RichCompletionItem } from './composer-triggers.js';

interface RichCompletionsOptions {
  mentions: readonly MessageComposerMention[] | undefined;
  commands: readonly MessageComposerCommand[] | undefined;
  triggers: readonly MessageComposerTrigger[] | undefined;
  isEditable: boolean;
  /** Whose draft the editor shows: an answer for another owner's query is dropped. */
  owner: object;
}

/** A vocabulary's answer to one query: its options, or that it is on its way or failed. */
interface Answer {
  query: string;
  /** The key of the vocabulary that answered. */
  vocabulary: string;
  status: 'ready' | 'pending' | 'error';
  items: readonly RichCompletionItem[];
}

/** The vocabularies in the order a character finds them: the host's first, then `@` and `/`. */
function toVocabularies({
  mentions = [],
  commands = [],
  triggers = [],
}: Pick<RichCompletionsOptions, 'mentions' | 'commands' | 'triggers'>) {
  const vocabularies = triggers.map(toTriggerVocabulary);
  const taken = new Set(vocabularies.map((vocabulary) => vocabulary.character));
  if (mentions.length > 0 && !taken.has(tokenTriggers.mention)) {
    const people = mentions.map((source) => ({
      id: `mention:${source.id}`,
      label: source.label,
      description: source.description,
      kind: 'mention' as const,
      pill: { kind: 'mention' as const, id: source.id, label: source.label },
      source,
    }));
    vocabularies.push(toBuiltInVocabulary('mention', people));
  }
  if (commands.length > 0 && !taken.has(tokenTriggers.command)) {
    const actions = commands.map((source) => ({
      id: `command:${source.id}`,
      label: `${tokenTriggers.command}${source.label}`,
      description: source.description,
      kind: 'command' as const,
      pill: { kind: 'command' as const, id: source.id, label: source.label },
    }));
    vocabularies.push(toBuiltInVocabulary('command', actions));
  }
  return vocabularies;
}

/** Identifies a query: its vocabulary, where its trigger sits and the text typed after it. */
function toQueryKey(range: TriggerRange | null): string {
  return range ? `${range.vocabulary.key}|${String(range.from)}|${range.query}` : '';
}

/**
 * Asks the vocabulary for the query's options whenever the query, its vocabulary or the draft's
 * owner changes. A synchronous answer shows at once; a later one shows only while its query is
 * still the current one, and a rejection or a throw shows as a failure, never as an unhandled error.
 */
function useAnswer(range: TriggerRange | null, owner: object): Answer | null {
  const key = toQueryKey(range);
  const vocabulary = range?.vocabulary;
  const [answer, setAnswer] = useState<Answer | null>(null);
  // Declared before the effect, so the effect reads this render's range.
  const latestRange = useLatest(range);
  useLayoutEffect(() => {
    const current = latestRange.current;
    if (!current || !vocabulary) return undefined;
    const controller = new AbortController();
    const settle = (next: Omit<Answer, 'query' | 'vocabulary'>) => {
      if (!controller.signal.aborted)
        setAnswer({ query: key, vocabulary: vocabulary.key, ...next });
    };
    let result: ReturnType<Vocabulary['lookUp']>;
    try {
      result = vocabulary.lookUp(current.query, { signal: controller.signal });
    } catch {
      settle({ status: 'error', items: [] });
      return () => controller.abort();
    }
    if (isThenable(result)) {
      settle({ status: 'pending', items: [] });
      result.then(
        (items) => settle({ status: 'ready', items }),
        () => settle({ status: 'error', items: [] }),
      );
    } else settle({ status: 'ready', items: result });
    return () => controller.abort();
  }, [key, vocabulary, owner, latestRange]);
  if (!answer || !vocabulary || answer.query === key) return answer?.query === key ? answer : null;
  // Until this commit's effect asks again, before anything paints, the vocabulary's last answer
  // holds the list open, so it does not close and reopen on every key typed.
  return answer.vocabulary === vocabulary.key ? answer : null;
}

function isForwardTab(event: KeyboardEvent): boolean {
  return event.key === 'Tab' && !event.shiftKey;
}

/** Replaces the trigger and query with the chosen option's pill and a space after it. */
function insertPill(
  view: EditorView,
  item: RichCompletionItem,
  vocabularies: readonly Vocabulary[],
) {
  const range = findTrigger(view.state, vocabularies);
  if (range) replaceWithPill(view, range, item.pill);
}

/** Whether the answer has something to show: options, or a host vocabulary's state. */
function hasContent(answer: Answer | null, range: TriggerRange | null): boolean {
  if (!answer || !range) return false;
  if (answer.items.length > 0) return true;
  return answer.status !== 'ready' || range.vocabulary.showsEmpty;
}

/**
 * The rich composer's completions: `@` opens the mentions, `/` the commands and each host trigger
 * its own vocabulary, at the start of a line or after a space, for the query typed after the
 * character. While the list is open, the arrows move the active option (wrapping), Enter or Tab
 * insert it as a pill and Escape closes it until the next edit or caret move. It opens only while
 * the editor has focus.
 */
export function useRichCompletions(options: RichCompletionsOptions) {
  const { mentions, commands, triggers } = options;
  const state = useEditorState();
  const vocabularies = useMemo(
    () => toVocabularies({ mentions, commands, triggers }),
    [mentions, commands, triggers],
  );
  const range = options.isEditable ? findTrigger(state, vocabularies) : null;
  const answer = useAnswer(range, options.owner);
  const matches = answer?.items ?? [];
  const [hasFocus, setFocus] = useState(false);
  const [dismissedIn, setDismissedIn] = useState<EditorState | null>(null);
  const [active, setActive] = useState({ query: '', index: 0 });
  const shownRef = useRef(false);
  const listId = `${useId()}-completions`;
  const isOpen = hasFocus && hasContent(answer, range) && dismissedIn !== state;
  const query = toQueryKey(range);
  const activeIndex = active.query === query ? Math.min(active.index, matches.length - 1) : 0;
  const activeItem = isOpen ? matches[activeIndex] : undefined;

  useEditorEventListener('focus', () => (setFocus(true), false));
  useEditorEventListener('blur', () => (setFocus(false), false));
  const choose = useEditorEventCallback((view, item: RichCompletionItem) => {
    insertPill(view, item, vocabularies);
    view.focus();
  });

  const dismiss = () => {
    setDismissedIn(state);
    return true;
  };
  /** Tab while the list is dismissed shows it again without inserting. */
  const reveal = () => {
    const canReveal = hasFocus && hasContent(answer, range) && dismissedIn === state;
    if (canReveal) setDismissedIn(null);
    return canReveal;
  };

  /**
   * The list's keys while it is open; returns whether the key was used. Until the list is on screen,
   * or while it has no option to insert, Enter and Tab wait; Tab after Escape shows the list again
   * without inserting.
   */
  const handleKeyDown = (event: KeyboardEvent): boolean => {
    if (event.isComposing) return false;
    if (!isOpen) return isForwardTab(event) && reveal();
    if (event.key === 'Escape') return dismiss();
    if (!shownRef.current || !activeItem) return event.key === 'Enter' || isForwardTab(event);
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    const count = matches.length;
    if (step !== undefined) setActive({ query, index: (activeIndex + step + count) % count });
    else if ((event.key === 'Enter' || event.key === 'Tab') && !event.shiftKey) choose(activeItem);
    else return false;
    return true;
  };

  return {
    isOpen,
    kind: range?.vocabulary.kind,
    label: range?.vocabulary.label,
    status: answer?.status ?? 'ready',
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
