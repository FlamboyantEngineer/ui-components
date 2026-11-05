'use client';

import type { KeyboardEvent, RefObject } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { ArrowDownGlyph, ArrowUpGlyph, CloseGlyph } from '../../core/glyphs.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isNode } from '../../utils/is-element.js';
import { Button } from '../button/button.js';
import { SearchField } from '../search-field/search-field.js';
import { findBarHooks as hooks } from './find-bar-hooks.js';
import { FindBarOptions, FindBarReplace } from './find-bar-parts.js';

/** A way of matching the reader can turn on or off, such as matching case or whole words. */
export interface FindBarOption {
  id: Key;
  label: string;
}

/** The Previous and Next match buttons while there is no match: disabled, or left out. */
export type FindBarEmptyNavigation = 'disabled' | 'hidden';

export interface FindBarProps extends RefProps<HTMLDivElement>, BaseProps {
  /** Names the find box. Defaults to the provider's `find` string. */
  label?: string | undefined;
  /** Hint shown in the empty find box. */
  placeholder?: string | undefined;
  /** The query, controlled. */
  query?: string | undefined;
  /** The query the box starts with, uncontrolled. */
  defaultQuery?: string | undefined;
  /** Called with the query on each change. */
  onQueryChange?: ((query: string) => void) | undefined;
  /** How many matches the caller found; `undefined` while nothing is searched. */
  matchCount?: number | undefined;
  /** The current match, zero-based; outside the matches when there is none. */
  currentIndex?: number | undefined;
  /** The matches are being looked for. */
  isPending?: boolean | undefined;
  /** Moves to the next match: the Next match button, or Enter in the find box. */
  onNext?: (() => void) | undefined;
  /** Moves to the previous match: the Previous match button, or Shift+Enter in the find box. */
  onPrevious?: (() => void) | undefined;
  /** What the Previous and Next match buttons do while there is no match. Defaults to `disabled`. */
  emptyNavigation?: FindBarEmptyNavigation | undefined;
  /** The replacement text, controlled. */
  replacement?: string | undefined;
  /** The replacement text the box starts with, uncontrolled. */
  defaultReplacement?: string | undefined;
  /** Called with the replacement text on each change. */
  onReplacementChange?: ((replacement: string) => void) | undefined;
  /** Adds the replacement box and a Replace button, which calls it with the replacement. */
  onReplace?: ((replacement: string) => void) | undefined;
  /** Adds the replacement box and a Replace all button, which calls it with the replacement. */
  onReplaceAll?: ((replacement: string) => void) | undefined;
  /** Disables Replace, and Enter in the replacement box, even while there are matches. */
  isReplaceDisabled?: boolean | undefined;
  /** Disables Replace all even while there are matches. */
  isReplaceAllDisabled?: boolean | undefined;
  /** Ways of matching, offered in a menu of options the reader turns on and off. */
  options?: readonly FindBarOption[] | undefined;
  /** The options turned on, controlled. */
  selectedOptions?: Iterable<Key> | undefined;
  /** The options turned on at first, uncontrolled. */
  defaultSelectedOptions?: Iterable<Key> | undefined;
  /** Called with the options turned on after each change. */
  onSelectedOptionsChange?: ((keys: Set<Key>) => void) | undefined;
  /** Adds a Close button, which Escape anywhere in the bar also presses. */
  onClose?: (() => void) | undefined;
  /** Receives the find box's input, so a caller can move focus to it. */
  inputRef?: RefObject<HTMLInputElement | null> | undefined;
  /** Receives the replacement box's input while it is shown, so a caller can move focus to it. */
  replacementInputRef?: RefObject<HTMLInputElement | null> | undefined;
}

interface FindBarStatus {
  matchCount: number | undefined;
  currentIndex: number | undefined;
  isPending: boolean;
}

const noOptions: readonly Key[] = [];

/** What the status reads: searching, the current match of the total, the total, no results, or nothing. */
function describeStatus(
  { matchCount, currentIndex = -1, isPending }: FindBarStatus,
  strings: UiStrings,
): string {
  if (isPending) return strings.searching;
  if (matchCount === undefined) return '';
  if (matchCount === 0) return strings.noResults;
  if (currentIndex >= 0 && currentIndex < matchCount) {
    return strings.stepOfTotal(currentIndex + 1, matchCount);
  }
  return strings.matchTotal(matchCount);
}

type FindBarFindProps = Pick<
  FindBarProps,
  | 'label'
  | 'placeholder'
  | 'query'
  | 'defaultQuery'
  | 'onQueryChange'
  | 'matchCount'
  | 'currentIndex'
  | 'onNext'
  | 'onPrevious'
  | 'emptyNavigation'
  | 'inputRef'
> & { isPending: boolean };

/** The find box, the match count and the Previous match and Next match buttons. */
function FindBarFind({
  matchCount,
  currentIndex,
  isPending,
  onNext,
  onPrevious,
  emptyNavigation = 'disabled',
  ...props
}: FindBarFindProps) {
  const strings = useUiStrings();
  const [query, setQuery] = useControllableState(
    props.query,
    props.defaultQuery ?? '',
    props.onQueryChange,
  );
  const hasMatches = (matchCount ?? 0) > 0;
  const showsSteps = hasMatches || emptyNavigation === 'disabled';
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || isComposingKey(event.nativeEvent)) return;
    event.preventDefault();
    if (!hasMatches) return;
    if (event.shiftKey) onPrevious?.();
    else onNext?.();
  };
  return (
    <>
      <SearchField
        className={hooks.slotClass('query')}
        label={props.label ?? strings.find}
        placeholder={props.placeholder}
        size="sm"
        value={query}
        onChange={setQuery}
        onKeyDown={onKeyDown}
        isPending={isPending}
        inputRef={props.inputRef}
      />
      {/* One part, so the count and its arrows wrap onto a new line together. */}
      <div {...hooks.slot('navigation')}>
        <span {...hooks.slot('status')} role="status">
          {describeStatus({ matchCount, currentIndex, isPending }, strings)}
        </span>
        {showsSteps ? (
          <>
            <Button
              className={hooks.slotClass('previous')}
              icon={ArrowUpGlyph}
              label={strings.previousMatch}
              size="sm"
              isDisabled={!hasMatches}
              onPress={onPrevious}
            />
            <Button
              className={hooks.slotClass('next')}
              icon={ArrowDownGlyph}
              label={strings.nextMatch}
              size="sm"
              isDisabled={!hasMatches}
              onPress={onNext}
            />
          </>
        ) : null}
      </div>
    </>
  );
}

/**
 * A find row: the find box with the match count, previous and next match, optional matching
 * options, an optional replacement with Replace and Replace all, and an optional Close button. The
 * caller finds the matches and reports how many there are and which one is current. Enter and
 * Shift+Enter in the find box step through the matches, Enter in the replacement box replaces, and
 * Escape closes the bar when it can close.
 */
export function FindBar({
  ref,
  label,
  placeholder,
  query,
  defaultQuery,
  onQueryChange,
  matchCount,
  currentIndex,
  isPending = false,
  onNext,
  onPrevious,
  emptyNavigation,
  replacement,
  defaultReplacement,
  onReplacementChange,
  onReplace,
  onReplaceAll,
  isReplaceDisabled,
  isReplaceAllDisabled,
  options,
  selectedOptions,
  defaultSelectedOptions,
  onSelectedOptionsChange,
  onClose,
  inputRef,
  replacementInputRef,
  className,
  id,
  ...rest
}: FindBarProps) {
  const strings = useUiStrings();
  // Escape closes the bar before the find box would empty itself; a menu's Escape is the menu's own,
  // and a composing Escape the input method's.
  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !onClose || isComposingKey(event.nativeEvent)) return;
    if (!isNode(event.target) || !event.currentTarget.contains(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };
  const find = { label, placeholder, query, defaultQuery, onQueryChange, inputRef };
  const steps = { matchCount, currentIndex, isPending, onNext, onPrevious, emptyNavigation };
  // The bar, not its optional controls, owns their values, so they outlast the controls.
  const [currentReplacement, setReplacement] = useControllableState(
    replacement,
    defaultReplacement ?? '',
    onReplacementChange,
  );
  const [selected, setSelected] = useControllableState<Iterable<Key>>(
    selectedOptions,
    defaultSelectedOptions ?? noOptions,
    (keys) => onSelectedOptionsChange?.(new Set(keys)),
  );
  const replace = {
    ...{ replacement: currentReplacement, setReplacement, onReplace, onReplaceAll },
    ...{ isReplaceDisabled, isReplaceAllDisabled, replacementInputRef },
  };
  const hasMatches = (matchCount ?? 0) > 0;
  return (
    <div
      ref={ref}
      {...hooks.root({ className, props: rest, data: { pending: isPending } })}
      id={id}
      onKeyDownCapture={onKeyDownCapture}
    >
      <FindBarFind {...find} {...steps} />
      {options && options.length > 0 ? (
        <FindBarOptions options={options} selected={selected} setSelected={setSelected} />
      ) : null}
      {onReplace || onReplaceAll ? <FindBarReplace {...replace} hasMatches={hasMatches} /> : null}
      {onClose ? (
        <Button
          className={hooks.slotClass('close')}
          icon={CloseGlyph}
          label={strings.close}
          size="sm"
          onPress={onClose}
        />
      ) : null}
    </div>
  );
}
