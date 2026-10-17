import type { ReactNode, RefObject } from 'react';
import {
  OverlayArrow,
  Tooltip as AriaTooltip,
  TooltipTrigger,
  type Placement,
  type TooltipTriggerComponentProps,
} from 'react-aria-components';
import { createHooks, splitDataAttributes, type DataAttributes } from '../../core/hooks.js';

export type TooltipVariant = 'default' | 'info';

export type TooltipPlacement = Placement;

/** Where a tooltip sits and how it keeps inside the viewport (React Aria's overlay positioning). */
export interface TooltipPositionProps {
  /** Preferred side of the trigger. Defaults to `top`; the tooltip flips when it does not fit. */
  placement?: TooltipPlacement | undefined;
  /** Gap from the trigger along the placement axis, in pixels. Defaults to 8, room for an arrow. */
  offset?: number | undefined;
  /** Shift along the cross axis, in pixels. */
  crossOffset?: number | undefined;
  /** Flip to the opposite side when the preferred side does not fit. Defaults to `true`. */
  shouldFlip?: boolean | undefined;
  /** Minimum distance kept from the viewport edge, in pixels. */
  containerPadding?: number | undefined;
}

export interface TooltipProps
  extends Omit<TooltipTriggerComponentProps, 'children'>, TooltipPositionProps {
  /** The hint. Plain text or inline content; never interactive. */
  content: ReactNode;
  /** The trigger: a React Aria focusable such as `Button`, `IconButton` or `Link`. */
  children: ReactNode;
  /** `default` for a hint on a control, `info` for a softer explanatory note. Defaults to `default`. */
  variant?: TooltipVariant | undefined;
  /** Class names for the tooltip panel. */
  className?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('tooltip', ['arrow', 'content']);

/** The hover delay before a tooltip opens, in milliseconds. */
export const TOOLTIP_DELAY = 500;

/** The gap between a tooltip and its trigger, in pixels. */
export const TOOLTIP_OFFSET = 8;

export interface TooltipPanelProps extends TooltipPositionProps {
  variant: TooltipVariant;
  children: ReactNode;
  className?: string | undefined;
  data?: DataAttributes | undefined;
  /** For a panel driven through `TooltipTriggerStateContext`: the element it is positioned against. */
  triggerRef?: RefObject<Element | null> | undefined;
}

/** The tooltip panel with its hooks; inside a `TooltipTrigger` or standalone with `triggerRef`. */
export function TooltipPanel({
  variant,
  children,
  className,
  data,
  placement = 'top',
  offset = TOOLTIP_OFFSET,
  ...props
}: TooltipPanelProps) {
  return (
    <AriaTooltip
      {...props}
      placement={placement}
      offset={offset}
      {...hooks.root({ className, props: data, data: { variant } })}
    >
      <OverlayArrow className={hooks.slotClass('arrow')} />
      <span {...hooks.slot('content')}>{children}</span>
    </AriaTooltip>
  );
}

/**
 * A short, non-interactive hint shown when its trigger is hovered (after `delay`) or keyboard
 * focused, and dismissed on leave, blur, press or Escape.
 */
export function Tooltip({
  content,
  children,
  variant = 'default',
  placement,
  offset,
  crossOffset,
  shouldFlip,
  containerPadding,
  className,
  delay = TOOLTIP_DELAY,
  ...rest
}: TooltipProps) {
  const [data, triggerProps] = splitDataAttributes(rest);
  return (
    <TooltipTrigger {...triggerProps} delay={delay}>
      {children}
      <TooltipPanel
        variant={variant}
        className={className}
        data={data}
        placement={placement}
        offset={offset}
        crossOffset={crossOffset}
        shouldFlip={shouldFlip}
        containerPadding={containerPadding}
      >
        {content}
      </TooltipPanel>
    </TooltipTrigger>
  );
}
