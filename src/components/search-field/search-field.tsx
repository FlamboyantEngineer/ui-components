import { useRef, type ReactNode, type RefObject } from 'react';
import {
  ButtonContext,
  FieldError,
  Group,
  Input,
  Label,
  SearchField as AriaSearchField,
  Text,
  type FieldErrorProps,
  type SearchFieldProps as AriaSearchFieldProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button, ButtonSpinner } from '../button/button.js';
import type { FieldLabelLayout } from '../field/field.js';
import { IconButton } from '../icon-button/icon-button.js';

export type SearchFieldSize = Extract<Size, 'sm' | 'md'>;

/** Where a search box's label sits: on the input only, or drawn above the box. */
export type SearchFieldLabelLayout = Extract<FieldLabelLayout, 'label-control' | 'control-only'>;

export interface SearchFieldProps
  extends
    Omit<AriaSearchFieldProps, 'className' | 'style' | 'children' | 'render' | 'aria-label'>,
    BaseProps {
  /** The accessible name of the search box, and its visible label in the `label-control` layout. */
  label: string;
  /** A hint shown while the box is empty. */
  placeholder?: string | undefined;
  /** Names the clear button. Defaults to the provider's `clearSearch`. */
  clearLabel?: string | undefined;
  /** Visible text for the clear button, which otherwise shows the `close` glyph. */
  clearText?: string | undefined;
  /** Box size. Defaults to `md`. */
  size?: SearchFieldSize | undefined;
  /**
   * `control-only` (the default) names the input with the label; `label-control` draws the label
   * above the box, and the description and error message below it.
   */
  labelLayout?: SearchFieldLabelLayout | undefined;
  /** In the `label-control` layout, help text below the box, which describes the input. */
  description?: ReactNode;
  /**
   * In the `label-control` layout, the message shown below the box while the query is invalid.
   * Defaults to the messages of `validate`.
   */
  errorMessage?: FieldErrorProps['children'];
  /** Results are loading: a spinner shows after the input. */
  isPending?: boolean | undefined;
  /** Receives the input, so a caller can move focus to it. */
  inputRef?: RefObject<HTMLInputElement | null> | undefined;
}

interface SearchBoxProps {
  input: RefObject<HTMLInputElement | null>;
  placeholder: string | undefined;
  isPending: boolean;
  /** Clears the query, or `null` while the box shows no clear button. */
  onClear: (() => void) | null;
  clearLabel: string;
  clearText: string | undefined;
}

const hooks = createHooks('search-field', [
  'label',
  'group',
  'glyph',
  'input',
  'spinner',
  'clear',
  'description',
  'error',
]);

/**
 * The clear button. React Aria's own clear button is left out of the tab order and moves focus as a
 * press starts, which a keyboard press cannot survive, so this one stays outside its context.
 */
function ClearButton({ label, text, onPress }: { label: string; text?: string; onPress(): void }) {
  const shared = { className: hooks.slotClass('clear'), size: 'xs' as const, onPress };
  return (
    <ButtonContext.Provider value={null}>
      {text ? (
        <Button {...shared} variant="ghost" aria-label={label}>
          {text}
        </Button>
      ) : (
        <IconButton {...shared} icon="close" label={label} />
      )}
    </ButtonContext.Provider>
  );
}

/** The parts inside the box's frame: the glyph, the input, the spinner and the clear button. */
function SearchBox({
  input,
  placeholder,
  isPending,
  onClear,
  clearLabel,
  clearText,
}: SearchBoxProps) {
  return (
    <>
      <Glyph name="search" className={hooks.slotClass('glyph')} />
      <Input {...hooks.slot('input')} ref={input} placeholder={placeholder} />
      {isPending ? <ButtonSpinner className={hooks.slotClass('spinner')} /> : null}
      {onClear ? <ClearButton label={clearLabel} text={clearText} onPress={onClear} /> : null}
    </>
  );
}

/**
 * A search or filter box: a search glyph, the query input, a spinner while results load and a clear
 * button while it holds text. Escape clears the query and Enter submits it. In the `label-control`
 * layout it also draws its label, description and error message around the box.
 */
export function SearchField({
  label,
  placeholder,
  clearLabel,
  clearText,
  size = 'md',
  labelLayout = 'control-only',
  description,
  errorMessage,
  isPending = false,
  inputRef,
  className,
  onClear,
  ...rest
}: SearchFieldProps) {
  const strings = useUiStrings();
  const ownInput = useRef<HTMLInputElement>(null);
  const input = inputRef ?? ownInput;
  const hasLabel = labelLayout === 'label-control';
  const data = { size, labelLayout, pending: isPending };
  return (
    <AriaSearchField
      {...rest}
      {...hooks.root({ className, props: rest, data })}
      aria-label={hasLabel ? undefined : label}
      onClear={onClear}
    >
      {({ isEmpty, isDisabled, isReadOnly, state }) => {
        const clear = () => {
          input.current?.focus();
          state.setValue('');
          onClear?.();
        };
        const box = (
          <SearchBox
            input={input}
            placeholder={placeholder}
            isPending={isPending}
            onClear={isEmpty || isDisabled || isReadOnly ? null : clear}
            clearLabel={clearLabel ?? strings.clearSearch}
            clearText={clearText}
          />
        );
        if (!hasLabel) return box;
        return (
          <>
            <Label {...hooks.slot('label')}>{label}</Label>
            <Group {...hooks.slot('group')} role="presentation">
              {box}
            </Group>
            {description ? (
              <Text {...hooks.slot('description')} slot="description">
                {description}
              </Text>
            ) : null}
            <FieldError {...hooks.slot('error')}>{errorMessage}</FieldError>
          </>
        );
      }}
    </AriaSearchField>
  );
}
