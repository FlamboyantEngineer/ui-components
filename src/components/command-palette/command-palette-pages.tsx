'use client';

import { type KeyboardEvent, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { ChevronLeftGlyph, ChevronRightGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useFilter, useLocale } from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { Button } from '../button/button.js';
import {
  type CommandPage,
  type CommandPaletteEntry,
  type CommandPaletteFilter,
  isBranchCommand,
  rankCommands,
  resolveCommandPage,
  toMenuEntries,
} from './command-palette-entries.js';
import { commandPaletteHooks as hooks } from './command-palette-hooks.js';

interface CommandPagesOptions {
  items: readonly CommandPaletteEntry[] | undefined;
  path: readonly Key[] | undefined;
  defaultPath: readonly Key[] | undefined;
  onPathChange: ((path: Key[]) => void) | undefined;
  query: string;
  setQuery: (query: string) => void;
  filter: CommandPaletteFilter | null | undefined;
  onAction: ((key: Key) => void) | undefined;
}

/**
 * The palette's pages: the path of branch commands opened from the top, the commands the current
 * page shows for the query, ranked, and the moves between pages. Opening a page keeps the query
 * typed on the page it leaves, and Back restores it. Without `items` (commands as children) there
 * is one page and the search field's own filter narrows it.
 */
export function useCommandPages(options: CommandPagesOptions) {
  const { items, query, setQuery, filter } = options;
  const [requested, setPath] = useControllableState<readonly Key[]>(
    options.path,
    options.defaultPath ?? [],
    options.onPathChange as ((path: readonly Key[]) => void) | undefined,
  );
  const [savedQueries, setSavedQueries] = useState<readonly string[]>([]);
  const { startsWith, contains } = useFilter({ sensitivity: 'base' });
  const page = items ? resolveCommandPage(items, requested) : { entries: [], pages: [] };
  const depth = page.pages.length;
  const ranked =
    items && filter !== null
      ? rankCommands(page.entries, { query, match: { startsWith, contains }, filter })
      : page.entries;
  const enter = (id: Key) => {
    setSavedQueries([...savedQueries.slice(0, depth), query]);
    setPath([...page.pages.map((each) => each.id), id]);
    setQuery('');
  };
  const back = () => {
    if (depth === 0) return;
    setPath(page.pages.slice(0, -1).map((each) => each.id));
    setQuery(savedQueries[depth - 1] ?? '');
  };
  // Seen before the field: on an empty field of an inner page, Escape and Backspace go back a page.
  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    if (depth === 0 || query !== '' || isComposingKey(event.nativeEvent)) return;
    if (event.key !== 'Escape' && event.key !== 'Backspace') return;
    event.preventDefault();
    event.stopPropagation();
    back();
  };
  return {
    pages: page.pages,
    menuItems: items ? toMenuEntries(ranked) : undefined,
    /** The search field's own filter: off while the palette ranks its `items`. */
    usesOwnFilter: items === undefined,
    onAction: (key: Key) => {
      if (items && isBranchCommand(page.entries, key)) enter(key);
      else options.onAction?.(key);
    },
    back,
    onKeyDownCapture,
  };
}

/** Above the search field on an inner page: a Back button and the page's title. */
export function CommandPageHeader({ pages, onBack }: { pages: CommandPage[]; onBack: () => void }) {
  const strings = useUiStrings();
  const isRtl = useLocale().direction === 'rtl';
  const current = pages.at(-1);
  if (!current) return null;
  return (
    <div {...hooks.slot('page')}>
      <Button
        className={hooks.slotClass('back')}
        icon={isRtl ? ChevronRightGlyph : ChevronLeftGlyph}
        label={strings.back}
        size="sm"
        variant="ghost"
        onPress={onBack}
      />
      <span {...hooks.slot('page-title')}>{current.label}</span>
    </div>
  );
}
