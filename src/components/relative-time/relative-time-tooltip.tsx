'use client';

import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import {
  TooltipContext,
  TooltipTriggerStateContext,
  useTooltipTrigger,
  type TooltipTriggerState,
} from '../../primitives/index.js';
import { TooltipPanel } from '../tooltip/tooltip.js';
import { TOOLTIP_DELAY } from '../../utils/overlay-defaults.js';

type TimeWithTooltipProps = JSX.IntrinsicElements['time'] & {
  /** The tooltip's text. */
  tooltip: string;
  /** The tooltip panel's class. */
  tooltipClassName: string;
};

/** Tooltip state that opens `TOOLTIP_DELAY` milliseconds after a hover, or at once on focus. */
function useTooltipState(): TooltipTriggerState {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isOpen, setOpen] = useState(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  return useMemo(
    () => ({
      isOpen,
      shouldSkipAnimation: false,
      open: (immediate?: boolean) => {
        clearTimeout(timer.current);
        if (immediate) setOpen(true);
        else timer.current = setTimeout(() => setOpen(true), TOOLTIP_DELAY);
      },
      close: () => {
        clearTimeout(timer.current);
        setOpen(false);
      },
    }),
    [isOpen],
  );
}

/**
 * A `<time>` element that takes focus and shows `tooltip` on hover and keyboard focus. React Aria's
 * tooltip trigger drives it directly: its `Focusable` expects an interactive role, which a
 * timestamp does not have.
 */
export function TimeWithTooltip({ tooltip, tooltipClassName, ...rest }: TimeWithTooltipProps) {
  const ref = useRef<HTMLTimeElement>(null);
  const state = useTooltipState();
  const { triggerProps, tooltipProps } = useTooltipTrigger({}, state, ref);
  return (
    <>
      <time {...rest} {...triggerProps} tabIndex={0} ref={ref} />
      <TooltipContext value={{ ...tooltipProps, triggerRef: ref }}>
        <TooltipTriggerStateContext value={state}>
          <TooltipPanel variant="default" className={tooltipClassName}>
            {tooltip}
          </TooltipPanel>
        </TooltipTriggerStateContext>
      </TooltipContext>
    </>
  );
}
