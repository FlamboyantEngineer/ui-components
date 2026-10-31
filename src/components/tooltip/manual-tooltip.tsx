'use client';

// A tooltip whose opening a component drives itself, for a trigger React Aria's `TooltipTrigger`
// cannot wrap: a timestamp, or text that shows a tooltip only while it is cut short.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { TooltipContext, TooltipTriggerStateContext } from '../../primitives/index.js';
import { TOOLTIP_DELAY } from '../../utils/overlay-defaults.js';
import { useLatest } from '../../utils/use-latest.js';
import { TooltipPanel, type TooltipPlacement } from './tooltip.js';

/** The state of a manually driven tooltip, shaped as React Aria's tooltip trigger state. */
export interface ManualTooltipState {
  isOpen: boolean;
  shouldSkipAnimation: boolean;
  /** Opens at once with `immediate`, else after `TOOLTIP_DELAY`. */
  open: (immediate?: boolean) => void;
  close: () => void;
  /** Opens after `delay` milliseconds, cancelling an opening already scheduled. */
  schedule: (delay: number) => void;
}

/**
 * Tooltip trigger state: `open(true)` opens at once (keyboard focus), `open()` after
 * `TOOLTIP_DELAY` (hover), as React Aria's trigger calls it; `close` cancels a scheduled opening.
 * With `canOpen`, an opening happens only while it returns true, checked when the tooltip would show.
 */
export function useManualTooltipState(canOpen?: () => boolean): ManualTooltipState {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isOpen, setOpen] = useState(false);
  const allows = useLatest(canOpen);
  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const show = useCallback(() => {
    cancel();
    if (allows.current?.() ?? true) setOpen(true);
  }, [cancel, allows]);
  const schedule = useCallback(
    (delay: number) => {
      cancel();
      timer.current = setTimeout(show, delay);
    },
    [cancel, show],
  );
  const open = useCallback(
    (immediate?: boolean) => (immediate ? show() : schedule(TOOLTIP_DELAY)),
    [show, schedule],
  );
  const close = useCallback(() => {
    cancel();
    setOpen(false);
  }, [cancel]);
  useEffect(() => cancel, [cancel]);
  return useMemo(
    () => ({ isOpen, shouldSkipAnimation: false, open, close, schedule }),
    [isOpen, open, close, schedule],
  );
}

interface ManualTooltipProps {
  state: ManualTooltipState;
  /** The element the panel is positioned against. */
  triggerRef: RefObject<Element | null>;
  /**
   * The panel props React Aria's `useTooltipTrigger` returned, which tie the panel to its trigger;
   * without them the panel is isolated from any enclosing tooltip trigger and only shows.
   */
  tooltipProps?: object | undefined;
  className: string;
  placement?: TooltipPlacement | undefined;
  children: ReactNode;
}

/** The default-variant panel of a manually driven tooltip. */
export function ManualTooltip({
  state,
  triggerRef,
  tooltipProps,
  className,
  placement,
  children,
}: ManualTooltipProps) {
  const context = useMemo(
    () => (tooltipProps ? { ...tooltipProps, triggerRef } : null),
    [tooltipProps, triggerRef],
  );
  return (
    <TooltipContext value={context}>
      <TooltipTriggerStateContext value={state}>
        <TooltipPanel
          variant="default"
          className={className}
          triggerRef={triggerRef}
          placement={placement}
        >
          {children}
        </TooltipPanel>
      </TooltipTriggerStateContext>
    </TooltipContext>
  );
}
