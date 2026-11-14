'use client';

import { MinusGlyph, PlusGlyph } from '../../core/glyphs.js';
import type { HookProps } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button as AriaButton } from '../../primitives/index.js';

interface DecimalStepperProps {
  direction: 1 | -1;
  slot: HookProps;
  /** The input's id, which the button's id derives from. */
  controlId: string;
  /** The ids that name the field, read after the button's own name. */
  labelledBy?: string | undefined;
  isDisabled: boolean;
  onStep: () => void;
}

/**
 * A step button, outside the tab order as a spinbutton's buttons are: named `Increase` or
 * `Decrease` followed by the field's label.
 */
export function DecimalStepper({
  direction,
  slot,
  controlId,
  labelledBy,
  isDisabled,
  onStep,
}: DecimalStepperProps) {
  const strings = useUiStrings();
  const id = `${controlId}-${direction === 1 ? 'increment' : 'decrement'}`;
  return (
    <AriaButton
      {...slot}
      id={id}
      aria-label={direction === 1 ? strings.numberIncrease : strings.numberDecrease}
      aria-labelledby={`${id} ${labelledBy ?? controlId}`}
      isDisabled={isDisabled}
      excludeFromTabOrder
      onPress={onStep}
    >
      <Glyph icon={direction === 1 ? PlusGlyph : MinusGlyph} />
    </AriaButton>
  );
}
