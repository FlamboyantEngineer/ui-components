'use client';

// The hint of a picker option that names one: shown beside its row while the row is hovered, after
// the tooltip delay, or at once while it has keyboard focus.

import { type ReactNode, useEffect } from 'react';
import type { SelectableState } from '../../core/props.js';
import { AnchoredTooltip, useManualTooltipState } from '../tooltip/tooltip.js';

/** How a row asks for its hint: at once for keyboard focus, after the delay for a pointer. */
function toRequest(state: SelectableState): 'focus' | 'hover' | null {
  if (state.isFocusVisible) return 'focus';
  return state.isHovered ? 'hover' : null;
}

/** An option row's hint, positioned against the row and describing it while open. */
export function PickerOptionTooltip({
  anchor,
  content,
  state,
}: {
  /** The option's row. */
  anchor: Element | null;
  content: ReactNode;
  state: SelectableState;
}) {
  const { isOpen, open, close } = useManualTooltipState();
  const request = toRequest(state);
  useEffect(() => {
    if (request === 'focus') open(true);
    else if (request === 'hover') open();
    else close();
  }, [request, open, close]);
  return <AnchoredTooltip isOpen={isOpen} anchor={anchor} content={content} placement="end" />;
}
