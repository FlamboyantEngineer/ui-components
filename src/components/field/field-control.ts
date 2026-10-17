import { useFieldState, type FieldState, type FieldStateOptions } from './field-state.js';
import type { FieldProps } from './field.js';

/**
 * The props every field control takes: the `Field` layout props (label, layout, description, help,
 * decoration, menu, class, id and caller data attributes) and the `useFieldState` options (value,
 * committed value, default, empty value, callbacks, validation and states).
 */
export interface FieldValueProps<T>
  extends Omit<FieldProps<T>, 'state' | 'children'>, FieldStateOptions<T> {}

/** The `Field` props a control passes on, without the state and the render function. */
export type FieldLayoutProps<T> = Omit<FieldProps<T>, 'state' | 'children'>;

/** A control's field state, its `Field` props and the props that are the control's own. */
export interface FieldControl<T, Own> {
  state: FieldState<T>;
  field: FieldLayoutProps<T>;
  own: Own;
}

const layoutKeys = new Set([
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

const stateKeys = new Set([
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

/**
 * Splits a field control's props into the field state (created here), the `Field` props (caller
 * `data-*` attributes included) and the control's own props, so every control shares one split.
 */
export function useFieldControl<T, P extends FieldValueProps<T>>(
  props: P,
): FieldControl<T, Omit<P, keyof FieldValueProps<T>>> {
  const field: Record<string, unknown> = {};
  const options: Record<string, unknown> = {};
  const own: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(props)) {
    if (stateKeys.has(key)) options[key] = entry;
    else if (layoutKeys.has(key) || key.startsWith('data-')) field[key] = entry;
    else own[key] = entry;
  }
  const state = useFieldState<T>(options as FieldStateOptions<T>);
  return {
    state,
    field: field as unknown as FieldLayoutProps<T>,
    own: own as Omit<P, keyof FieldValueProps<T>>,
  };
}
