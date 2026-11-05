'use client';

import type { Ref } from 'react';
import { ChevronDownGlyph, ChevronRightGlyph } from '../../core/glyphs.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { FindBar, type FindBarEmptyNavigation, type FindBarOption } from '../find-bar/find-bar.js';
import { searchPaneHooks as hooks } from './search-pane-hooks.js';
import type {
  SearchPaneReplaceMode,
  SearchPaneState,
  SearchPaneStatus,
} from './search-pane-state.js';
import { type SearchPaneResult, SearchResults } from './search-results.js';
import { type SearchPaneHandle, useSearchPane } from './use-search-pane.js';

export interface SearchPaneProps extends RefProps<HTMLDivElement>, BaseProps {
  /** Names the query box. Defaults to the provider's `find` string. */
  label?: string | undefined;
  /** Hint shown in the empty query box. */
  placeholder?: string | undefined;
  /** The query, controlled. */
  query?: string | undefined;
  /** The query the box starts with, uncontrolled. */
  defaultQuery?: string | undefined;
  /** Called with the query on each change. */
  onQueryChange?: ((query: string) => void) | undefined;
  /** Ways of matching, offered in a menu of options the reader turns on and off. */
  options?: readonly FindBarOption[] | undefined;
  /** The options turned on, controlled. */
  selectedOptions?: Iterable<Key> | undefined;
  /** The options turned on at first, uncontrolled. */
  defaultSelectedOptions?: Iterable<Key> | undefined;
  /** Called with the options turned on after each change. */
  onSelectedOptionsChange?: ((keys: Set<Key>) => void) | undefined;
  /** Every result, in document order. */
  results?: readonly SearchPaneResult[] | undefined;
  /** Where the search stands. Defaults to `ready`. */
  status?: SearchPaneStatus | undefined;
  /** Says why the search failed or is unavailable, instead of the provider's text. */
  message?: string | undefined;
  /** The current result, controlled; `null` for none. */
  currentKey?: Key | null | undefined;
  /** The current result at first, uncontrolled. */
  defaultCurrentKey?: Key | null | undefined;
  /** Called with the result that becomes current, by stepping or by choosing a row. */
  onCurrentKeyChange?: ((key: Key) => void) | undefined;
  /** The replacement text, controlled. */
  replacement?: string | undefined;
  /** The replacement text the box starts with, uncontrolled. */
  defaultReplacement?: string | undefined;
  /** Called with the replacement text on each change. */
  onReplacementChange?: ((replacement: string) => void) | undefined;
  /** Whether the pane replaces: `none` (the default), `hidable` behind a toggle, or `shown`. */
  replaceMode?: SearchPaneReplaceMode | undefined;
  /** Replaces the current result: adds the Replace button. */
  onReplace?: ((replacement: string, key: Key) => void) | undefined;
  /** Replaces every result: adds the Replace all button. */
  onReplaceAll?: ((replacement: string) => void) | undefined;
  /** A `hidable` pane shows its replace controls, controlled. */
  isReplaceExpanded?: boolean | undefined;
  /** A `hidable` pane shows its replace controls at first, uncontrolled. */
  defaultReplaceExpanded?: boolean | undefined;
  /** Called when a `hidable` pane's replace controls are shown or hidden. */
  onReplaceExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  /** What the Previous and Next match buttons do while there is no result. Defaults to `disabled`. */
  emptyNavigation?: FindBarEmptyNavigation | undefined;
  /** Disables Replace, as when the reader may not change the current result. */
  isReplaceDisabled?: boolean | undefined;
  /** Disables Replace all. */
  isReplaceAllDisabled?: boolean | undefined;
  /** Called by Escape and the Close button; returning focus is the host's. */
  onClose?: (() => void) | undefined;
  /** Receives the handle that moves focus into the pane. */
  handleRef?: Ref<SearchPaneHandle> | undefined;
  /** The most result rows mounted at once. Defaults to 200. */
  maxMountedResults?: number | undefined;
}

type ReplaceProps = Pick<
  SearchPaneProps,
  'onReplace' | 'onReplaceAll' | 'isReplaceDisabled' | 'isReplaceAllDisabled'
> & { results: readonly SearchPaneResult[]; current: SearchPaneResult | undefined };

const noResults: readonly SearchPaneResult[] = [];

/**
 * The replace props the find bar takes: each handler given, with Replace disabled while the current
 * result cannot be replaced and Replace all while no result can.
 */
function toFindBarReplace({ results, current, ...props }: ReplaceProps) {
  const { onReplace, onReplaceAll } = props;
  return {
    onReplace:
      onReplace &&
      ((replacement: string) => {
        if (current) onReplace(replacement, current.id);
      }),
    onReplaceAll,
    isReplaceDisabled:
      Boolean(props.isReplaceDisabled) || !current || current.isReplaceable === false,
    isReplaceAllDisabled:
      Boolean(props.isReplaceAllDisabled) ||
      !results.some((result) => result.isReplaceable !== false),
  };
}

/** The message a state shows in place of results, if any. */
function SearchPaneMessage({ state, message }: { state: SearchPaneState; message?: string }) {
  const strings = useUiStrings();
  const texts: Record<SearchPaneState, string | null> = {
    empty: strings.searchPrompt,
    'no-results': strings.noResults,
    error: message ?? strings.searchError,
    unavailable: message ?? strings.searchFailed,
    idle: null,
    pending: null,
    results: null,
  };
  const text = texts[state];
  if (text === null) return null;
  return (
    <p {...hooks.slot('message')} role={state === 'error' ? 'alert' : undefined}>
      {text}
    </p>
  );
}

/** The toggle that shows and hides the replace controls. */
function ReplaceToggle({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) {
  const strings = useUiStrings();
  return (
    <Button
      className={hooks.slotClass('replace-toggle')}
      icon={isExpanded ? ChevronDownGlyph : ChevronRightGlyph}
      label={strings.toggleReplace}
      size="sm"
      aria-expanded={isExpanded}
      onPress={onToggle}
    />
  );
}

/**
 * A search pane over a host's document: a find row with the query, matching options, the count and
 * stepping, replace controls with Replace and Replace all that `replaceMode` leaves out, hides
 * behind a toggle or always shows, and the results as a list of one-line snippets. The host
 * matches, navigates, replaces and decides what may be replaced; the pane draws the search and its
 * results, steps through them with wrapping and keeps the current one in view.
 */
export function SearchPane(props: SearchPaneProps) {
  const { ref, className, id, results = noResults, status = 'ready', onClose } = props;
  const replaceMode = props.replaceMode ?? 'none';
  const isReplaceMode = replaceMode !== 'none';
  const {
    queryRef,
    replacementRef,
    query,
    setQuery,
    state,
    currentIndex,
    current,
    setCurrentIndex,
    step,
    isExpanded,
    setExpanded,
    onKeyDownCapture,
  } = useSearchPane({ ...props, results, status, replaceMode });
  const hasList = results.length > 0 && (state === 'results' || state === 'pending');
  const replace = isExpanded ? toFindBarReplace({ ...props, results, current }) : {};
  return (
    <div
      ref={ref}
      {...hooks.root({
        className,
        props,
        data: { state, replaceMode, replaceExpanded: isExpanded },
      })}
      id={id}
      onKeyDownCapture={onKeyDownCapture}
    >
      <div {...hooks.slot('header')}>
        {replaceMode === 'hidable' ? (
          <ReplaceToggle isExpanded={isExpanded} onToggle={() => setExpanded(!isExpanded)} />
        ) : null}
        <FindBar
          {...{
            label: props.label,
            placeholder: props.placeholder,
            query,
            onQueryChange: setQuery,
          }}
          className={hooks.slotClass('find')}
          matchCount={hasList || state === 'no-results' ? results.length : undefined}
          currentIndex={currentIndex}
          isPending={state === 'pending'}
          onNext={() => step(1)}
          onPrevious={() => step(-1)}
          emptyNavigation={props.emptyNavigation}
          options={props.options}
          selectedOptions={props.selectedOptions}
          defaultSelectedOptions={props.defaultSelectedOptions}
          onSelectedOptionsChange={props.onSelectedOptionsChange}
          replacement={props.replacement}
          defaultReplacement={props.defaultReplacement}
          onReplacementChange={props.onReplacementChange}
          {...replace}
          onClose={onClose}
          inputRef={queryRef}
          replacementInputRef={replacementRef}
        />
      </div>
      <SearchPaneMessage state={state} message={props.message} />
      {hasList ? (
        <SearchResults
          results={results}
          currentIndex={currentIndex}
          onCurrentIndexChange={setCurrentIndex}
          isReplaceMode={isReplaceMode}
          maxMounted={props.maxMountedResults ?? 200}
        />
      ) : null}
    </div>
  );
}
