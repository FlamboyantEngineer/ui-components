import { useLayoutEffect, useRef, type ReactNode, type Ref } from 'react';
import {
  RadioButton,
  RadioField,
  RadioGroup as AriaRadioGroup,
  Text,
} from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Orientation, Size } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
import type { SlotRef } from '../../utils/slot-registry.js';
import {
  Field,
  toAriaControlProps,
  useFieldControl,
  type FieldControlProps,
  type FieldInputProps,
  type FieldState,
} from '../field/field.js';

export type RadioGroupSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface RadioGroupProps extends FieldInputProps<string | null> {
  /** The radios, in order: `Radio` elements. */
  children: ReactNode;
  /** Lays the radios out in a column or a row. Defaults to `vertical`. */
  orientation?: Orientation | undefined;
  /** Radio size. Defaults to `md`. */
  size?: RadioGroupSize | undefined;
}

/** The states a radio hands its `render` function, which its root publishes as data attributes. */
export interface RadioRenderState {
  isSelected: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInvalid: boolean;
  isRequired: boolean;
}

export interface RadioProps extends BaseProps, AriaLabellingProps {
  /** The value the group takes when this radio is selected, and submits under its `name`. */
  value: string;
  isDisabled?: boolean | undefined;
  /** Receives the native input. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** The visible label, plain or rich content. It names the radio, and pressing it selects it. */
  children?: ReactNode;
  /** Text below the label that describes the radio. */
  description?: ReactNode;
  /** Replaces the root `<div>` with the caller's element. */
  render?: ElementRender<'div', RadioRenderState> | undefined;
}

interface RadioBoxProps {
  state: FieldState<string | null>;
  control: FieldControlProps;
  rest: Pick<RadioGroupProps, 'name' | 'orientation'>;
  children: ReactNode;
}

const hooks = createHooks('radio-group', ['box']);
const radioHooks = createHooks('radio', ['button', 'indicator', 'label', 'description']);

/**
 * Publishes the field's control: the selected radio's input, else the first enabled one, which is
 * where Tab enters the group. Radios are any descendants, so the group finds their inputs the way
 * React Aria's arrow keys do, in document order. A value set from outside the radios (restore,
 * undo, a menu action) while focus is in the group takes focus to the newly selected radio.
 */
function useRadioControl(publish: SlotRef, value: string | null) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const inputs = box.current?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? [];
    const enabled = [...inputs].filter((input) => !input.disabled);
    publish(enabled.find((input) => input.checked) ?? enabled[0] ?? null);
  });
  useLayoutEffect(() => {
    const element = box.current;
    const selected = element?.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    const active = element?.ownerDocument.activeElement;
    if (selected && active !== selected && element?.contains(active ?? null)) selected.focus();
  }, [value]);
  return box;
}

function RadioBox({ state, control, rest, children }: RadioBoxProps) {
  const box = useRadioControl(control.ref, state.value);
  return (
    <AriaRadioGroup
      {...rest}
      {...toAriaControlProps(control)}
      {...hooks.slot('box')}
      ref={box}
      value={state.value}
      onChange={(value) => {
        state.setValue(value);
        state.commit();
      }}
    >
      {children}
    </AriaRadioGroup>
  );
}

/**
 * A field for one value picked from a list of radios, on React Aria's `RadioGroup`, with the field's
 * label, description, validation, dirty state, undo and menu. Each pick commits.
 */
export function RadioGroup({ children, size = 'md', ...props }: RadioGroupProps) {
  const { state, field, rest } = useFieldControl(props, { initialValue: null, emptyValue: null });
  return (
    <Field {...field} {...hooks.root({ className: field.className, data: { size } })} state={state}>
      {(control) => (
        <RadioBox state={state} control={control} rest={rest}>
          {children}
        </RadioBox>
      )}
    </Field>
  );
}

/**
 * One radio of a `RadioGroup`, on React Aria's `RadioField` and `RadioButton`: a native radio input,
 * visually hidden but focusable, inside a `<label>` with a drawn indicator and the label, and an
 * optional description that describes the input.
 */
export function Radio({ children, description, className, ...rest }: RadioProps) {
  return (
    <RadioField {...rest} {...radioHooks.root({ className, props: rest })}>
      <RadioButton {...radioHooks.slot('button')}>
        <span {...radioHooks.slot('indicator')} aria-hidden="true" />
        {children ? <span {...radioHooks.slot('label')}>{children}</span> : null}
      </RadioButton>
      {description ? (
        <Text slot="description" {...radioHooks.slot('description')}>
          {description}
        </Text>
      ) : null}
    </RadioField>
  );
}
