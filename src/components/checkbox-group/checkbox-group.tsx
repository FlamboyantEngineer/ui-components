import type { ReactNode } from 'react';
import {
  CheckboxGroup as AriaCheckboxGroup,
  CheckboxGroupStateContext,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { ControlSize } from '../../core/props.js';
import { Checkbox } from '../checkbox/checkbox.js';
import {
  Field,
  toAriaControlProps,
  useFieldControl,
  type FieldInputProps,
  type FieldState,
} from '../field/field.js';

export interface CheckboxGroupOption {
  /** The value the option adds to the group's value, and submits under the group's `name`. */
  value: string;
  /** The option's label: it names its checkbox, and pressing it toggles the box. */
  label: ReactNode;
  isDisabled?: boolean | undefined;
}

export interface CheckboxGroupProps extends FieldInputProps<string[]> {
  /** The options, in order: one checkbox each. */
  options: readonly CheckboxGroupOption[];
  /**
   * Draws a parent box first, named by this label, that ticks or clears every enabled option and is
   * mixed while only some are ticked.
   */
  selectAllLabel?: string | undefined;
}

const hooks = createHooks('checkbox-group', ['box', 'select-all']);

/** Sets and commits a new list of ticked values. */
function pick(state: FieldState<string[]>, value: string[]) {
  state.setValue(value);
  state.commit();
}

/** The parent box: ticked while every enabled option is, mixed while some are. */
function SelectAll({
  label,
  options,
  state,
  size,
}: {
  label: string;
  options: readonly CheckboxGroupOption[];
  state: FieldState<string[]>;
  size: ControlSize | undefined;
}) {
  const enabled = options.filter((option) => !option.isDisabled).map((option) => option.value);
  const enabledValues = new Set(enabled);
  const selected = new Set(state.value);
  const ticked = enabled.filter((value) => selected.has(value));
  const isAll = enabled.length > 0 && ticked.length === enabled.length;
  const onChange = () =>
    pick(
      state,
      isAll
        ? state.value.filter((value) => !enabledValues.has(value))
        : [...state.value, ...enabled.filter((value) => !selected.has(value))],
    );
  // The parent box is not one of the group's values, so it stays outside the group's state.
  return (
    <CheckboxGroupStateContext.Provider value={null}>
      <Checkbox
        className={hooks.slotClass('select-all')}
        size={size}
        isSelected={isAll}
        isIndeterminate={ticked.length > 0 && !isAll}
        isReadOnly={state.isReadOnly}
        isDisabled={state.isDisabled || enabled.length === 0}
        onChange={onChange}
      >
        {label}
      </Checkbox>
    </CheckboxGroupStateContext.Provider>
  );
}

/**
 * A field for a list of values, drawn as a group of checkboxes on React Aria's `CheckboxGroup`, with
 * the field's label, description, validation, dirty state, undo and menu. Each toggle commits, and an
 * optional parent box ticks or clears every option.
 */
export function CheckboxGroup({ options, selectAllLabel, ...props }: CheckboxGroupProps) {
  const { state, field, rest } = useFieldControl(props, { initialValue: [], emptyValue: [] });
  const first = options.findIndex((option) => !option.isDisabled);
  return (
    <Field {...field} {...hooks.root({ className: field.className })} state={state}>
      {(control) => {
        // A group takes no error message reference; its message describes it instead.
        const { 'aria-errormessage': _errorMessage, ...aria } = toAriaControlProps(control);
        return (
          <AriaCheckboxGroup
            {...rest}
            {...aria}
            {...hooks.slot('box')}
            value={state.value}
            onChange={(value) => pick(state, value)}
          >
            {selectAllLabel ? (
              <SelectAll label={selectAllLabel} options={options} state={state} size={field.size} />
            ) : null}
            {options.map((option, index) => (
              <Checkbox
                key={option.value}
                size={field.size}
                value={option.value}
                isDisabled={option.isDisabled}
                inputRef={index === first ? control.ref : undefined}
              >
                {option.label}
              </Checkbox>
            ))}
          </AriaCheckboxGroup>
        );
      }}
    </Field>
  );
}
