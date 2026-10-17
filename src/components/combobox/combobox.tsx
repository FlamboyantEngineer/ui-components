import { useContext, useRef, type ReactNode, type Ref, type RefObject } from 'react';
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  ComboBoxStateContext,
  FieldError,
  Group,
  Input,
  Label,
  Text,
  type ComboBoxProps as AriaComboBoxProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';
import { ComboboxSuggestions, type ComboboxItem } from './combobox-suggestions.js';

export type ComboboxSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `search` leads the field with a search glyph, for a query completed from suggestions. */
export type ComboboxVariant = 'default' | 'search';

export interface ComboboxProps
  extends
    Omit<
      AriaComboBoxProps<ComboboxItem>,
      | 'children'
      | 'className'
      | 'style'
      | 'items'
      | 'defaultItems'
      | 'selectionMode'
      | 'value'
      | 'defaultValue'
      | 'onChange'
      | 'render'
    >,
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
  ref?: Ref<HTMLDivElement> | undefined;
}

const hooks = createHooks('combobox', [
  'label',
  'field',
  'search-icon',
  'input',
  'spinner',
  'clear',
  'button',
  'description',
  'error',
]);

/** Empties the input and the selection, then returns focus to the input. */
function ClearButton({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  const state = useContext(ComboBoxStateContext);
  const strings = useUiStrings();
  if (!state || state.inputValue === '') return null;
  return (
    <IconButton
      slot={null}
      icon="close"
      label={strings.clear}
      variant="bare"
      size="sm"
      className={hooks.slotClass('clear')}
      onPress={() => {
        state.setSelectedKey(null);
        state.setInputValue('');
        inputRef.current?.focus();
      }}
    />
  );
}

/**
 * A text input with a list of suggestions (React Aria `ComboBox`): typed freely when
 * `allowsCustomValue`, or completed from the list.
 */
export function Combobox({
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
  ...rest
}: ComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const editable = !isDisabled && !isReadOnly;
  return (
    <AriaComboBox<ComboboxItem>
      {...rest}
      {...hooks.root({ className, props: rest, data: { variant, size, pending: isPending } })}
      {...(items ? { items } : { defaultItems: defaultItems ?? [] })}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      allowsEmptyCollection={allowsEmptyCollection}
    >
      {label ? <Label className={hooks.slotClass('label')}>{label}</Label> : null}
      <Group className={hooks.slotClass('field')}>
        {variant === 'search' ? (
          <Glyph name="search" className={hooks.slotClass('search-icon')} />
        ) : null}
        <Input
          ref={inputRef}
          className={hooks.slotClass('input')}
          placeholder={placeholder}
          aria-busy={isPending || undefined}
        />
        {isPending ? <span {...hooks.slot('spinner')} aria-hidden="true" /> : null}
        {editable ? <ClearButton inputRef={inputRef} /> : null}
        <AriaButton className={hooks.slotClass('button')}>
          <Glyph name="chevron-down" />
        </AriaButton>
      </Group>
      {description ? (
        <Text slot="description" className={hooks.slotClass('description')}>
          {description}
        </Text>
      ) : null}
      <FieldError className={hooks.slotClass('error')}>{errorMessage}</FieldError>
      <ComboboxSuggestions />
    </AriaComboBox>
  );
}

export type { ComboboxItem, ComboboxOption, ComboboxSection } from './combobox-suggestions.js';
