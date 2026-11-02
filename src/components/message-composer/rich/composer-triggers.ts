// The rich composer's trigger vocabularies: the built-in mentions and commands, and the host's own
// triggers with their sources, answered at once or later (specs/MESSAGE-COMPOSER.md,
// UIC-MESSAGE-COMPOSER-4.13).

import type { EditorState } from 'prosemirror-state';
import { scoreCompletion } from '../../completion-list/completion-match.js';
import type { IconSource } from '../../icon/icon.js';
import {
  tokenTriggers,
  type MessageComposerToken,
  type MessageComposerTokenKind,
} from '../composer-message.js';
import type { PillAttributes } from './composer-schema.js';

/** An entry a host trigger's source offers. */
export interface MessageComposerSuggestion {
  /** The entry's opaque identity, the token's `id`. */
  id: string;
  /** The name shown in the list and on the token's chip. */
  label: string;
  /** The raw text the token stands for in the message's text. Defaults to the trigger and the label. */
  text?: string | undefined;
  /** A second line in the list. */
  description?: string | undefined;
  /** An icon before the label in the list. */
  icon?: IconSource;
  /** A record kind or scope the token carries, as the host names it. */
  recordType?: string | undefined;
}

/** What a trigger's source hears beside the query. */
export interface MessageComposerTriggerContext {
  /** Aborts once the answer is no longer wanted: the query changed, the list closed or the composer went away. */
  signal: AbortSignal;
}

/** A host's own trigger: a character that opens its vocabulary, as `@` opens the mentions. */
export interface MessageComposerTrigger {
  /** The vocabulary's stable identity, carried on its tokens as `trigger`. */
  id: string;
  /** The one character that opens it at the start of a line or after a space, such as `$`. */
  character: string;
  /** The entries for the query typed after the character, at once or later, already filtered. */
  getCompletions: (
    query: string,
    context: MessageComposerTriggerContext,
  ) => readonly MessageComposerSuggestion[] | PromiseLike<readonly MessageComposerSuggestion[]>;
  /** Lets the query hold spaces, as a full name does. */
  allowsSpaces?: boolean | undefined;
  /** The icon a token's chip shows before its label. */
  getIcon?: ((token: Omit<MessageComposerToken, 'start' | 'end'>) => IconSource) | undefined;
  /** Names the list for assistive technology. Defaults to the provider's `suggestions`. */
  label?: string | undefined;
}

/** An option in the list, with the pill it inserts. */
export interface RichCompletionItem {
  id: string;
  label: string;
  description?: string | undefined;
  icon?: IconSource;
  /** A built-in option's kind, which the list shows as its tag; a host entry has none. */
  kind?: 'mention' | 'command' | undefined;
  pill: PillAttributes;
  /** The built-in mention it came from, which the list draws with its avatar. */
  source?: unknown;
}

/** A character that opens a vocabulary, and how it answers a query. */
export interface Vocabulary {
  /** Stable across renders while the vocabulary is the same: a host trigger's id, or `@` and `/`. */
  key: string;
  character: string;
  allowsSpaces: boolean;
  kind: MessageComposerTokenKind;
  label: string | undefined;
  /** Whether an empty answer shows `No results` instead of closing the list. */
  showsEmpty: boolean;
  lookUp: (
    query: string,
    context: MessageComposerTriggerContext,
  ) => readonly RichCompletionItem[] | PromiseLike<readonly RichCompletionItem[]>;
}

/** A trigger and the query typed after it before the caret, by document positions. */
export interface TriggerRange {
  vocabulary: Vocabulary;
  from: number;
  to: number;
  query: string;
}

/** The entries whose label matches the query, best first, all of them for no query. */
export function matchByLabel(items: readonly RichCompletionItem[], query: string) {
  return items
    .map((item) => ({ item, score: query ? scoreCompletion(item.label, query) : 0 }))
    .filter(({ score }) => score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .map(({ item }) => item);
}

/** A host trigger as a vocabulary: its entries become `trigger` tokens with their raw text. */
export function toTriggerVocabulary(trigger: MessageComposerTrigger): Vocabulary {
  const toItem = (entry: MessageComposerSuggestion): RichCompletionItem => ({
    id: `trigger:${trigger.id}:${entry.id}`,
    label: entry.label,
    description: entry.description,
    icon: entry.icon,
    pill: {
      kind: 'trigger',
      id: entry.id,
      label: entry.label,
      text: entry.text ?? `${trigger.character}${entry.label}`,
      trigger: trigger.id,
      ...(entry.recordType === undefined ? {} : { recordType: entry.recordType }),
    },
  });
  return {
    key: `trigger:${trigger.id}`,
    character: trigger.character,
    allowsSpaces: trigger.allowsSpaces ?? false,
    kind: 'trigger',
    label: trigger.label,
    showsEmpty: true,
    lookUp: (query, context) => {
      const answer = trigger.getCompletions(query, context);
      return 'then' in answer ? answer.then((entries) => entries.map(toItem)) : answer.map(toItem);
    },
  };
}

/** A built-in vocabulary of `@` mentions or `/` commands, matched by label. */
export function toBuiltInVocabulary(
  kind: 'mention' | 'command',
  items: readonly RichCompletionItem[],
): Vocabulary {
  return {
    key: kind,
    character: tokenTriggers[kind],
    allowsSpaces: false,
    kind,
    label: undefined,
    showsEmpty: false,
    lookUp: (query) => matchByLabel(items, query),
  };
}

const spacePattern = /\s/;
/** Stands for a pill in the text before the caret, which ends any query. */
const pillMark = '￼';

function isQuery(query: string, vocabulary: Vocabulary): boolean {
  if (query.includes(pillMark) || query.startsWith(' ')) return false;
  return vocabulary.allowsSpaces || !spacePattern.test(query);
}

/**
 * The nearest trigger character before the caret on its line, at the line's start or after a
 * space, whose query reaches the caret. Outside code, with an empty selection only.
 */
export function findTrigger(
  state: EditorState,
  vocabularies: readonly Vocabulary[],
): TriggerRange | null {
  const { selection } = state;
  const { $from } = selection;
  if (!selection.empty || $from.parent.type.spec.code || vocabularies.length === 0) return null;
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, pillMark);
  const spaces = vocabularies.some((vocabulary) => vocabulary.allowsSpaces);
  for (let at = before.length - 1; at >= 0; at -= 1) {
    const character = before[at] ?? '';
    const vocabulary = vocabularies.find((candidate) => candidate.character === character);
    const query = before.slice(at + 1);
    const isStart = at === 0 || spacePattern.test(before[at - 1] ?? '');
    if (vocabulary && isStart && isQuery(query, vocabulary)) {
      return { vocabulary, from: $from.pos - query.length - 1, to: $from.pos, query };
    }
    if (character === pillMark || (spacePattern.test(character) && !spaces)) return null;
  }
  return null;
}
