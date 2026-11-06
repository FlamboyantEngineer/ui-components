'use client';

import { type KeyboardEvent, useLayoutEffect, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Group, Input, TextField as AriaTextField, useLocale } from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import {
  Field,
  type FieldControlProps,
  FieldFormValue,
  type FieldInputProps,
  type FieldIssue,
  type FieldState,
  type FieldTextInputProps,
  toAriaControlProps,
  useFieldControl,
} from '../field/field.js';
import { compareDecimals, type DecimalRoundingMode, toCanonicalDecimal } from './decimal.js';
import {
  type DecimalFormatOptions,
  formatLocaleDecimal,
  parseLocaleDecimal,
} from './decimal-locale.js';
import {
  checkDecimal,
  type DecimalFieldCommitBehavior,
  type DecimalRules,
  settleDecimal,
  stepFrom,
  toDecimalRules,
} from './decimal-rules.js';
import { DecimalStepper } from './decimal-stepper.js';

export interface DecimalFieldProps
  extends
    FieldInputProps<string | null>,
    Pick<FieldTextInputProps, 'placeholder' | 'autoComplete' | 'enterKeyHint'> {
  /** The smallest value, a decimal text. */
  minValue?: string | undefined;
  /** The largest value, a decimal text. */
  maxValue?: string | undefined;
  /** The step of the arrow keys and buttons, a decimal text counted from `minValue` (or 0). Defaults to `1`. */
  step?: string | undefined;
  /** The fraction digits the value keeps at most; typed and stepped values round to it. */
  scale?: number | undefined;
  /** How a value with more fraction digits than `scale` rounds. Defaults to `halfExpand`. */
  roundingMode?: DecimalRoundingMode | undefined;
  /** What a commit does with a value outside the rules. Defaults to `snap`. */
  commitBehavior?: DecimalFieldCommitBehavior | undefined;
  /** How the value is written in the locale: grouping and the fraction digits shown at least. */
  formatOptions?: DecimalFormatOptions | undefined;
  /** Leave out the decrement and increment buttons; the arrow keys still step the value. */
  hideStepper?: boolean | undefined;
}

export const decimalFieldHooks = createHooks('decimal-field', [
  'box',
  'group',
  'input',
  'decrement',
  'increment',
]);

const hooks = decimalFieldHooks;

/** The input's text and whether the reader edited it since it last showed the value. */
interface DecimalDraft {
  text: string;
  isEdited: boolean;
}

/** The input's text, replaced by the value's whenever the value or its formatting changes. */
function useDraft(value: string | null, formatted: string) {
  const [draft, setDraft] = useState<DecimalDraft>({ text: formatted, isEdited: false });
  const [shown, setShown] = useState({ value, formatted });
  if (shown.value !== value || shown.formatted !== formatted) {
    setShown({ value, formatted });
    setDraft({ text: formatted, isEdited: false });
  }
  return [draft, setDraft] as const;
}

interface DecimalEntryOptions {
  state: FieldState<string | null>;
  rules: DecimalRules;
  behavior: DecimalFieldCommitBehavior;
  format: (value: string | null) => string;
  locale: string;
}

/**
 * The typing, committing and stepping of a decimal field. The draft stays apart from the value
 * until Enter, Tab or blur reads it; text that spells no decimal stays and reports
 * `decimalUnreadable`. Stepping works on the decimal the input shows.
 */
function useDecimalEntry({ state, rules, behavior, format, locale }: DecimalEntryOptions) {
  const strings = useUiStrings();
  const [draft, setDraft] = useDraft(state.value, format(state.value));
  const parsed = draft.isEdited ? parseLocaleDecimal(draft.text, locale) : { value: state.value };
  const issue: FieldIssue | null =
    parsed === null
      ? { severity: 'error', message: strings.decimalUnreadable, validity: 'badInput' }
      : null;
  const { setDraftIssue } = state;
  useLayoutEffect(() => setDraftIssue(issue));
  const show = (value: string | null) => setDraft({ text: format(value), isEdited: false });
  const finish = (commit: boolean) => {
    if (parsed === null) return;
    if (draft.isEdited) {
      const next = parsed.value === null ? null : settleDecimal(parsed.value, rules, behavior);
      state.setValue(next);
      show(next);
    }
    if (commit) state.commit();
  };
  const move = (next: string) => {
    if (state.isDisabled || state.isReadOnly) return;
    state.setValue(next);
    show(next);
    state.commit();
  };
  // Steps the decimal the input shows, or the value while its text spells none.
  const step = (direction: 1 | -1) => {
    const shown = parsed === null ? state.value : parsed.value;
    const from = shown === null ? null : toCanonicalDecimal(shown);
    move(stepFrom(from, direction, rules));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isComposingKey(event.nativeEvent) || state.isReadOnly) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      finish(true);
    } else if (event.key === 'Tab') finish(false);
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      step(event.key === 'ArrowUp' ? 1 : -1);
    }
  };
  const edit = (text: string) => setDraft({ text, isEdited: true });
  return { draft: draft.text, edit, finish, step, onKeyDown };
}

/** Whether the value sits at an end, so a step toward it cannot move. */
function isAtBound(value: string | null, bound: string | undefined, direction: 1 | -1) {
  const decimal = value === null ? null : toCanonicalDecimal(value);
  if (decimal === null || bound === undefined) return false;
  return compareDecimals(decimal, bound) * direction >= 0;
}

/**
 * A field for an exact decimal held as a canonical string (`"9007199254740993"`, `"-0.125"`),
 * never as a JavaScript number: it reads and writes the locale's separators and digits, steps,
 * bounds, rounds and validates with exact decimal arithmetic, and submits the canonical text.
 */
export function DecimalField({
  placeholder,
  autoComplete,
  enterKeyHint,
  hideStepper = false,
  commitBehavior = 'snap',
  formatOptions,
  minValue,
  maxValue,
  step,
  scale,
  roundingMode,
  ...props
}: DecimalFieldProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const rules = toDecimalRules({ minValue, maxValue, step, scale, roundingMode });
  const writeDecimal = (value: string) => formatLocaleDecimal(value, locale, formatOptions);
  const format = (value: string | null) => {
    if (value === null) return '';
    const decimal = toCanonicalDecimal(value);
    return decimal === null ? value : writeDecimal(decimal);
  };
  const { state, field, rest } = useFieldControl(props, {
    initialValue: null,
    emptyValue: null,
    isEmpty: (value) => value === null || value === '',
    check: (value) => checkDecimal(value, rules, { strings, format: writeDecimal }),
  });
  const entry = useDecimalEntry({ state, rules, behavior: commitBehavior, format, locale });
  const decimal = state.value === null ? null : toCanonicalDecimal(state.value);
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data: { hideStepper } })}
      state={state}
      commitOnBlur
    >
      {(control) => (
        <DecimalControl
          {...{ state, control, entry, hideStepper, placeholder, autoComplete, enterKeyHint }}
          name={rest.name}
          aria={{
            'aria-valuenow': decimal === null ? undefined : Number(decimal),
            'aria-valuetext': decimal === null ? undefined : writeDecimal(decimal),
            'aria-valuemin': rules.minValue === undefined ? undefined : Number(rules.minValue),
            'aria-valuemax': rules.maxValue === undefined ? undefined : Number(rules.maxValue),
          }}
          isAtMinimum={isAtBound(state.value, rules.minValue, -1)}
          isAtMaximum={isAtBound(state.value, rules.maxValue, 1)}
        />
      )}
    </Field>
  );
}

interface DecimalControlProps extends Pick<
  DecimalFieldProps,
  'placeholder' | 'autoComplete' | 'enterKeyHint' | 'name'
> {
  state: FieldState<string | null>;
  control: FieldControlProps;
  entry: ReturnType<typeof useDecimalEntry>;
  hideStepper: boolean;
  /** The spinbutton's values; the exact one is its value text. */
  aria: {
    'aria-valuenow': number | undefined;
    'aria-valuetext': string | undefined;
    'aria-valuemin': number | undefined;
    'aria-valuemax': number | undefined;
  };
  isAtMinimum: boolean;
  isAtMaximum: boolean;
}

/** The spinbutton on React Aria's text field, between its step buttons, and the form value. */
function DecimalControl({
  state,
  control,
  entry,
  hideStepper,
  aria,
  name,
  isAtMinimum,
  isAtMaximum,
  ...text
}: DecimalControlProps) {
  const [input, inputRef] = useForwardedRef<HTMLInputElement>(control.ref);
  const stepper = (direction: 1 | -1) => (
    <DecimalStepper
      direction={direction}
      slot={hooks.slot(direction === 1 ? 'increment' : 'decrement')}
      controlId={control.id}
      labelledBy={control['aria-labelledby']}
      isDisabled={
        state.isDisabled || state.isReadOnly || (direction === 1 ? isAtMaximum : isAtMinimum)
      }
      onStep={() => {
        entry.step(direction);
        input.current?.focus();
      }}
    />
  );
  return (
    <AriaTextField
      {...toAriaControlProps(control)}
      {...hooks.slot('box')}
      value={entry.draft}
      onChange={entry.edit}
    >
      <Group {...hooks.slot('group')}>
        {hideStepper ? null : stepper(-1)}
        <Input
          {...hooks.slot('input')}
          {...aria}
          {...text}
          role="spinbutton"
          inputMode="decimal"
          ref={inputRef}
          onBlur={() => entry.finish(false)}
          onKeyDown={entry.onKeyDown}
        />
        {hideStepper ? null : stepper(1)}
      </Group>
      <FieldFormValue name={name} value={state.value} isDisabled={state.isDisabled} />
    </AriaTextField>
  );
}
