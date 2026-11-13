// A completion source opened by trigger characters, such as `@` for people and `#` for references.

import { findLineStart } from '../../utils/find-line-start.js';
import type { Completion } from './completion-match.js';
import type { CompletionAnswer, CompletionSource } from './use-completions.js';

/** A character that opens completions for the query typed after it. */
export interface CompletionTrigger {
  /** The character that starts a query, such as `@` or `#`. */
  character: string;
  /** The completions for the query typed after the character, at once or later. */
  getCompletions: (query: string) => readonly Completion[] | Promise<readonly Completion[]>;
  /** Lets the query hold spaces, as a person's full name does. */
  allowsSpaces?: boolean | undefined;
  /**
   * With `allowsSpaces`, the most words a query holds (3 by default): typing on past them, as after
   * a completed name, asks for nothing more.
   */
  maxWords?: number | undefined;
}

interface TriggerMatch {
  trigger: CompletionTrigger;
  /** Where the trigger character sits. */
  at: number;
  query: string;
}

const spacePattern = /\s/;

const defaultMaxWords = 3;

function isQuery(query: string, trigger: CompletionTrigger): boolean {
  if (query.startsWith(' ')) return false;
  if (!trigger.allowsSpaces) return !spacePattern.test(query);
  // A space after the last word starts another, so `Ann Lee Ray ` already holds four.
  const words = query.split(/\s+/u).length;
  return !query.includes('\n') && words <= (trigger.maxWords ?? defaultMaxWords);
}

/** Whether a trigger character at `at` starts a query: at the start or after white space. */
function isTriggerStart(value: string, at: number): boolean {
  return at === 0 || spacePattern.test(value[at - 1] ?? '');
}

/**
 * The nearest trigger before the caret on its line whose query reaches the caret, if any. A white
 * space ends the search unless a trigger allows spaces.
 */
function findCompletionTrigger(
  value: string,
  caret: number,
  triggers: readonly CompletionTrigger[],
): TriggerMatch | null {
  const lineStart = findLineStart(value, caret);
  const spaces = triggers.some((trigger) => trigger.allowsSpaces);
  for (let at = caret - 1; at >= lineStart; at -= 1) {
    const character = value[at] ?? '';
    const trigger = triggers.find((candidate) => candidate.character === character);
    const query = value.slice(at + 1, caret);
    if (trigger && isTriggerStart(value, at) && isQuery(query, trigger)) {
      return { trigger, at, query };
    }
    if (spacePattern.test(character) && !spaces) return null;
  }
  return null;
}

/**
 * A completion source for trigger characters: typing `@` (at the start or after white space) asks
 * that trigger's `getCompletions` for the query after it, and a chosen completion replaces the
 * trigger and its query with its `insertText` (or label). The answers show as given.
 */
export function createTriggerCompletions(triggers: readonly CompletionTrigger[]): CompletionSource {
  return ({ value, caret }) => {
    const match = findCompletionTrigger(value, caret, triggers);
    if (!match) return [];
    const answer = (options: readonly Completion[]): CompletionAnswer => ({
      options,
      from: match.at,
      filter: false,
    });
    const found = match.trigger.getCompletions(match.query);
    return 'then' in found ? found.then(answer) : answer(found);
  };
}
