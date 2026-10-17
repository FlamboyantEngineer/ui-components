import type { ReactNode } from 'react';
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';

export interface SwitchProps
  extends Omit<AriaSwitchProps, 'className' | 'style' | 'children' | 'render'>, BaseProps {
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
