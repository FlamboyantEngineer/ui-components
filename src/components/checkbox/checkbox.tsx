'use client';

import type { ReactNode, Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { CheckGlyph, MinusGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ControlSize, RefProps } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { Checkbox as AriaCheckbox } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useInputRef, useResetHeldValue } from '../../utils/use-reset-held-value.js';
import { type FieldValidationBehavior, useScopedDisabled } from '../field/field.js';

export interface CheckboxProps extends BaseProps, RefProps<HTMLLabelElement>, AriaLabellingProps {
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
  validationBehavior?: FieldValidationBehavior | undefined;
  /** Focuses the box when it mounts. */
  autoFocus?: boolean | undefined;
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
 * A tick box on a native checkbox input, with an optional visible label. A native form reset
 * applies once every listener has seen it, and never when one cancelled it.
 */
export function Checkbox({ children, size = 'md', className, ...rest }: CheckboxProps) {
  const isDisabled = useScopedDisabled(rest.isDisabled);
  const input = useInputRef(rest.inputRef);
  const held = useResetHeldValue({
    value: rest.isSelected,
    defaultValue: rest.defaultSelected ?? false,
    onChange: rest.onChange,
    ref: input.ref,
  });
  // A selection checkbox takes its state from the row, card or tree row it sits in.
  const selection =
    rest.slot === undefined ? { isSelected: held.value, onChange: held.onChange } : {};
  return (
    <AriaCheckbox
      {...rest}
      {...selection}
      defaultSelected={undefined}
      inputRef={input.setRef}
      isDisabled={isDisabled}
      {...hooks.root({ className, props: rest, data: { size } })}
    >
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
          {isEmptyNode(children) ? null : <span {...hooks.slot('label')}>{children}</span>}
        </>
      )}
    </AriaCheckbox>
  );
}

export { cycleCheckState } from './check-state.js';
