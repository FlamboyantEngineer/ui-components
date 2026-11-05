'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ListBox, ListBoxItem, type Selection, useLocale } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useStateFor } from '../../utils/use-state-for.js';
import { Button } from '../button/button.js';
import { buildSearchSnippet } from './build-search-snippet.js';
import { searchPaneHooks as hooks } from './search-pane-hooks.js';
import { SearchSnippet } from './search-snippet.js';

/** One match the host found, in the text around it. */
export interface SearchPaneResult {
  id: Key;
  /** The text around the match, as the document holds it; the pane cuts its snippet from it. */
  source: string;
  /** Where the match starts in `source`, as a UTF-16 offset. */
  start: number;
  /** Where the match ends in `source`, exclusive. */
  end: number;
  /** Where the match is, such as its section or page. */
  label?: string | undefined;
  /** More about the match, after its label. */
  description?: string | undefined;
  /** `false` when the match cannot be replaced: Replace is disabled while it is current. */
  isReplaceable?: boolean | undefined;
}

interface SearchResultsProps {
  results: readonly SearchPaneResult[];
  currentIndex: number;
  onCurrentIndexChange: (index: number) => void;
  /** Marks the results that cannot be replaced. */
  isReplaceMode: boolean;
  maxMounted: number;
}

interface SearchResultRowProps {
  result: SearchPaneResult;
  isReadOnly: boolean;
}

function readSelectedKey(keys: Selection): Key | null {
  if (keys === 'all') return null;
  const [key] = keys;
  return key === undefined ? null : fromCollectionKey(key);
}

/** One result: its label and description, a mark when it cannot be replaced, and its snippet. */
function SearchResultRow({ result, isReadOnly }: SearchResultRowProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const { source, start, end } = result;
  const snippet = useMemo(
    () => buildSearchSnippet({ source, start, end }, { locale }),
    [source, start, end, locale],
  );
  const name = [
    result.label,
    result.description,
    isReadOnly ? strings.notReplaceable : undefined,
    snippet.lead + snippet.near + snippet.match + snippet.after,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <ListBoxItem
      id={toCollectionKey(result.id)}
      textValue={name}
      {...hooks.slot('result', { readOnly: isReadOnly })}
    >
      {/* The spaces between the parts keep the row's name, read from its text, in words. */}
      {result.label ? <span {...hooks.slot('result-label')}>{result.label} </span> : null}
      {result.description ? (
        <span {...hooks.slot('result-description')}>{result.description} </span>
      ) : null}
      {isReadOnly ? (
        <span {...hooks.slot('result-read-only')}>{strings.notReplaceable} </span>
      ) : null}
      <SearchSnippet snippet={snippet} />
    </ListBoxItem>
  );
}

/**
 * The rows mounted out of `count`: at most `size`, in pages that start on a multiple of `size`. The
 * page follows the current result; the Show buttons turn it until the current result changes again.
 */
function useResultWindow(count: number, currentIndex: number, size: number) {
  const [turned, setTurned] = useStateFor<number | null>(currentIndex, null);
  const lastPage = Math.max(0, Math.floor((count - 1) / size) * size);
  const followed = currentIndex >= 0 ? currentIndex - (currentIndex % size) : 0;
  const first = Math.min(turned ?? followed, lastPage);
  return {
    first,
    last: Math.min(count, first + size),
    showEarlier: () => setTurned(Math.max(0, first - size)),
    showLater: () => setTurned(first + size),
  };
}

/**
 * The results in order, as a list box whose selected row is the current result. Choosing a row by
 * pointer, Enter or Space makes it current, and the current row scrolls into view. Only a page of
 * rows mounts at once; the count and stepping still cover every result.
 */
export function SearchResults({
  results,
  currentIndex,
  onCurrentIndexChange,
  isReplaceMode,
  maxMounted,
}: SearchResultsProps) {
  const strings = useUiStrings();
  const size = Math.max(1, Math.floor(maxMounted));
  const { first, last, showEarlier, showLater } = useResultWindow(
    results.length,
    currentIndex,
    size,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const current = results[currentIndex];
  useEffect(() => {
    const row = listRef.current?.querySelector('[role="option"][aria-selected="true"]');
    row?.scrollIntoView?.({ block: 'nearest' });
  }, [current, first]);
  const onSelectionChange = (keys: Selection) => {
    const key = readSelectedKey(keys);
    const index = results.findIndex((result) => result.id === key);
    if (index >= 0) onCurrentIndexChange(index);
  };
  return (
    <>
      {first > 0 ? (
        <Button
          className={hooks.slotClass('show-earlier')}
          size="sm"
          variant="ghost"
          onPress={showEarlier}
        >
          {strings.showEarlierResults(first)}
        </Button>
      ) : null}
      <ListBox
        ref={listRef}
        aria-label={strings.searchResults}
        className={hooks.slotClass('results')}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={current ? [toCollectionKey(current.id)] : []}
        onSelectionChange={onSelectionChange}
      >
        {results.slice(first, last).map((result) => (
          <SearchResultRow
            key={toCollectionKey(result.id)}
            result={result}
            isReadOnly={isReplaceMode && result.isReplaceable === false}
          />
        ))}
      </ListBox>
      {last < results.length ? (
        <Button
          className={hooks.slotClass('show-later')}
          size="sm"
          variant="ghost"
          onPress={showLater}
        >
          {strings.showLaterResults(results.length - last)}
        </Button>
      ) : null}
    </>
  );
}
