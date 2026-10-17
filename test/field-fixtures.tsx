// Shared fixtures for the field family's unit tests: a field around a plain React Aria `Input`.

import { Input } from 'react-aria-components';
import {
  Field,
  useFieldState,
  type FieldProps,
  type FieldState,
  type FieldStateOptions,
} from '../src/components/field/field.js';

export interface TextFieldProps extends Omit<FieldProps<string>, 'state' | 'label' | 'children'> {
  label?: string;
  options?: FieldStateOptions<string>;
  /** Receives the field state on every render. */
  onState?: (state: FieldState<string>) => void;
}

/** A text field: the input commits on blur and on Enter. */
export function TextField({ label = 'Fruit', options, onState, ...field }: TextFieldProps) {
  const state = useFieldState<string>({ defaultValue: '', ...options });
  onState?.(state);
  return (
    <Field state={state} label={label} {...field}>
      {(control) => (
        <Input
          {...control}
          value={state.value}
          onChange={(event) => state.setValue(event.target.value)}
          onBlur={() => state.commit()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') state.commit();
          }}
        />
      )}
    </Field>
  );
}
