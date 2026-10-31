'use client';

import { CloseGlyph, SearchGlyph } from '../../core/glyphs.js';
import { useRef, type ReactNode, type RefObject } from 'react';
import {
  ButtonContext,
  FieldError,
  Group,
  Input,
  Label,
  SearchField as AriaSearchField,
  Text,
} from '../../primitives/index.js';
import type { FocusEventProps, KeyboardEventProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button, ButtonSpinner } from '../button/button.js';
import type {
  FieldLabelLayout,
  FieldTextInputProps,
  FieldValidationBehavior,
} from '../field/field.js';

export type SearchFieldSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

/** Where a search box's label sits: on the input only, or drawn above the box. */
export type SearchFieldLabelLayout = Extract<FieldLabelLayout, 'label-control' | 'control-only'>;

/** A query's check: an error message, or several, for an invalid query; `true` or nothing when valid. */
export type SearchFieldValidate = (value: string) => string | string[] | true | null | undefined;

export interface SearchFieldProps
  extends BaseProps, FieldTextInputProps, FocusEventProps, KeyboardEventProps {
  /** The accessible name of the search box, and its visible label in the `label-control` layout. */
  label: string;
  /** The query, controlled. */
  value?: string | undefined;
  /** The query the box starts with, uncontrolled. */
  defaultValue?: string | undefined;
  /** Called with the query on each change. */
  onChange?: ((value: string) => void) | undefined;
  /** Called with the query when Enter is pressed. */
  onSubmit?: ((value: string) => void) | undefined;
  /** Called after Escape or the clear button empties the query. */
  onClear?: (() => void) | undefined;
  /** The form name the query submits under. */
  name?: string | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  /** Marks the query invalid, which shows `errorMessage` in the `label-control` layout. */
  isInvalid?: boolean | undefined;
  /** Checks the query; its messages show while the query is invalid. */
  validate?: SearchFieldValidate | undefined;
  /** `native` (the default) also reports `validate`'s error to the browser's constraint validation. */
  validationBehavior?: FieldValidationBehavior | undefined;
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
  errorMessage?: ReactNode;
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
        <Button {...shared} icon={CloseGlyph} label={label} />
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
      <Glyph icon={SearchGlyph} className={hooks.slotClass('glyph')} />
      <Input {...hooks.slot('input')} ref={input} placeholder={placeholder} />
      {isPending ? <ButtonSpinner className={hooks.slotClass('spinner')} /> : null}
      {onClear ? <ClearButton label={clearLabel} text={clearText} onPress={onClear} /> : null}
    </>
  );
}

/**
 * Whether the field has a description, which React Aria re-reads to find the description's id when
 * it changes: a description that arrives with a label layout change then still describes the input.
 * The building block takes it at runtime though its types leave it out.
 */
function toDescriptionSlot(description: ReactNode): object {
  return { description: isEmptyNode(description) ? undefined : true };
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
  spellCheck,
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
      spellCheck={spellCheck?.toString()}
      onClear={onClear}
      {...toDescriptionSlot(hasLabel ? description : undefined)}
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
        // One structure in both layouts, so a layout change keeps the input, its text and its focus.
        return (
          <>
            {hasLabel ? <Label {...hooks.slot('label')}>{label}</Label> : null}
            <Group {...hooks.slot('group')} role="presentation">
              {box}
            </Group>
            {hasLabel && description ? (
              <Text {...hooks.slot('description')} slot="description">
                {description}
              </Text>
            ) : null}
            {hasLabel ? <FieldError {...hooks.slot('error')}>{errorMessage}</FieldError> : null}
          </>
        );
      }}
    </AriaSearchField>
  );
}
