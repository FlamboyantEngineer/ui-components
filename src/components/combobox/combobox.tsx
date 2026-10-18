import { useCallback, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  ComboBox as AriaComboBox,
  FieldError,
  Label,
  Text,
  useFilter,
  type ComboBoxProps as AriaComboBoxProps,
  type ListBoxLoadMoreItemProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { ComboboxField } from './combobox-field.js';
import { flattenOptions, type ComboboxCompletion, type ComboboxItem } from './combobox-options.js';
import { ComboboxSuggestions, type ComboboxOptionRenderer } from './combobox-suggestions.js';

export type ComboboxSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `search` leads the field with a search glyph, for a query completed from suggestions. */
export type ComboboxVariant = 'default' | 'search';

/** `single` picks one option; `multiple` picks several, shown as chips. */
export type ComboboxSelectionMode = 'single' | 'multiple';

export interface ComboboxProps<M extends ComboboxSelectionMode = 'single'>
  extends
    Omit<
      AriaComboBoxProps<ComboboxItem, M>,
      'children' | 'className' | 'style' | 'items' | 'defaultItems' | 'render'
    >,
    Pick<ListBoxLoadMoreItemProps, 'onLoadMore' | 'isLoading'>,
    BaseProps {
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
  ref?: Ref<HTMLDivElement> | undefined;
}

const hooks = createHooks('combobox', ['label', 'description', 'error']);

/** The text naming the combobox, for the group of its chips. */
function toLabelText(label: ReactNode, ariaLabel: string | undefined): string {
  return typeof label === 'string' ? label : (ariaLabel ?? '');
}

/**
 * Inline completion: the completion the input shows, and a filter that matches options against what
 * the reader typed rather than that completion, with the caller's filter or React Aria's accent- and
 * case-insensitive `contains`. Off, it hands the caller's filter through untouched.
 */
function useInlineCompletionState({
  completesInline = false,
  defaultFilter,
  suggestions,
}: Pick<ComboboxProps, 'completesInline' | 'defaultFilter'> & {
  suggestions: Iterable<ComboboxItem>;
}) {
  const [completion, setCompletion] = useState<ComboboxCompletion | null>(null);
  const { contains } = useFilter({ sensitivity: 'base' });
  const filter = defaultFilter ?? contains;
  const completionFilter = useCallback(
    (text: string, input: string) =>
      filter(text, completion?.text === input ? completion.typed : input),
    [filter, completion],
  );
  if (!completesInline) return { defaultFilter, completion: null, field: null };
  return {
    defaultFilter: completionFilter,
    completion,
    field: { options: flattenOptions(suggestions), onComplete: setCompletion },
  };
}

/**
 * The input's text as the caller controls it or as the reader typed it. The suggestion list is a
 * collection React Aria builds before its state exists, so the add row reads the text from here.
 */
function useInputText({
  inputValue,
  defaultInputValue,
  onInputChange,
}: Pick<ComboboxProps, 'inputValue' | 'defaultInputValue' | 'onInputChange'>) {
  const [typed, setTyped] = useState(defaultInputValue ?? '');
  const onChange = (text: string) => {
    setTyped(text);
    onInputChange?.(text);
  };
  return { text: inputValue ?? typed, onInputChange: onChange };
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
  defaultItems,
  items,
  isPending = false,
  variant = 'default',
  size = 'md',
  className,
  allowsEmptyCollection = true,
  isDisabled,
  isReadOnly,
  defaultFilter,
  completesInline,
  virtualized,
  onCreateOption,
  highlightMatches,
  autoHighlight,
  renderOption,
  onLoadMore,
  isLoading,
  ...rest
}: ComboboxProps<M>) {
  const suggestions = items ?? defaultItems ?? [];
  const inline = useInlineCompletionState({ completesInline, defaultFilter, suggestions });
  const input = useInputText(rest);
  const createdRef = useRef<string | null>(null);
  const list = { virtualized, onCreateOption, highlightMatches, autoHighlight, renderOption };
  return (
    <AriaComboBox<ComboboxItem, M>
      {...rest}
      {...hooks.root({ className, props: rest, data: { variant, size, pending: isPending } })}
      {...(items ? { items } : { defaultItems: suggestions })}
      defaultFilter={inline.defaultFilter}
      onInputChange={input.onInputChange}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      allowsEmptyCollection={allowsEmptyCollection}
    >
      {label ? <Label className={hooks.slotClass('label')}>{label}</Label> : null}
      <ComboboxField
        variant={variant}
        size={size}
        placeholder={placeholder}
        isPending={isPending}
        isEditable={!isDisabled && !isReadOnly}
        chips={
          rest.selectionMode === 'multiple'
            ? {
                label: toLabelText(label, rest['aria-label']),
                options: flattenOptions(suggestions),
              }
            : null
        }
        completion={inline.field}
      />
      {description ? (
        <Text slot="description" className={hooks.slotClass('description')}>
          {description}
        </Text>
      ) : null}
      <FieldError className={hooks.slotClass('error')}>{errorMessage}</FieldError>
      <ComboboxSuggestions
        {...list}
        items={suggestions}
        loading={{ onLoadMore, isLoading }}
        inputText={input.text}
        completion={inline.completion}
        createdRef={createdRef}
      />
    </AriaComboBox>
  );
}

export type { ComboboxItem, ComboboxOption, ComboboxSection } from './combobox-options.js';
export type { ComboboxOptionRenderer } from './combobox-suggestions.js';
