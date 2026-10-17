import {
  useFieldState,
  type FieldIssue,
  type FieldState,
  type FieldStateOptions,
} from './field-state.js';
import type { FieldProps } from './field.js';

/** The props a control hands to `Field`: its layout, parts and caller attributes. */
export type FieldLayoutProps = Omit<FieldProps<unknown>, 'state' | 'children'>;

/**
 * The props every field control shares: the field's label, layout and parts, and its value,
 * committed value, validation and locks. A control's props extend it with the control's own options.
 */
export interface FieldInputProps<T> extends FieldStateOptions<T>, FieldLayoutProps {}

export interface FieldControlOptions<T> {
  /** The value a field starts at, and its default, when the caller gives neither. */
  initialValue: T;
  /** The Clear target when the caller gives none. */
  emptyValue?: T | undefined;
  /** The control's own check, which runs before the caller's `validate`. */
  check?: ((value: T) => FieldIssue | null) | undefined;
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
  'emptyValue',
  'onChange',
  'onCommit',
  'validate',
  'isRequired',
  'isReadOnly',
  'isDisabled',
  'isPending',
]);

const layoutKeys = new Set<string>([
  'label',
  'labelLayout',
  'description',
  'help',
  'decoration',
  'menu',
  'onMenuAction',
  'className',
  'id',
]);

function bucketOf(key: string): 'state' | 'field' | 'rest' {
  if (stateKeys.has(key)) return 'state';
  return layoutKeys.has(key) || key.startsWith('data-') ? 'field' : 'rest';
}

function splitFieldProps(props: object) {
  const buckets: Record<'state' | 'field' | 'rest', Record<string, unknown>> = {
    state: {},
    field: {},
    rest: {},
  };
  for (const [key, value] of Object.entries(props)) buckets[bucketOf(key)][key] = value;
  return buckets;
}

/**
 * Builds a field control from its props: the field state (with the control's own check before the
 * caller's `validate`), the props for `Field`, and the props left for the control itself.
 */
export function useFieldControl<T, P extends FieldInputProps<T>>(
  props: P,
  options: FieldControlOptions<T>,
): FieldControl<T, Omit<P, keyof FieldInputProps<T>>> {
  const buckets = splitFieldProps(props);
  const own = buckets.state as FieldStateOptions<T>;
  const { check } = options;
  const state = useFieldState<T>({
    ...own,
    defaultValue: own.defaultValue !== undefined ? own.defaultValue : options.initialValue,
    emptyValue: own.emptyValue !== undefined ? own.emptyValue : options.emptyValue,
    validate: (value) => check?.(value) ?? own.validate?.(value) ?? null,
  });
  return {
    state,
    field: buckets.field as unknown as FieldLayoutProps,
    rest: buckets.rest as Omit<P, keyof FieldInputProps<T>>,
  };
}
