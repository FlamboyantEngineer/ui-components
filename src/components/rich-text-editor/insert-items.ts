import { MinusGlyph, type GlyphComponent } from '../../core/glyphs.js';
// The blocks the insert menus offer, and how a typed query finds them.

import type { Key } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import { scoreCompletion } from '../completion-list/completion-match.js';
import { getBlockItems, getWrapItems } from './format-items.js';
import type { RichTextCommand } from './rich-text-command.js';

/** An entry of the insert menus: a command with a label, matched by its label and keywords. */
export interface InsertMenuItem {
  id: Key;
  label: string;
  /** A short explanation shown beside the label. */
  description?: string | undefined;
  /** An imported icon component shown before the label in the insert button's menu. */
  icon?: GlyphComponent | undefined;
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

function scoreInsertItem(item: InsertMenuItem, query: string): number | null {
  let best = scoreCompletion(item.label, query);
  if (best === 0) return best;
  for (const keyword of item.keywords ?? []) {
    const score = scoreCompletion(keyword, query);
    if (score === 0) return score;
    if (score !== null && (best === null || score < best)) best = score;
  }
  return best;
}

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
      icon: MinusGlyph,
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
    .map((item) => ({ item, score: scoreInsertItem(item, query) }))
    .filter(({ score }) => score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .map(({ item }) => item);
}
