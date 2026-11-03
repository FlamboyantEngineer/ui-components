'use client';

import { useRef, type JSX } from 'react';
import { useTooltipTrigger } from '../../primitives/index.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { ManualTooltip, useManualTooltipState } from '../tooltip/tooltip.js';

type TimeWithTooltipProps = JSX.IntrinsicElements['time'] & {
  /** The tooltip's text. */
  tooltip: string;
  /** The tooltip panel's class. */
  tooltipClassName: string;
};

/**
 * A `<time>` element that takes focus and shows `tooltip` on hover and keyboard focus. React Aria's
 * tooltip trigger drives it directly: its `Focusable` expects an interactive role, which a
 * timestamp does not have.
 */
export function TimeWithTooltip({
  ref: callerRef,
  tooltip,
  tooltipClassName,
  ...rest
}: TimeWithTooltipProps) {
  const ref = useRef<HTMLTimeElement>(null);
  const timeRef = useMergedRefs(ref, callerRef);
  const state = useManualTooltipState();
  const { triggerProps, tooltipProps } = useTooltipTrigger({}, state, ref);
  return (
    <>
      <time {...rest} {...triggerProps} tabIndex={0} ref={timeRef} />
      <ManualTooltip
        state={state}
        triggerRef={ref}
        tooltipProps={tooltipProps}
        className={tooltipClassName}
      >
        {tooltip}
      </ManualTooltip>
    </>
  );
}
