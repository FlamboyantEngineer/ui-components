'use client';

import { cloneElement, type ComponentProps, isValidElement, type ReactNode } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps } from '../../core/events.js';
import { splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Placement, RefProps } from '../../core/props.js';
import {
  Focusable,
  OverlayArrow,
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
} from '../../primitives/index.js';
import { TOOLTIP_DELAY, TOOLTIP_OFFSET } from '../../utils/overlay-defaults.js';
import { useCloseWhenLocked } from '../../utils/use-close-when-locked.js';
import { PointerEntry } from '../../utils/use-pointer-entry.js';
import { useLayerZIndex } from '../portal/portal.js';
import { useInCallerTrigger } from './caller-trigger.js';
import { TooltipEscape } from './tooltip-escape.js';
import { tooltipHooks as hooks } from './tooltip-hooks.js';
import { TooltipScrollGuard } from './tooltip-scroll-guard.js';

export type TooltipVariant = 'default' | 'info';

export type TooltipPlacement = Placement;

/** `description` describes the trigger by the hint; `label` makes the hint the trigger's name. */
export type TooltipRelationship = 'description' | 'label';

/** Caller props for the panel. Its `id` belongs to React Aria, which describes the trigger by it. */
type TooltipPanelBaseProps = Omit<BaseProps, 'id'>;

/** What opens the tooltip: hover and keyboard focus, or keyboard focus only. */
export type TooltipTriggerType = 'hover' | 'focus';

export interface TooltipTriggerProps extends OpenStateProps {
  /** One focusable element followed by its `TooltipContent`. */
  children: [trigger: ReactNode, content: ReactNode];
  /** Milliseconds the pointer rests on the trigger before the hint opens. Defaults to 500. */
  delay?: number | undefined;
  /** Milliseconds after the pointer leaves before the hint closes. Defaults to 500. */
  closeDelay?: number | undefined;
  /** `focus` opens the hint on keyboard focus only. Defaults to hover and focus. */
  trigger?: TooltipTriggerType | undefined;
  /** Never opens the hint. */
  isDisabled?: boolean | undefined;
  /** Whether pressing the trigger closes the hint. Defaults to true. */
  shouldCloseOnPress?: boolean | undefined;
}

export interface TooltipContentProps extends TooltipPanelBaseProps, RefProps<HTMLDivElement> {
  /** The hint. Plain text or inline content; never interactive. */
  children: ReactNode;
  /** `default` for a hint on a control, `info` for a softer explanatory note. Defaults to `default`. */
  variant?: TooltipVariant | undefined;
  /** Preferred side of the trigger. Defaults to `top`; the tooltip flips when it does not fit. */
  placement?: TooltipPlacement | undefined;
}

export interface TooltipProps
  extends Omit<TooltipTriggerProps, 'children'>, Omit<TooltipContentProps, 'children' | 'ref'> {
  /** The hint. Plain text or inline content; never interactive. */
  content: ReactNode;
  /** The focusable trigger, such as a `Button` or `Link`. */
  children: ReactNode;
  /**
   * `description` (the default) describes the trigger by the open hint. `label` makes string
   * content the trigger's accessible name, open or not, as for an icon-only control.
   */
  relationship?: TooltipRelationship | undefined;
}

/** The naming props a labelled trigger receives. */
interface TriggerLabelProps {
  'aria-label'?: string | undefined;
  'aria-describedby'?: string | undefined;
}

/** Renders a hint portalled from its `TooltipTrigger`. */
export function TooltipContent({
  variant = 'default',
  children,
  className,
  placement = 'top',
  ...rest
}: TooltipContentProps) {
  const zIndex = useLayerZIndex('tooltip');
  return (
    <TooltipScrollGuard>
      <AriaTooltip
        {...rest}
        placement={placement}
        offset={TOOLTIP_OFFSET}
        {...hooks.root({ className, data: { variant, layer: 'tooltip' } })}
        style={{ zIndex }}
      >
        <OverlayArrow className={hooks.slotClass('arrow')} />
        <span {...hooks.slot('content')}>{children}</span>
      </AriaTooltip>
    </TooltipScrollGuard>
  );
}

/**
 * Names the trigger element by `label`. React Aria describes the trigger by the open panel; here
 * the panel repeats the name, so an empty `aria-describedby`, which wins over React Aria's, keeps it
 * from being read twice. A trigger's own name and description still win.
 */
function labelTrigger(children: ReactNode, label: string): ReactNode {
  if (!isValidElement<TriggerLabelProps>(children)) return children;
  return cloneElement(children, {
    'aria-label': children.props['aria-label'] ?? label,
    'aria-describedby': children.props['aria-describedby'] ?? '',
  });
}

/** Opens the adjacent tooltip for a focusable child without adding a wrapper element. */
export function TooltipTrigger({
  children: [trigger, content],
  delay = TOOLTIP_DELAY,
  isDisabled = false,
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  ...rest
}: TooltipTriggerProps) {
  const [isOpen, setOpen] = useControllableState(isOpenProp, defaultOpen, onOpenChange);
  // Close an open disabled hint once so it stays closed when it is enabled again.
  useCloseWhenLocked(isOpen, isDisabled, () => setOpen(false));
  const inCallerTrigger = useInCallerTrigger();
  const focusable =
    isValidElement(trigger) && typeof trigger.type === 'string' ? (
      <Focusable>{trigger as ComponentProps<typeof Focusable>['children']}</Focusable>
    ) : (
      trigger
    );
  if (inCallerTrigger) return focusable;
  return (
    <AriaTooltipTrigger
      {...rest}
      delay={delay}
      isDisabled={isDisabled}
      isOpen={isOpen && !isDisabled}
      onOpenChange={setOpen}
    >
      <TooltipEscape />
      <PointerEntry isDisabled={isDisabled}>{focusable}</PointerEntry>
      {content}
    </AriaTooltipTrigger>
  );
}

/** A hint shown on hover or keyboard focus, with an optional accessible label for the trigger. */
export function Tooltip({
  content,
  children,
  variant,
  placement,
  className,
  relationship = 'description',
  ...rest
}: TooltipProps) {
  const isLabel = relationship === 'label' && typeof content === 'string';
  const trigger = isLabel ? labelTrigger(children, content) : children;
  const [data, triggerProps] = splitDataAttributes(rest);
  return (
    <TooltipTrigger {...triggerProps}>
      {trigger}
      <TooltipContent {...data} variant={variant} className={className} placement={placement}>
        {content}
      </TooltipContent>
    </TooltipTrigger>
  );
}

export type {
  AnchoredTooltipProps,
  AnchoredTooltipRelationship,
  TooltipAnchor,
  TooltipRect,
  TooltipVirtualAnchor,
} from './anchored-tooltip.js';
export { AnchoredTooltip } from './anchored-tooltip.js';
export type { ManualTooltipState } from './manual-tooltip.js';
export { ManualTooltip, useManualTooltipState } from './manual-tooltip.js';
export type { TruncationTooltipProps } from './truncation-tooltip.js';
export { TruncationTooltip } from './truncation-tooltip.js';
