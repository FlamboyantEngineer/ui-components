'use client';

import {
  useFieldState,
  type FieldErrorSource,
  type FieldIssue,
  type FieldState,
  type FieldStateOptions,
  type FieldValueContract,
} from './field-state.js';
import type { FieldProps } from './field.js';

/**
 * The props a control hands to `Field`: its layout, parts and caller attributes. Whether the field
 * commits on blur is the control's choice, not its caller's.
 */
export type FieldLayoutProps = Omit<FieldProps<unknown>, 'state' | 'children' | 'commitOnBlur'>;

/**
 * The props every field control shares: the field's label, layout and parts, and its value,
 * committed value, validation and locks. A control's props extend it with the control's own options.
 */
export interface FieldInputProps<T> extends FieldStateOptions<T>, FieldLayoutProps {}

/** The virtual keyboard a text control asks for. */
export type FieldInputMode =
  | 'none'
  | 'text'
  | 'tel'
  | 'url'
  | 'email'
  | 'numeric'
  | 'decimal'
  | 'search';

/** The label of the virtual keyboard's Enter key. */
export type FieldEnterKeyHint = 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';

/** The native `spellcheck` attribute for `spellCheck`: left out when the browser chooses. */
export function toSpellCheckAttribute(spellCheck: boolean | undefined) {
  return spellCheck === undefined ? undefined : String(spellCheck);
}

/**
 * The native text-entry attributes a text control hands its input: the hint, autofill, the virtual
 * keyboard, spelling and first focus. Length and format rules are `StringRules`.
 */
export interface FieldTextInputProps {
  /** A hint shown while the control is empty. */
  placeholder?: string | undefined;
  /** The browser's autofill hint, such as `email`, `new-password` or `off`. */
  autoComplete?: string | undefined;
  /** The virtual keyboard to show. */
  inputMode?: FieldInputMode | undefined;
  /** Whether the browser checks spelling. Defaults to the browser's choice. */
  spellCheck?: boolean | undefined;
  /** The label of the virtual keyboard's Enter key, such as `search`, `send` or `done`. */
  enterKeyHint?: FieldEnterKeyHint | undefined;
  /** Focuses the control when it mounts; every field control takes it through `Field`. */
  autoFocus?: boolean | undefined;
}

export interface FieldControlOptions<T> extends FieldValueContract<T> {
  /** The value a field starts at, and its default, when the caller gives neither. */
  initialValue: T;
  /** The Clear target when the caller gives none. */
  emptyValue?: T | undefined;
  /** The control's own check, which runs before the caller's `validate`. */
  check?: ((value: T) => FieldIssue | null) | undefined;
  /** Further form names whose external errors belong to the field (`FieldStateOptions`). */
  errorSources?: readonly FieldErrorSource<T>[] | undefined;
}

export interface FieldControl<T, Rest> {
  state: FieldState<T>;
  /** Spread on `Field`: the layout, parts and caller attributes. */
  field: FieldLayoutProps;
  /** The control's own props. */
  rest: Rest;
}

const stateKeys = new Set<string>([
  'value',
  'defaultValue',
  'committedValue',
  'tracksChanges',
  'emptyValue',
  'onChange',
  'onCommit',
  'validate',
  'validateAsync',
  'validationDebounce',
  'validationMode',
  'validationBehavior',
  'isRequired',
  'isReadOnly',
  'isDisabled',
  'isPending',
]);

const layoutKeys = new Set<string>([
  'label',
  'labelLayout',
  'size',
  'density',
  'description',
  'help',
  'decoration',
  'menu',
  'onMenuAction',
  'renderMessage',
  'autoFocus',
  'className',
  'id',
]);

function bucketOf(key: string): 'state' | 'field' | 'rest' {
  if (stateKeys.has(key)) return 'state';
  return layoutKeys.has(key) || key.startsWith('data-') ? 'field' : 'rest';
}

// The form name is the field's (for external errors) and the control's (to submit its value).
function splitFieldProps(props: object) {
  const buckets: Record<'state' | 'field' | 'rest', Record<string, unknown>> = {
    state: {},
    field: {},
    rest: {},
  };
  for (const [key, value] of Object.entries(props)) {
    if (key === 'name') buckets.state[key] = value;
    buckets[bucketOf(key)][key] = value;
  }
  return buckets;
}

/** The control's own props: everything the field does not take, and the form name, which both use. */
type FieldControlRest<T, P> = Omit<P, Exclude<keyof FieldInputProps<T>, 'name'>>;

/**
 * Builds a field control from its props: the field state (with the control's own check before the
 * caller's `validate`), the props for `Field`, and the props left for the control itself.
 */
export function useFieldControl<T, P extends FieldInputProps<T>>(
  props: P & FieldInputProps<T>,
  options: FieldControlOptions<T>,
): FieldControl<T, FieldControlRest<T, P>> {
  const buckets = splitFieldProps(props);
  const own = buckets.state as FieldStateOptions<T>;
  const { check, isEqual, hasOwnHistory } = options;
  const state = useFieldState<T>(
    {
      ...own,
      defaultValue: own.defaultValue !== undefined ? own.defaultValue : options.initialValue,
      emptyValue: own.emptyValue !== undefined ? own.emptyValue : options.emptyValue,
      validate: (value) => check?.(value) ?? own.validate?.(value) ?? null,
      errorSources: options.errorSources,
    },
    { isEqual, hasOwnHistory },
  );
  return {
    state,
    field: buckets.field as FieldLayoutProps,
    rest: buckets.rest as FieldControlRest<T, P>,
  };
}
