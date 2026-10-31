'use client';

import { useMemo, useRef, type ReactNode, type Ref } from 'react';
import { ComboBox as AriaComboBox, FieldError, Label, Text } from '../../primitives/index.js';
import type { AriaLabellingProps, OpenStateProps } from '../../core/events.js';
import type { BaseProps, ControlSize, Key, RefProps } from '../../core/props.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { decodeComboboxValue, encodeComboboxItems, useComboboxValues } from './combobox-values.js';
import { useChipsLabel } from './combobox-chips.js';
import { ComboboxField, ComboboxInputs } from './combobox-field.js';
import type { ComboboxItem } from './combobox-options.js';
import type { ComboboxLoader } from './combobox-search.js';
import {
  useComboboxModel,
  useInlineCompletionState,
  type ComboboxModelOptions,
} from './combobox-state.js';
import { ComboboxSuggestions, type ComboboxOptionRenderer } from './combobox-suggestions.js';
import { comboboxHooks as hooks } from './combobox-hooks.js';

export type ComboboxSize = ControlSize;

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
  extends BaseProps, AriaLabellingProps, OpenStateProps, RefProps<HTMLDivElement> {
  /** `single` (the default) picks one option; `multiple` picks several, shown as chips. */
  selectionMode?: M | undefined;
  /** The picked option ids (controlled). */
  value?: ComboboxValue<M> | undefined;
  /** The picked option ids at first, when uncontrolled. */
  defaultValue?: ComboboxValue<M> | undefined;
  /** Called with the picked option ids. */
  onChange?: ((value: ComboboxValue<M>) => void) | undefined;
  /** The input's text (controlled). */
  inputValue?: string | undefined;
  /** The input's text at first, when uncontrolled. */
  defaultInputValue?: string | undefined;
  /** Called as the input's text changes. */
  onInputChange?: ((text: string) => void) | undefined;
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
  /** The caller is still fetching suggestions: shows a busy indicator and marks the input busy. */
  isPending?: boolean | undefined;
  /** Defaults to `default`. */
  variant?: ComboboxVariant | undefined;
  /** Field size. Defaults to `md`. */
  size?: ComboboxSize | undefined;
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

/** What the chips of a multiple combobox need: the text naming their group, and the options. */

/** The props React Aria's `ComboBox` takes as given: all but the suggestions and the open state. */
function omitModelProps<P extends ComboboxModelOptions>(props: P) {
  const {
    items,
    defaultItems,
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
    ...aria
  } = props;
  return aria;
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
  isDisabled,
  isReadOnly,
  completesInline,
  listHeader,
  inputRef,
  onChange,
  virtualized,
  onCreateOption,
  highlightMatches,
  autoHighlight,
  renderOption,
  name,
  ...rest
}: ComboboxProps<M>) {
  const aria = omitModelProps(rest);
  const values = useComboboxValues(aria.value, aria.defaultValue);
  const model = useComboboxModel({ ...rest, isPending, isDisabled, isReadOnly });
  const suggestions = useMemo(() => encodeComboboxItems(model.suggestions), [model.suggestions]);
  const inline = useInlineCompletionState({ completesInline, suggestions });
  const [input, setInput] = useForwardedRef(inputRef);
  const createdRef = useRef<string | null>(null);
  const isMultiple = aria.selectionMode === 'multiple';
  const naming = useChipsLabel({ label, aria, isEnabled: isMultiple });
  const list = { virtualized, onCreateOption, highlightMatches, autoHighlight, renderOption };
  return (
    <AriaComboBox<ComboboxItem, ComboboxSelectionMode>
      {...aria}
      {...values}
      onChange={
        onChange ? (next) => onChange(decodeComboboxValue(next) as ComboboxValue<M>) : undefined
      }
      name={aria.allowsCustomValue ? name : undefined}
      {...hooks.root({ className, props: aria, data: { variant, size, pending: model.isPending } })}
      {...(model.isControlled ? { items: suggestions } : { defaultItems: suggestions })}
      defaultFilter={inline.defaultFilter}
      onInputChange={model.input.onInputChange}
      onOpenChange={model.onOpenChange}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      allowsEmptyCollection={allowsEmptyCollection}
    >
      <ComboboxLabel label={label} labelRef={naming.labelRef} />
      <ComboboxField
        variant={variant}
        size={size}
        placeholder={placeholder}
        isPending={model.isPending}
        isEditable={!isDisabled && !isReadOnly}
        chips={isMultiple ? { label: naming.text, options: model.flatOptions } : null}
        completion={inline.field}
        input={{ ref: input, setRef: setInput }}
      />
      <ComboboxMessages description={description} errorMessage={errorMessage} />
      <ComboboxInputs name={name} isDisabled={isDisabled} isCustom={aria.allowsCustomValue} />
      <ComboboxSuggestions
        {...list}
        size={size}
        items={suggestions}
        loading={model.loading}
        inputText={model.input.text}
        completion={inline.completion}
        createdRef={createdRef}
        renderEmpty={model.renderEmpty}
        listHeader={listHeader}
        inputRef={input}
        isOpen={model.isOpen}
      />
    </AriaComboBox>
  );
}

export type { ComboboxItem, ComboboxOption, ComboboxSection } from './combobox-options.js';
export type { ComboboxLoader, ComboboxPage } from './combobox-search.js';
export type { ComboboxOptionRenderer } from './combobox-suggestions.js';
