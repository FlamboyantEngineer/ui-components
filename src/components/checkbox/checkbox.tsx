import type { ReactNode } from 'react';
import {
  Checkbox as AriaCheckbox,
  type CheckboxProps as AriaCheckboxProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';

export interface CheckboxProps
  extends Omit<AriaCheckboxProps, 'className' | 'style' | 'children' | 'render'>, BaseProps {
  /** The visible label. It names the checkbox, and pressing it toggles the box. */
  children?: ReactNode;
}

const hooks = createHooks('checkbox', ['box', 'glyph', 'label']);

/**
 * The state after a press of a three-state box: unset (`null`, drawn mixed) becomes ticked, ticked
 * becomes empty and empty becomes unset again.
 */
export function cycleCheckState(value: boolean | null): boolean | null {
  if (value === null) return true;
  return value ? false : null;
}

/** A tick box on a native checkbox input, with an optional visible label. */
export function Checkbox({ children, className, ...rest }: CheckboxProps) {
  return (
    <AriaCheckbox {...rest} {...hooks.root({ className, props: rest })}>
      {({ isSelected, isIndeterminate }) => (
        <>
          <span {...hooks.slot('box')} aria-hidden="true">
            {isIndeterminate || isSelected ? (
              <Glyph
                name={isIndeterminate ? 'minus' : 'check'}
                className={hooks.slotClass('glyph')}
              />
            ) : null}
          </span>
          {children ? <span {...hooks.slot('label')}>{children}</span> : null}
        </>
      )}
    </AriaCheckbox>
  );
}
