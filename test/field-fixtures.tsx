// Shared fixtures for the field family's unit tests: a field around a plain React Aria `Input`.

import { act, screen } from '@testing-library/react';
import type { userEvent } from '@testing-library/user-event';
import { Input } from '../src/primitives/index.js';
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

/**
 * Chooses `item` from the field menu of the field `control` belongs to, opened with Shift+F10 from
 * the control as a keyboard reader does.
 */
export async function chooseFieldMenuItem(
  user: ReturnType<typeof userEvent.setup>,
  control: HTMLElement,
  item: string,
) {
  act(() => control.focus());
  await user.keyboard('{Shift>}{F10}{/Shift}');
  await user.click(await screen.findByRole('menuitem', { name: item }));
}
