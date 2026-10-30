import { CheckGlyph, MinusGlyph } from '../../core/glyphs.js';
import type { ReactNode, Ref } from 'react';
import { Checkbox as AriaCheckbox } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ControlSize } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';

export interface CheckboxProps extends BaseProps, AriaLabellingProps {
  /** Whether the box is ticked, controlled. */
  isSelected?: boolean | undefined;
  /** Whether the box starts ticked, uncontrolled. */
  defaultSelected?: boolean | undefined;
  /** Called with the new ticked state when the box is toggled. */
  onChange?: ((isSelected: boolean) => void) | undefined;
  /** Draws the mixed state, whatever the ticked state. */
  isIndeterminate?: boolean | undefined;
  /** The form name the box submits `value` under while ticked. */
  name?: string | undefined;
  /** The value submitted while ticked. Defaults to `on`. */
  value?: string | undefined;
  isRequired?: boolean | undefined;
  isInvalid?: boolean | undefined;
  /** Keeps the state and reports no change. */
  isReadOnly?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** `native` (the default) makes a required box a native constraint; `aria` reports through ARIA only. */
  validationBehavior?: 'aria' | 'native' | undefined;
  /** Receives the native input. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** `selection` binds the box to the selection of the list row, tree row or card it sits in. */
  slot?: 'selection' | undefined;
  /** The row's height on the shared control scale, which sizes the box and label. Defaults to `md`. */
  size?: ControlSize | undefined;
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
export function Checkbox({ children, size = 'md', className, ...rest }: CheckboxProps) {
  return (
    <AriaCheckbox {...rest} {...hooks.root({ className, props: rest, data: { size } })}>
      {({ isSelected, isIndeterminate }) => (
        <>
          <span {...hooks.slot('box')} aria-hidden="true">
            {isIndeterminate || isSelected ? (
              <Glyph
                icon={isIndeterminate ? MinusGlyph : CheckGlyph}
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
