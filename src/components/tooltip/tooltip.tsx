import { cloneElement, isValidElement, type ReactNode, type RefObject } from 'react';
import {
  OverlayArrow,
  Tooltip as AriaTooltip,
  TooltipTrigger,
  type Placement,
  type TooltipTriggerComponentProps,
} from '../../primitives/index.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';

export type TooltipVariant = 'default' | 'info';

export type TooltipPlacement = Placement;

/** `description` describes the trigger by the hint; `label` makes the hint the trigger's name. */
export type TooltipRelationship = 'description' | 'label';

/** Caller props for the panel. Its `id` belongs to React Aria, which describes the trigger by it. */
type TooltipPanelBaseProps = Omit<BaseProps, 'id'>;

export interface TooltipProps
  extends Omit<TooltipTriggerComponentProps, 'children'>, TooltipPanelBaseProps {
  /** The hint. Plain text or inline content; never interactive. */
  content: ReactNode;
  /** The trigger: a React Aria focusable such as `Button`, `IconButton` or `Link`. */
  children: ReactNode;
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
export interface TooltipPanelProps extends Pick<TooltipProps, 'placement'>, TooltipPanelBaseProps {
  /** The panel's look. */
  variant: TooltipVariant;
  /** The hint. */
  children: ReactNode;
  /** For a panel driven through `TooltipTriggerStateContext`: the element it is positioned against. */
  triggerRef?: RefObject<Element | null> | undefined;
}

/** The hover delay before a tooltip opens, in milliseconds. */
export const TOOLTIP_DELAY = 500;

const hooks = createHooks('tooltip', ['arrow', 'content']);

/** The gap between the panel and its trigger, room for the arrow, in pixels. */
const tooltipOffset = 8;

/** The tooltip panel with its hooks; inside a `TooltipTrigger` or standalone with `triggerRef`. */
export function TooltipPanel({
  variant,
  children,
  className,
  placement = 'top',
  ...rest
}: TooltipPanelProps) {
  return (
    <AriaTooltip
      {...rest}
      placement={placement}
      offset={tooltipOffset}
      {...hooks.root({ className, data: { variant } })}
    >
      <OverlayArrow className={hooks.slotClass('arrow')} />
      <span {...hooks.slot('content')}>{children}</span>
    </AriaTooltip>
  );
}

/**
 * Names the trigger element by `label`. React Aria describes the trigger by the open panel; here
 * the panel repeats the name, so an empty `aria-describedby`, which wins over React Aria's, keeps it
 * from being read twice. A trigger's own description still wins.
 */
function labelTrigger(children: ReactNode, label: string): ReactNode {
  if (!isValidElement<TriggerLabelProps>(children)) return children;
  return cloneElement(children, {
    'aria-label': label,
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
