'use client';

import { createContext, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { ControlSize, Orientation } from '../../core/props.js';
import { Field, useFieldControl, type FieldInputProps } from '../field/field.js';
import { ChoiceBox } from './choice-box.js';

export type ChoiceGroupSelectionMode = 'single' | 'multiple';
export type ChoiceGroupValue<M extends ChoiceGroupSelectionMode = 'single'> = M extends 'multiple'
  ? string[]
  : string | null;

export interface ChoiceGroupProps<
  M extends ChoiceGroupSelectionMode = 'single',
> extends FieldInputProps<ChoiceGroupValue<M>> {
  /** Choices with plain or rich labels, in display order. */
  children: ReactNode;
  /** One radio selection, or independent checkboxes. Defaults to `single`. */
  selectionMode?: M | undefined;
  /** Layout of the choices. Defaults to `vertical`. */
  orientation?: Orientation | undefined;
  /** Parent checkbox that selects or clears enabled choices in multiple mode. */
  selectAllLabel?: string | undefined;
}

interface ChoiceSettings {
  selectionMode: ChoiceGroupSelectionMode;
  size: ControlSize;
  isReadOnly: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
  isRequired: boolean;
}

export const ChoiceContext = createContext<ChoiceSettings>({
  selectionMode: 'single',
  size: 'md',
  isReadOnly: false,
  isDisabled: false,
  isInvalid: false,
  isRequired: false,
});
const hooks = createHooks('choice-group');

/** A field that chooses one value with radios or several with checkboxes. Each pick commits. */
export function ChoiceGroup<M extends ChoiceGroupSelectionMode = 'single'>({
  children,
  selectionMode = 'single' as M,
  size = 'md',
  ...props
}: ChoiceGroupProps<M>) {
  const empty = (selectionMode === 'multiple' ? [] : null) as ChoiceGroupValue<M>;
  const { state, field, rest } = useFieldControl(props, { initialValue: empty, emptyValue: empty });
  const settings: ChoiceSettings = {
    selectionMode,
    size,
    isReadOnly: state.isReadOnly,
    isDisabled: state.isDisabled,
    isInvalid: state.validation.status === 'invalid',
    isRequired: state.isRequired,
  };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data: { selectionMode } })}
      size={size}
      state={state}
    >
      {(control) => (
        <ChoiceContext.Provider value={settings}>
          <ChoiceBox control={control} state={state} config={rest}>
            {children}
          </ChoiceBox>
        </ChoiceContext.Provider>
      )}
    </Field>
  );
}

export { Choice } from './choice.js';
export type { ChoiceProps, ChoiceRenderState } from './choice.js';
