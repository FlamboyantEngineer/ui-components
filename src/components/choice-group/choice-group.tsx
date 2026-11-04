'use client';

import { createContext, type ReactNode, useState } from 'react';
import type { ControlSize, Orientation } from '../../core/props.js';
import { Field, type FieldInputProps, useFieldControl } from '../field/field.js';
import { ChoiceBox } from './choice-box.js';
import { choiceGroupHooks as hooks } from './choice-group-hooks.js';

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

/**
 * Whether a value picks no choice on screen. A stored key whose choice is gone counts as nothing, as
 * it is neither shown nor submitted; `""` is a real choice. Before the choices are read (on the
 * server), every stored key counts.
 */
function createChoiceEmptiness(listed: readonly string[] | null) {
  return (value: string | null | string[]) => {
    const keys = value === null ? [] : Array.isArray(value) ? value : [value];
    return listed ? !keys.some((key) => listed.includes(key)) : keys.length === 0;
  };
}

/**
 * A field that chooses one value with radios or several with checkboxes. Each pick commits. Only
 * the choices on screen count: a selected key whose choice is removed stays in the value, so it
 * returns with its choice, but it is not submitted and does not fill a required group.
 */
export function ChoiceGroup<M extends ChoiceGroupSelectionMode = 'single'>({
  children,
  selectionMode = 'single' as M,
  size = 'md',
  ...props
}: ChoiceGroupProps<M>) {
  const empty = (selectionMode === 'multiple' ? [] : null) as ChoiceGroupValue<M>;
  const [listed, setListed] = useState<readonly string[] | null>(null);
  const { state, field, rest } = useFieldControl(props, {
    initialValue: empty,
    emptyValue: empty,
    isEmpty: createChoiceEmptiness(listed),
  });
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
        <ChoiceContext value={settings}>
          <ChoiceBox
            control={control}
            state={state}
            config={rest}
            listed={listed}
            onListedChange={setListed}
          >
            {children}
          </ChoiceBox>
        </ChoiceContext>
      )}
    </Field>
  );
}

export type { ChoiceProps, ChoiceRenderState } from './choice.js';
export { Choice } from './choice.js';
