import type { KeyboardEvent, RefObject } from 'react';
import { Input } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { Button } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { IconButton } from '../icon-button/icon-button.js';
import { SearchField } from '../search-field/search-field.js';

/** A way of matching the reader can turn on or off, such as matching case or whole words. */
export interface FindBarOption {
  id: Key;
  label: string;
}

export interface FindBarProps extends BaseProps {
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
}

interface FindBarStatus {
  matchCount: number | undefined;
  currentIndex: number | undefined;
  isPending: boolean;
}

const hooks = createHooks('find-bar', [
  'query',
  'status',
  'previous',
  'next',
  'options',
  'replacement',
  'replace',
  'replace-all',
  'close',
]);

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

/** The menu of matching options, each one checked while it is on; choosing one keeps it open. */
function FindBarOptions(
  props: Pick<
    FindBarProps,
    'selectedOptions' | 'defaultSelectedOptions' | 'onSelectedOptionsChange'
  > & {
    options: readonly FindBarOption[];
  },
) {
  const strings = useUiStrings();
  const { options } = props;
  const [selected, setSelected] = useControllableState<Iterable<Key>>(
    props.selectedOptions,
    props.defaultSelectedOptions ?? noOptions,
    (keys) => props.onSelectedOptionsChange?.(new Set(keys)),
  );
  return (
    <DropdownMenu
      className={hooks.slotClass('options')}
      iconOnly
      icon="chevron-down"
      label={strings.findOptions}
      size="sm"
      selectionMode="multiple"
      shouldCloseOnSelect={false}
      selectedKeys={selected}
      onSelectionChange={(keys) =>
        setSelected(keys === 'all' ? new Set(options.map(({ id }) => id)) : new Set(keys))
      }
      items={options.map(({ id, label }) => ({ id, label }))}
    />
  );
}

/** The replacement box with the Replace and Replace all buttons the caller asked for. */
function FindBarReplace({
  hasMatches,
  ...props
}: Pick<
  FindBarProps,
  'replacement' | 'defaultReplacement' | 'onReplacementChange' | 'onReplace' | 'onReplaceAll'
> & { hasMatches: boolean }) {
  const strings = useUiStrings();
  const { onReplace, onReplaceAll } = props;
  const [replacement, setReplacement] = useControllableState(
    props.replacement,
    props.defaultReplacement ?? '',
    props.onReplacementChange,
  );
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // The Enter that confirms a text composition replaces nothing.
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.stopPropagation();
    if (hasMatches) onReplace?.(replacement);
  };
  return (
    <>
      <Input
        className={hooks.slotClass('replacement')}
        aria-label={strings.replaceWith}
        value={replacement}
        onChange={(event) => setReplacement(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {onReplace ? (
        <Button
          className={hooks.slotClass('replace')}
          size="sm"
          variant="ghost"
          isDisabled={!hasMatches}
          onPress={() => onReplace(replacement)}
        >
          {strings.replace}
        </Button>
      ) : null}
      {onReplaceAll ? (
        <Button
          className={hooks.slotClass('replace-all')}
          size="sm"
          variant="ghost"
          isDisabled={!hasMatches}
          onPress={() => onReplaceAll(replacement)}
        >
          {strings.replaceAll}
        </Button>
      ) : null}
    </>
  );
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
  | 'inputRef'
> & { isPending: boolean };

/** The find box, the match count and the Previous match and Next match buttons. */
function FindBarFind({
  matchCount,
  currentIndex,
  isPending,
  onNext,
  onPrevious,
  ...props
}: FindBarFindProps) {
  const strings = useUiStrings();
  const [query, setQuery] = useControllableState(
    props.query,
    props.defaultQuery ?? '',
    props.onQueryChange,
  );
  const hasMatches = (matchCount ?? 0) > 0;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
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
      <span {...hooks.slot('status')} role="status">
        {describeStatus({ matchCount, currentIndex, isPending }, strings)}
      </span>
      <IconButton
        className={hooks.slotClass('previous')}
        icon="arrow-up"
        label={strings.previousMatch}
        size="sm"
        isDisabled={!hasMatches}
        onPress={onPrevious}
      />
      <IconButton
        className={hooks.slotClass('next')}
        icon="arrow-down"
        label={strings.nextMatch}
        size="sm"
        isDisabled={!hasMatches}
        onPress={onNext}
      />
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
  replacement,
  defaultReplacement,
  onReplacementChange,
  onReplace,
  onReplaceAll,
  options,
  selectedOptions,
  defaultSelectedOptions,
  onSelectedOptionsChange,
  onClose,
  inputRef,
  className,
  id,
  ...rest
}: FindBarProps) {
  const strings = useUiStrings();
  // Escape closes the bar before the find box would empty itself; a menu's Escape is the menu's own.
  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !onClose) return;
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };
  const find = { label, placeholder, query, defaultQuery, onQueryChange, inputRef };
  const steps = { matchCount, currentIndex, isPending, onNext, onPrevious };
  const replace = { replacement, defaultReplacement, onReplacementChange, onReplace, onReplaceAll };
  const selection = { selectedOptions, defaultSelectedOptions, onSelectedOptionsChange };
  const hasMatches = (matchCount ?? 0) > 0;
  return (
    <div
      {...hooks.root({ className, props: rest, data: { pending: isPending } })}
      id={id}
      onKeyDownCapture={onKeyDownCapture}
    >
      <FindBarFind {...find} {...steps} />
      {options && options.length > 0 ? <FindBarOptions {...selection} options={options} /> : null}
      {onReplace || onReplaceAll ? <FindBarReplace {...replace} hasMatches={hasMatches} /> : null}
      {onClose ? (
        <IconButton
          className={hooks.slotClass('close')}
          icon="close"
          label={strings.close}
          size="sm"
          onPress={onClose}
        />
      ) : null}
    </div>
  );
}
