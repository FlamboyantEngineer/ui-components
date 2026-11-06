// A command palette's entries: the commands on each page, and how a query ranks them.

import type { Key } from '../../core/props.js';
import type { MenuItemEntry, MenuSectionEntry, MenuSeparatorEntry } from '../menu/menu.js';

/** A command: a menu item that may carry search keywords, or open a page of further commands. */
export interface CommandPaletteItem extends Omit<MenuItemEntry, 'items'> {
  /** Words that find the command without showing in it, such as synonyms. */
  keywords?: readonly string[] | undefined;
  /** The commands of the page this command opens; it then opens the page instead of running. */
  commands?: readonly CommandPaletteEntry[] | undefined;
}

/** A section of commands. */
export interface CommandPaletteSection extends Omit<MenuSectionEntry, 'items'> {
  items: readonly CommandPaletteEntry[];
}

export type CommandPaletteEntry = CommandPaletteItem | CommandPaletteSection | MenuSeparatorEntry;

/** Whether a command whose text is `textValue` matches the typed `inputValue`. */
export type CommandPaletteFilter = (textValue: string, inputValue: string) => boolean;

/** Locale-aware text tests that ignore case and accents. */
export interface CommandMatcher {
  startsWith: (text: string, query: string) => boolean;
  contains: (text: string, query: string) => boolean;
}

/** A page of the palette: its branch command's id and label. */
export interface CommandPage {
  id: Key;
  label: string;
}

const wordSeparator = /[\s\p{P}]+/u;

export function isCommandSection(entry: CommandPaletteEntry): entry is CommandPaletteSection {
  return entry.type === 'section';
}

export function isCommandItem(entry: CommandPaletteEntry): entry is CommandPaletteItem {
  return entry.type === undefined || entry.type === 'item';
}

/**
 * How well a command matches, lower first, or `null` when it does not: its whole label, the start
 * of its label, the start of a word of it, anywhere in it, then the same for each keyword after
 * every label match. Keywords never mark the label (only the label's own text is highlighted).
 */
function scoreCommand(item: CommandPaletteItem, query: string, match: CommandMatcher) {
  const texts = [item.label, ...(item.keywords ?? [])];
  for (const [position, text] of texts.entries()) {
    const base = position === 0 ? 0 : 4;
    if (match.startsWith(text, query) && match.startsWith(query, text)) return base;
    if (match.startsWith(text, query)) return base + 1;
    if (text.split(wordSeparator).some((word) => match.startsWith(word, query))) return base + 2;
    if (match.contains(text, query)) return base + 3;
  }
  return null;
}

/** A command's score under the caller's filter, which only keeps or drops, or the ranking. */
function scoreEntry(
  item: CommandPaletteItem,
  query: string,
  options: { match: CommandMatcher; filter?: CommandPaletteFilter | undefined },
): number | null {
  const { filter } = options;
  if (!filter) return scoreCommand(item, query, options.match);
  return [item.label, ...(item.keywords ?? [])].some((text) => filter(text, query)) ? 0 : null;
}

/**
 * The entries a query keeps, ranked: in each section (and at the top level) the matching commands
 * by score, ties in their given order; sections keep their order and drop out without a match,
 * and separators drop out while a query narrows. Disabled commands match like the others. A
 * `filter` replaces the ranking: it keeps a command when it accepts the label or a keyword, in the
 * given order. A blank query keeps every entry as given.
 */
export function rankCommands(
  entries: readonly CommandPaletteEntry[],
  options: { query: string; match: CommandMatcher; filter?: CommandPaletteFilter | undefined },
): readonly CommandPaletteEntry[] {
  const query = options.query.trim();
  if (query === '') return entries;
  const kept: CommandPaletteEntry[] = [];
  // Commands sort among the commands around them; sections stay where they were.
  let run: Array<{ entry: CommandPaletteItem; score: number }> = [];
  const flush = () => {
    kept.push(...run.sort((a, b) => a.score - b.score).map(({ entry }) => entry));
    run = [];
  };
  for (const entry of entries) {
    if (isCommandSection(entry)) {
      flush();
      const items = rankCommands(entry.items, options);
      if (items.length > 0) kept.push({ ...entry, items });
    } else if (isCommandItem(entry)) {
      const score = scoreEntry(entry, query, options);
      if (score !== null) run.push({ entry, score });
    }
  }
  flush();
  return kept;
}

/** The command with `id` among the entries, inside sections too. */
function findCommand(entries: readonly CommandPaletteEntry[], id: Key): CommandPaletteItem | null {
  for (const entry of entries) {
    if (isCommandSection(entry)) {
      const found = findCommand(entry.items, id);
      if (found) return found;
    } else if (isCommandItem(entry) && entry.id === id) {
      return entry;
    }
  }
  return null;
}

/**
 * The page a path of branch command ids leads to: its entries and the pages on the way, following
 * the path as far as its commands still exist and still open pages.
 */
export function resolveCommandPage(
  entries: readonly CommandPaletteEntry[],
  path: readonly Key[],
): { entries: readonly CommandPaletteEntry[]; pages: CommandPage[] } {
  let current = entries;
  const pages: CommandPage[] = [];
  for (const id of path) {
    const branch = findCommand(current, id);
    if (!branch?.commands) break;
    pages.push({ id: branch.id, label: branch.label });
    current = branch.commands;
  }
  return { entries: current, pages };
}

/** Whether the command with `id` opens a page. */
export function isBranchCommand(entries: readonly CommandPaletteEntry[], id: Key): boolean {
  return findCommand(entries, id)?.commands !== undefined;
}

/**
 * The entries as the menu draws them: commands without their search keywords, and branch commands
 * kept open on activation, since they open a page rather than run.
 */
export function toMenuEntries(
  entries: readonly CommandPaletteEntry[],
): Array<MenuItemEntry | MenuSectionEntry | MenuSeparatorEntry> {
  return entries.map((entry) => {
    if (isCommandSection(entry)) return { ...entry, items: toMenuEntries(entry.items) };
    if (!isCommandItem(entry)) return entry;
    const { keywords: _keywords, commands, ...item } = entry;
    return commands ? { ...item, shouldCloseOnSelect: false } : item;
  });
}
