import type { ReactNode, Ref } from 'react';
import { Switch as AriaSwitch } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';

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
  /** Keeps the state and reports no change. */
  isReadOnly?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** Focuses the switch when it mounts. */
  autoFocus?: boolean | undefined;
  /** Receives the native input. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** The visible label. It names the switch, and pressing it flips the switch. */
  children?: ReactNode;
}

const hooks = createHooks('switch', ['track', 'thumb', 'label']);

/**
 * An on-off switch on React Aria's `Switch`, with no field around it: a native input with role
 * `switch` inside a `<label>`, a track and thumb, and an optional visible label.
 */
export function Switch({ children, className, ...rest }: SwitchProps) {
  return (
    <AriaSwitch {...rest} {...hooks.root({ className, props: rest })}>
      <span {...hooks.slot('track')} aria-hidden="true">
        <span {...hooks.slot('thumb')} />
      </span>
      {children ? <span {...hooks.slot('label')}>{children}</span> : null}
    </AriaSwitch>
  );
}
