'use client';

import type { ReactNode, Ref } from 'react';
import { Switch as AriaSwitch } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ControlSize } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useInputRef, useResetHeldValue } from '../../utils/use-reset-held-value.js';
import type { FieldValidationBehavior } from '../field/field.js';
import { useScopedDisabled } from '../field/field.js';

export interface SwitchProps extends BaseProps, AriaLabellingProps {
  /** Whether the switch is on, controlled. */
  isSelected?: boolean | undefined;
  /** Whether the switch starts on, uncontrolled. */
  defaultSelected?: boolean | undefined;
  /** Called with the new state when the switch is flipped. */
  onChange?: ((isSelected: boolean) => void) | undefined;
  /** The form name the switch submits `value` under while on. */
  name?: string | undefined;
  /** The value submitted while on. Defaults to `on`. */
  value?: string | undefined;
  /** Draws neither state: the thumb sits in the middle, as for an unset value. */
  isIndeterminate?: boolean | undefined;
  isRequired?: boolean | undefined;
  isInvalid?: boolean | undefined;
  /** Keeps the state and reports no change. */
  isReadOnly?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** `native` (the default) makes a required switch a native constraint; `aria` reports through ARIA only. */
  validationBehavior?: FieldValidationBehavior | undefined;
  /** Focuses the switch when it mounts. */
  autoFocus?: boolean | undefined;
  /** Receives the native input. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** The row's height on the shared control scale, which sizes the track, thumb and label. Defaults to `md`. */
  size?: ControlSize | undefined;
  /** The visible label. It names the switch, and pressing it flips the switch. */
  children?: ReactNode;
}

const hooks = createHooks('switch', ['track', 'thumb', 'label']);

/**
 * An on-off switch on React Aria's `Switch`, with no field around it: a native input with role
 * `switch` inside a `<label>`, a track and thumb, and an optional visible label.
 */
export function Switch({
  children,
  size = 'md',
  isIndeterminate = false,
  className,
  ...rest
}: SwitchProps) {
  const isDisabled = useScopedDisabled(rest.isDisabled);
  const input = useInputRef(rest.inputRef);
  const held = useResetHeldValue({
    value: rest.isSelected,
    defaultValue: rest.defaultSelected ?? false,
    onChange: rest.onChange,
    ref: input.ref,
  });
  return (
    <AriaSwitch
      {...rest}
      isSelected={held.value}
      defaultSelected={undefined}
      onChange={held.onChange}
      inputRef={input.setRef}
      isDisabled={isDisabled}
      {...hooks.root({ className, props: rest, data: { size, indeterminate: isIndeterminate } })}
    >
      <span {...hooks.slot('track')} aria-hidden="true">
        <span {...hooks.slot('thumb')} />
      </span>
      {isEmptyNode(children) ? null : <span {...hooks.slot('label')}>{children}</span>}
    </AriaSwitch>
  );
}
