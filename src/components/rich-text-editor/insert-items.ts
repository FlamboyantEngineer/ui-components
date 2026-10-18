// The blocks the insert menus offer, and how a typed query finds them.

import type { GlyphName } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import { scoreCompletion } from '../completion-list/completion-list.js';
import { getBlockItems, getWrapItems } from './format-items.js';
import type { RichTextCommand } from './rich-text-command.js';

/** An entry of the insert menus: a command with a label, matched by its label and keywords. */
export interface InsertMenuItem {
  id: Key;
  label: string;
  /** A short explanation shown beside the label. */
  description?: string | undefined;
  /** A built-in glyph shown before the label in the insert button's menu. */
  icon?: GlyphName | undefined;
  /** Other words that find it, such as `title` for a heading. */
  keywords?: readonly string[] | undefined;
  /** What choosing it runs at the caret. */
  command: RichTextCommand;
}

const defaultKeywords: Record<string, readonly string[]> = {
  paragraph: ['plain', 'text'],
  'heading-1': ['title', 'h1'],
  'heading-2': ['subtitle', 'h2'],
  'heading-3': ['h3'],
  'code-block': ['pre', 'snippet'],
  'bullet-list': ['unordered', 'ul'],
  'numbered-list': ['ordered', 'ol'],
  'task-list': ['todo', 'checkbox'],
  quote: ['blockquote', 'citation'],
  divider: ['rule', 'hr', 'line', 'separator'],
};

/** The built-in entries: text blocks, lists, quote and divider, then the caller's own. */
export function getInsertItems(
  strings: UiStrings,
  extra: readonly InsertMenuItem[] = [],
): InsertMenuItem[] {
  const builtIn = [
    ...getBlockItems(strings),
    ...getWrapItems(strings),
    {
      id: 'divider',
      label: strings.divider,
      icon: 'minus' as const,
      command: { type: 'insert', node: 'horizontalRule' } as const,
    },
  ];
  return [
    ...builtIn.map(({ id, label, icon, command }) => ({
      id,
      label,
      icon,
      command,
      keywords: defaultKeywords[id],
    })),
    ...extra,
  ];
}

/** The entries matching a typed query by label or keyword, best match first. */
export function matchInsertItems(
  items: readonly InsertMenuItem[],
  query: string,
): InsertMenuItem[] {
  if (!query) return [...items];
  return items
    .map((item, index) => {
      const scores = [item.label, ...(item.keywords ?? [])]
        .map((word) => scoreCompletion(word, query))
        .filter((score): score is number => score !== null);
      return { item, index, score: scores.length > 0 ? Math.min(...scores) : null };
    })
    .filter(({ score }) => score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0) || a.index - b.index)
    .map(({ item }) => item);
}
