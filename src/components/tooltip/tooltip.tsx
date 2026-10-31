'use client';

import { cloneElement, isValidElement, type ReactNode, type RefObject } from 'react';
import { OverlayArrow, Tooltip as AriaTooltip, TooltipTrigger } from '../../primitives/index.js';
import type { OpenStateProps } from '../../core/events.js';
import { splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Placement } from '../../core/props.js';
import { useLayerZIndex } from '../portal/portal.js';
import { TOOLTIP_DELAY, TOOLTIP_OFFSET } from '../../utils/overlay-defaults.js';
import { tooltipHooks as hooks } from './tooltip-hooks.js';

export type TooltipVariant = 'default' | 'info';

export type TooltipPlacement = Placement;

/** `description` describes the trigger by the hint; `label` makes the hint the trigger's name. */
export type TooltipRelationship = 'description' | 'label';

/** Caller props for the panel. Its `id` belongs to React Aria, which describes the trigger by it. */
type TooltipPanelBaseProps = Omit<BaseProps, 'id'>;

/** What opens the tooltip: hover and keyboard focus, or keyboard focus only. */
export type TooltipTriggerType = 'hover' | 'focus';

export interface TooltipProps extends OpenStateProps, TooltipPanelBaseProps {
  /** The hint. Plain text or inline content; never interactive. */
  content: ReactNode;
  /** The trigger: a React Aria focusable such as `Button` or `Link`. */
  children: ReactNode;
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
  /** `default` for a hint on a control, `info` for a softer explanatory note. Defaults to `default`. */
  variant?: TooltipVariant | undefined;
  /** Preferred side of the trigger. Defaults to `top`; the tooltip flips when it does not fit. */
  placement?: TooltipPlacement | undefined;
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

/** The tooltip panel, inside a `TooltipTrigger` or driven through `TooltipTriggerStateContext`. */
interface TooltipPanelProps extends Pick<TooltipProps, 'placement'>, TooltipPanelBaseProps {
  /** The panel's look. */
  variant: TooltipVariant;
  /** The hint. */
  children: ReactNode;
  /** For a panel driven through `TooltipTriggerStateContext`: the element it is positioned against. */
  triggerRef?: RefObject<Element | null> | undefined;
}

/** The tooltip panel with its hooks; inside a `TooltipTrigger` or standalone with `triggerRef`. */
export function TooltipPanel({
  variant,
  children,
  className,
  placement = 'top',
  ...rest
}: TooltipPanelProps) {
  const zIndex = useLayerZIndex('tooltip');
  return (
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

/**
 * A short, non-interactive hint shown when its trigger is hovered (after `delay`) or keyboard
 * focused, and dismissed on leave, blur, press or Escape. With `relationship="label"` the hint is
 * the trigger's name instead of its description.
 */
export function Tooltip({
  content,
  children,
  variant = 'default',
  placement,
  className,
  delay = TOOLTIP_DELAY,
  relationship = 'description',
  ...rest
}: TooltipProps) {
  const [data, triggerProps] = splitDataAttributes(rest);
  const isLabel = relationship === 'label' && typeof content === 'string';
  return (
    <TooltipTrigger {...triggerProps} delay={delay}>
      {isLabel ? labelTrigger(children, content) : children}
      <TooltipPanel {...data} variant={variant} className={className} placement={placement}>
        {content}
      </TooltipPanel>
    </TooltipTrigger>
  );
}

export { AnchoredTooltip } from './anchored-tooltip.js';
export type {
  AnchoredTooltipProps,
  AnchoredTooltipRelationship,
  TooltipAnchor,
  TooltipRect,
  TooltipVirtualAnchor,
} from './anchored-tooltip.js';
export { ManualTooltip, useManualTooltipState } from './manual-tooltip.js';
export type { ManualTooltipState } from './manual-tooltip.js';
