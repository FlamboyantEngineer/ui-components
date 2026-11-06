'use client';

import { type ReactNode, type Ref, useRef } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, ControlSize, Key, RefProps } from '../../core/props.js';
import { ComboBox as AriaComboBox, FieldError, Label, Text } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useScopedDisabled } from '../field/field.js';
import { useChipsLabel } from './combobox-chips.js';
import { ComboboxField, ComboboxInputs } from './combobox-field.js';
import { comboboxHooks as hooks } from './combobox-hooks.js';
import type { ComboboxItem, ComboboxOption } from './combobox-options.js';
import {
  type ComboboxChangeDetails,
  type ComboboxInputChangeDetails,
  ComboboxMarksContext,
  type ComboboxOpenChangeDetails,
  useComboboxReasons,
} from './combobox-reasons.js';
import { ComboboxReset, useHeldChange } from './combobox-reset.js';
import type { ComboboxLoader } from './combobox-search.js';
import {
  type ComboboxModelOptions,
  useComboboxCollection,
  useComboboxModel,
  useInlineCompletionState,
} from './combobox-state.js';
import { type ComboboxOptionRenderer, ComboboxSuggestions } from './combobox-suggestions.js';
import { decodeComboboxValue, useComboboxValues } from './combobox-values.js';

/** `search` leads the field with a search glyph, for a query completed from suggestions. */
export type ComboboxVariant = 'default' | 'search';

/** `single` picks one option; `multiple` picks several, shown as chips. */
export type ComboboxSelectionMode = 'single' | 'multiple';

/** The picked option's `id` (or `null`) for a single combobox, the list of ids for a multiple one. */
export type ComboboxValue<M extends ComboboxSelectionMode = 'single'> = M extends 'multiple'
  ? Key[]
  : Key | null;

/** When the list opens: as the reader types, on focus, or only from the keyboard and the button. */
export type ComboboxMenuTrigger = 'input' | 'focus' | 'manual';

export interface ComboboxProps<M extends ComboboxSelectionMode = 'single'>
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** Whether the list is open (controlled). */
  isOpen?: boolean | undefined;
  /** Whether the list is open at first, when uncontrolled. */
  defaultOpen?: boolean | undefined;
  /** Called as the list opens or closes, with what opened or closed it. */
  onOpenChange?: ((isOpen: boolean, details: ComboboxOpenChangeDetails) => void) | undefined;
  /** `single` (the default) picks one option; `multiple` picks several, shown as chips. */
  selectionMode?: M | undefined;
  /** The picked option ids (controlled). */
  value?: ComboboxValue<M> | undefined;
  /** The picked option ids at first, when uncontrolled. */
  defaultValue?: ComboboxValue<M> | undefined;
  /** Called with the picked option ids and why they changed. */
  onChange?: ((value: ComboboxValue<M>, details: ComboboxChangeDetails) => void) | undefined;
  /** The input's text (controlled). */
  inputValue?: string | undefined;
  /** The input's text at first, when uncontrolled. */
  defaultInputValue?: string | undefined;
  /** Called as the input's text changes, with why: typed text, or text the combobox wrote. */
  onInputChange?: ((text: string, details: ComboboxInputChangeDetails) => void) | undefined;
  /** Keeps typed text that names no option instead of reverting it. */
  allowsCustomValue?: boolean | undefined;
  /** When the list opens. Defaults to `input`. */
  menuTrigger?: ComboboxMenuTrigger | undefined;
  /** Opens the list even when no suggestion matches, to say so. Defaults to `true`. */
  allowsEmptyCollection?: boolean | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  isInvalid?: boolean | undefined;
  isRequired?: boolean | undefined;
  /** The form name the picked option's id is submitted under. */
  name?: string | undefined;
  /** Called when the end of the list scrolls into view, to load more suggestions. */
  onLoadMore?: (() => void) | undefined;
  /** More suggestions are loading: the list ends with a loading row. */
  isLoading?: boolean | undefined;
  /** A visible label. Without one, pass `aria-label`. */
  label?: ReactNode;
  /** Help text under the field. */
  description?: ReactNode;
  /** Shown while the field is invalid. */
  errorMessage?: ReactNode;
  placeholder?: string | undefined;
  /** Suggestions the combobox filters itself as the user types. */
  defaultItems?: Iterable<ComboboxItem> | undefined;
  /** Suggestions the caller filters (for example from `onInputChange`, possibly asynchronously). */
  items?: Iterable<ComboboxItem> | undefined;
  /**
   * Options that name chosen ids the suggestions do not list now, such as earlier search results:
   * the input and the chips show their labels and icons. They are never listed.
   */
  knownOptions?: Iterable<ComboboxOption> | undefined;
  /** The caller is still fetching suggestions: shows a busy indicator and marks the input busy. */
  isPending?: boolean | undefined;
  /** Defaults to `default`. */
  variant?: ComboboxVariant | undefined;
  /** Field size. Defaults to `md`. */
  size?: ControlSize | undefined;
  /** Renders only the options in view, for very long lists. */
  virtualized?: boolean | undefined;
  /** Ends the list with an "Add" row for typed text no option has as label; runs with the text. */
  onCreateOption?: ((text: string) => void) | undefined;
  /** Marks the typed text in option labels. */
  highlightMatches?: boolean | undefined;
  /** Keeps the first enabled option highlighted while the list is open, so Enter picks it. */
  autoHighlight?: boolean | undefined;
  /** Completes typed text in the input with the first option that starts with it. */
  completesInline?: boolean | undefined;
  /** Draws each option's content in the list instead of its icon, label and description. */
  renderOption?: ComboboxOptionRenderer | undefined;
  /** Searches as the reader types; `items` or `defaultItems` show while the text is too short. */
  loadItems?: ComboboxLoader | undefined;
  /** Milliseconds after the last keystroke before `loadItems` runs. Defaults to 240. */
  searchDelay?: number | undefined;
  /** Shortest trimmed text that runs `loadItems`; 0 also searches the empty text. Defaults to 1. */
  minSearchLength?: number | undefined;
  /** Shown in the list in place of the provider's `noResults` while nothing is listed. */
  renderEmptyState?: (() => ReactNode) | undefined;
  /** Controls drawn at the top of the list, above the options, such as filters. */
  listHeader?: ReactNode;
  /** Receives the text input element. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** Focuses the input when the combobox mounts. */
  autoFocus?: boolean | undefined;
}

type ComboboxListProps = Pick<
  ComboboxProps,
  | 'virtualized'
  | 'onCreateOption'
  | 'highlightMatches'
  | 'autoHighlight'
  | 'renderOption'
  | 'listHeader'
>;

/**
 * The props React Aria's `ComboBox` takes as given: all but the suggestions, the open state and
 * the list's own props.
 */
function omitModelProps<P extends ComboboxModelOptions & ComboboxListProps>(props: P) {
  const {
    items,
    defaultItems,
    knownOptions,
    loadItems,
    minSearchLength,
    searchDelay,
    onLoadMore,
    isLoading,
    renderEmptyState,
    isOpen,
    defaultOpen,
    onOpenChange,
    onInputChange,
    virtualized,
    onCreateOption,
    highlightMatches,
    autoHighlight,
    renderOption,
    listHeader,
    ...aria
  } = props;
  return aria;
}

/** The props that shape the list of suggestions. */
function pickListProps(props: ComboboxListProps) {
  const { virtualized, onCreateOption, highlightMatches, autoHighlight, renderOption } = props;
  return { virtualized, onCreateOption, highlightMatches, autoHighlight, renderOption };
}

function ComboboxLabel({ label, labelRef }: { label: ReactNode; labelRef: Ref<HTMLLabelElement> }) {
  return isEmptyNode(label) ? null : (
    <Label ref={labelRef} className={hooks.slotClass('label')}>
      {label}
    </Label>
  );
}

function ComboboxMessages({
  description,
  errorMessage,
}: Pick<ComboboxProps, 'description' | 'errorMessage'>) {
  return (
    <>
      {isEmptyNode(description) ? null : (
        <Text slot="description" className={hooks.slotClass('description')}>
          {description}
        </Text>
      )}
      <FieldError className={hooks.slotClass('error')}>{errorMessage}</FieldError>
    </>
  );
}

/**
 * The input element, the reasons the combobox reports, and the value change React Aria reports,
 * held through a native reset, to `onChange` with its reason.
 */
function useComboboxChange<M extends ComboboxSelectionMode>({
  inputRef,
  onChange,
  isMultiple,
}: Pick<ComboboxProps<M>, 'inputRef' | 'onChange'> & { isMultiple: boolean }) {
  const [input, setInput] = useForwardedRef(inputRef);
  const reasons = useComboboxReasons(input);
  const reset = useHeldChange(reasons.probeRef, (next) =>
    onChange?.(decodeComboboxValue(next) as ComboboxValue<M>, {
      reason: reasons.readChange(next, !isMultiple),
    }),
  );
  return { input, setInput, reasons, reset };
}

/**
 * A text input with a list of suggestions (React Aria `ComboBox`): typed freely when
 * `allowsCustomValue`, or completed from the list; several options may be picked as chips.
 */
export function Combobox<M extends ComboboxSelectionMode = 'single'>({
  label,
  description,
  errorMessage,
  placeholder,
  isPending = false,
  variant = 'default',
  size = 'md',
  className,
  allowsEmptyCollection = true,
  isReadOnly,
  completesInline,
  inputRef,
  onChange,
  name,
  ...rest
}: ComboboxProps<M>) {
  const isDisabled = useScopedDisabled(rest.isDisabled);
  const aria = omitModelProps(rest);
  const values = useComboboxValues(aria.value, aria.defaultValue);
  const isMultiple = aria.selectionMode === 'multiple';
  const { input, setInput, reasons, reset } = useComboboxChange({ inputRef, onChange, isMultiple });
  const model = useComboboxModel({ ...rest, isPending, isDisabled, isReadOnly }, reasons);
  const { suggestions, known, collection } = useComboboxCollection(model, rest.knownOptions);
  const inline = useInlineCompletionState({ completesInline, suggestions });
  const createdRef = useRef<string | null>(null);
  const naming = useChipsLabel({ label, aria, isEnabled: isMultiple, inputRef: input });
  const list = pickListProps(rest);
  const data = { variant, size, pending: model.isPending };
  return (
    <ComboboxMarksContext value={reasons.marksRef}>
      <AriaComboBox<ComboboxItem, ComboboxSelectionMode>
        {...aria}
        {...values}
        onChange={reset.onChange}
        onSelectionChange={reasons.onSelectionChange}
        name={aria.allowsCustomValue ? name : undefined}
        {...hooks.root({ className, props: aria, data })}
        {...(model.isControlled ? { items: collection } : { defaultItems: collection })}
        defaultFilter={inline.defaultFilter}
        onInputChange={model.input.onInputChange}
        onOpenChange={model.onOpenChange}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        allowsEmptyCollection={allowsEmptyCollection}
      >
        <ComboboxReset {...reset} input={input} isControlled={aria.value !== undefined} />
        <ComboboxLabel label={label} labelRef={naming.labelRef} />
        <ComboboxField
          variant={variant}
          size={size}
          placeholder={placeholder}
          isPending={model.isPending}
          isEditable={!isDisabled && !isReadOnly}
          chips={isMultiple ? { label: naming.text, options: model.flatOptions, known } : null}
          completion={inline.field}
          input={{ ref: input, setRef: setInput }}
        />
        <ComboboxMessages description={description} errorMessage={errorMessage} />
        <ComboboxInputs name={name} isDisabled={isDisabled} isCustom={aria.allowsCustomValue} />
        <ComboboxSuggestions
          {...list}
          size={size}
          items={collection}
          loading={model.loading}
          inputText={model.input.text}
          completion={inline.completion}
          createdRef={createdRef}
          renderEmpty={model.renderEmpty}
          listHeader={rest.listHeader}
          inputRef={input}
          isOpen={model.isOpen}
        />
      </AriaComboBox>
    </ComboboxMarksContext>
  );
}

export type { ComboboxItem, ComboboxOption, ComboboxSection } from './combobox-options.js';
export type {
  ComboboxChangeDetails,
  ComboboxChangeReason,
  ComboboxInputChangeDetails,
  ComboboxInputChangeReason,
  ComboboxOpenChangeDetails,
  ComboboxOpenChangeReason,
} from './combobox-reasons.js';
export type { ComboboxLoader, ComboboxPage } from './combobox-search.js';
export type { ComboboxOptionRenderer } from './combobox-suggestions.js';
