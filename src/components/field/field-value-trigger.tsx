'use client';

import { type ReactNode, useId } from 'react';
import type { HookProps } from '../../core/hooks.js';
import { Button as AriaButton } from '../../primitives/index.js';
import { toAriaControlProps } from './aria-control-props.js';
import type { FieldControlProps } from './field-parts.js';
import type { FieldState } from './field-state.js';

interface FieldValueTriggerProps {
  control: FieldControlProps;
  state: Pick<FieldState<unknown>, 'canClear' | 'clear'>;
  /** The component's own trigger hook, such as `hooks.slot('trigger')`. */
  hook: HookProps;
  /** The trigger's content, given the id of the element that shows the value. */
  children: (valueId: string) => ReactNode;
}

/**
 * The button of a field that shows its value and opens a picker. The field's label, then the value
 * the button shows, name it, and Backspace or Delete clears a value that may be cleared.
 */
export function FieldValueTrigger({ control, state, hook, children }: FieldValueTriggerProps) {
  const valueId = useId();
  const { ref, ...rest } = control;
  const aria = toAriaControlProps(rest);
  return (
    <AriaButton
      {...hook}
      id={aria.id}
      ref={ref}
      aria-label={aria['aria-label']}
      // A button takes no state props but the disabled one; it is named by the label, then its text.
      aria-labelledby={`${aria['aria-labelledby'] ?? aria.id} ${valueId}`}
      aria-describedby={aria['aria-describedby']}
      isDisabled={aria.isDisabled}
      onKeyDown={(event) => {
        if ((event.key === 'Backspace' || event.key === 'Delete') && state.canClear) state.clear();
        else event.continuePropagation();
      }}
    >
      {children(valueId)}
    </AriaButton>
  );
}
