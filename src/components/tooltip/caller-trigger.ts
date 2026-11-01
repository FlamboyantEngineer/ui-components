'use client';

// Whether a trigger sits inside a hover trigger the caller already owns.

import { useContext } from 'react';
import { PopoverContext, TooltipTriggerStateContext } from '../../primitives/index.js';

/**
 * Whether the element sits in a caller's own hover trigger, a `Tooltip` or a `HoverCard`, which
 * hands its trigger props through React Aria's focusable context. A trigger of the element's own
 * would replace that context, and the caller's trigger would never open, so the inner one yields.
 * A hover card's content clears the context, so controls inside the card keep their own hints.
 */
export function useInCallerTrigger(): boolean {
  const tooltip = useContext(TooltipTriggerStateContext);
  const popover = useContext(PopoverContext) as { trigger?: string } | null;
  return tooltip !== null || popover?.trigger === 'PreviewTrigger';
}
