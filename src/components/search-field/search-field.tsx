'use client';

import { CloseGlyph, SearchGlyph } from '../../core/glyphs.js';
import { useEffect, useId, useState, useRef, type ReactNode, type RefObject } from 'react';
import {
  ButtonContext,
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
import {
  FieldMessage,
  resolveFieldValidation,
  toIssueList,
  type FieldIssues,
  type FieldLabelLayout,
  type FieldTextInputProps,
  type FieldValidation,
  type FieldValidationBehavior,
} from '../field/field.js';

export type SearchFieldSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

/** Where a search box's label sits: on the input only, or drawn above the box. */
export type SearchFieldLabelLayout = Extract<FieldLabelLayout, 'label-control' | 'control-only'>;

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
  /**
   * Checks the query, as a field's `validate` does: an `error` issue makes it invalid, a `warning`
   * only advises. The first message shows below the box in the `label-control` layout.
   */
  validate?: ((value: string) => FieldIssues) | undefined;
  /** `native` also reports an error to the browser's constraint validation. Defaults to `aria`. */
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
  'message',
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

/** The query, controlled by the caller or held here, so `validate` can check it as it changes. */
function useQuery({
  value,
  defaultValue,
  onChange,
}: Pick<SearchFieldProps, 'value' | 'defaultValue' | 'onChange'>) {
  const [own, setOwn] = useState(defaultValue ?? '');
  const query = value ?? own;
  const change = (next: string) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  return { query, change };
}

/**
 * The query's validation from `validate`, and in the `native` behavior its error as the input's
 * custom validity, so a form submit is refused while the query is invalid.
 */
function useQueryValidation(
  query: string,
  {
    validate,
    validationBehavior = 'aria',
    input,
  }: {
    validate: SearchFieldProps['validate'];
    validationBehavior: FieldValidationBehavior | undefined;
    input: RefObject<HTMLInputElement | null>;
  },
): FieldValidation {
  const strings = useUiStrings();
  const { validation } = resolveFieldValidation(toIssueList(validate?.(query)), false, strings);
  const validity =
    validationBehavior === 'native' && validation.status === 'invalid'
      ? (validation.message ?? '')
      : '';
  useEffect(() => {
    const element = input.current;
    element?.setCustomValidity(validity);
    return () => element?.setCustomValidity('');
  }, [input, validity]);
  return validation;
}

/** The label, the box and the description and message below it, for the `label-control` layout. */
function LabelledBox({
  label,
  box,
  description,
  messageId,
  validation,
}: {
  label: string;
  box: ReactNode;
  description: ReactNode;
  messageId: string;
  validation: FieldValidation;
}) {
  return (
    <>
      <Label {...hooks.slot('label')}>{label}</Label>
      <Group {...hooks.slot('group')} role="presentation">
        {box}
      </Group>
      {isEmptyNode(description) ? null : (
        <Text {...hooks.slot('description')} slot="description">
          {description}
        </Text>
      )}
      <FieldMessage id={messageId} validation={validation} hooks={hooks}>
        {validation.message}
      </FieldMessage>
    </>
  );
}

/**
 * A search or filter box: a search glyph, the query input, a spinner while results load and a clear
 * button while it holds text. Escape clears the query and Enter submits it. `validate` checks the
 * query as a field does. In the `label-control` layout it also draws its label, description and
 * validation message around the box.
 */
export function SearchField({
  label,
  placeholder,
  clearLabel,
  clearText,
  size = 'md',
  labelLayout = 'control-only',
  description,
  isPending = false,
  inputRef,
  className,
  onClear,
  spellCheck,
  value,
  defaultValue,
  onChange,
  validate,
  validationBehavior,
  ...rest
}: SearchFieldProps) {
  const strings = useUiStrings();
  const ownInput = useRef<HTMLInputElement>(null);
  const input = inputRef ?? ownInput;
  const messageId = useId();
  const { query, change } = useQuery({ value, defaultValue, onChange });
  const validation = useQueryValidation(query, { validate, validationBehavior, input });
  const isInvalid = validation.status === 'invalid';
  const hasLabel = labelLayout === 'label-control';
  const hasMessage = hasLabel && validation.message !== undefined;
  const data = { size, labelLayout, pending: isPending, validation: validation.status };
  return (
    <AriaSearchField
      {...rest}
      {...hooks.root({ className, props: rest, data })}
      aria-label={hasLabel ? undefined : label}
      aria-describedby={hasMessage ? messageId : undefined}
      spellCheck={spellCheck?.toString()}
      value={query}
      onChange={change}
      isInvalid={isInvalid}
      validationBehavior="aria"
      onClear={onClear}
    >
      {({ isEmpty, isDisabled, isReadOnly }) => {
        const clear = () => {
          input.current?.focus();
          change('');
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
          <LabelledBox
            label={label}
            box={box}
            description={description}
            messageId={messageId}
            validation={validation}
          />
        );
      }}
    </AriaSearchField>
  );
}
