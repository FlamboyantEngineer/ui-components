'use client';

import { useContext, useState, type ReactNode } from 'react';
import {
  Button as AriaButton,
  Link as AriaLink,
  PopoverContext,
  ProgressBar,
  TooltipTriggerStateContext,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, type IconSource } from '../icon/icon.js';
import { hasIcon, toIconProps } from '../icon/icon.js';
import { Shortcut, useDetectedPlatform } from '../shortcut/shortcut.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useButtonAction, type ButtonActionProps } from './button-action.js';
import {
  toAriaButtonProps,
  toAriaLinkProps,
  toKeyShortcuts,
  useButtonSelection,
  useInheritedDisabled,
  type ButtonStateProps,
} from './button-state.js';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'ghost'
  | 'accent'
  | 'chip'
  | 'link'
  | 'bare';

export type ButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

/** `label` wraps children in one label slot; `parts` lays them out directly; `sentence` lets a prose label wrap. */
export type ButtonContent = 'label' | 'parts' | 'sentence' | 'icon';

export type ButtonAlign = 'center' | 'start';

export interface ButtonProps extends ButtonStateProps, ButtonActionProps, BaseProps {
  /** Emphasis and chrome. Defaults to `secondary`. */
  variant?: ButtonVariant | undefined;
  /** Block size. Defaults to `md`. */
  size?: ButtonSize | undefined;
  /** The label, or the parts of the content with `content="parts"`. */
  children?: ReactNode;
  /** How the children are laid out. Defaults to `label`. */
  content?: ButtonContent | undefined;
  /** Where content sits on the button's width. Defaults to `center`. */
  align?: ButtonAlign | undefined;
  /** Shows an icon-only button. Name it with `label` or `aria-label`. `null` and `false` show none. */
  icon?: IconSource;
  /**
   * The accessible name of an icon-only button. Without an icon and without children it is the
   * button's visible label, so a control whose optional icon is absent stays named.
   */
  label?: string | undefined;
  /** An icon before the label. */
  startIcon?: IconSource;
  /** An icon after the label. */
  endIcon?: IconSource;
  /** Take the full width of the container. */
  fullWidth?: boolean | undefined;
  /**
   * A hint shown in a `Tooltip` on hover and keyboard focus. A natively disabled button cannot show
   * it; use `focusableWhenDisabled` to explain why a command is unavailable.
   */
  tooltip?: ReactNode;
}

interface ButtonSpinnerProps extends Pick<BaseProps, 'className'> {
  /** Names the busy indicator. Defaults to the provider's `loading` string. */
  label?: string | undefined;
}

/** What a button shows in its tooltip: the hint, then the keyboard shortcut. */
type ButtonHint = Pick<ButtonProps, 'tooltip' | 'shortcut'>;

type ButtonPartsProps = Pick<
  ButtonProps,
  'children' | 'content' | 'icon' | 'startIcon' | 'endIcon' | 'isPending' | 'pendingLabel'
> & {
  /** The label shown when there is neither an icon nor any children. */
  fallbackLabel?: string | undefined;
};

const hooks = createHooks('button', ['spinner', 'start-icon', 'label', 'end-icon', 'icon']);

/** The busy indicator of a pending button: an indeterminate progress bar React Aria announces. */
export function ButtonSpinner({ className, label }: ButtonSpinnerProps) {
  const strings = useUiStrings();
  return (
    <ProgressBar isIndeterminate aria-label={label ?? strings.loading} className={className} />
  );
}

/**
 * The icons around the label, and the spinner while pending. The icons and label stay while pending,
 * so the button keeps its size and its name; a stylesheet draws the spinner over them.
 */
function ButtonParts({
  children: given,
  fallbackLabel,
  content,
  icon,
  startIcon,
  endIcon,
  isPending,
  pendingLabel,
}: ButtonPartsProps) {
  const children = isEmptyNode(given) ? fallbackLabel : given;
  return (
    <>
      {isPending ? (
        <ButtonSpinner className={hooks.slotClass('spinner')} label={pendingLabel} />
      ) : null}
      {hasIcon(startIcon) ? (
        <Icon {...toIconProps(startIcon)} className={hooks.slotClass('start-icon')} />
      ) : null}
      {hasIcon(icon) ? (
        <Icon {...toIconProps(icon)} className={hooks.slotClass('icon')} />
      ) : content === 'parts' ? (
        children
      ) : (
        <span {...hooks.slot('label')}>{children}</span>
      )}
      {hasIcon(endIcon) ? (
        <Icon {...toIconProps(endIcon)} className={hooks.slotClass('end-icon')} />
      ) : null}
    </>
  );
}

/**
 * Whether the button sits in a caller's own hover trigger, a `Tooltip` or a `HoverCard`, which
 * hands the button its trigger props through React Aria's focusable context. A tooltip trigger of
 * the button's own would take that context over.
 */
function useInCallerTrigger(): boolean {
  const tooltip = useContext(TooltipTriggerStateContext);
  const popover = useContext(PopoverContext) as { trigger?: string } | null;
  return tooltip !== null || popover?.trigger === 'PreviewTrigger';
}

/**
 * Wraps a button in a `Tooltip` for its hint and shortcut, which follows the hint. A button without
 * either keeps the wrapper with the tooltip disabled, so a hint that comes or goes leaves the
 * element, its ref, its content and its focus in place. In a caller's own tooltip or hover card a
 * button without a hint is left unwrapped, so that trigger keeps working.
 */
function ButtonTooltip({ children, tooltip, shortcut }: ButtonHint & { children: ReactNode }) {
  const inCallerTrigger = useInCallerTrigger();
  // Held here, so a hint that goes while open closes its tooltip.
  const [isOpen, setOpen] = useState(false);
  const keys = shortcut && toKeyShortcuts(shortcut) ? <Shortcut chord={shortcut} /> : null;
  const hint = isEmptyNode(tooltip) ? null : tooltip;
  const isEmpty = hint === null && keys === null;
  if (isEmpty && inCallerTrigger) return children;
  const content = (
    <>
      {hint}
      {hint !== null && keys !== null ? ' ' : null}
      {keys}
    </>
  );
  return (
    <Tooltip
      content={content}
      isDisabled={isEmpty}
      isOpen={isOpen && !isEmpty}
      onOpenChange={setOpen}
    >
      {children}
    </Tooltip>
  );
}

/** The icon mode owns its accessible name and defaults, independently of action timing. */
function resolveButtonPresentation(
  props: Pick<
    ButtonProps,
    'icon' | 'label' | 'aria-label' | 'tooltip' | 'shortcut' | 'variant' | 'content'
  >,
) {
  const isIcon = hasIcon(props.icon);
  const name = props.label ?? props['aria-label'];
  if (isIcon && !name?.trim()) throw new Error('An icon-only Button requires a non-empty label.');
  const hint = props.tooltip ?? (isIcon && props.shortcut ? name : undefined);
  return {
    isIcon,
    name,
    hint,
    variant: props.variant ?? (isIcon ? 'ghost' : 'secondary'),
    content: isIcon ? 'icon' : props.content,
    isTooltipName: isIcon && hint === name && !props.shortcut,
  };
}

/** A labelled command button, or a link drawn as one with `href`. */
export function Button({
  variant,
  size = 'md',
  children,
  content = 'label',
  align = 'center',
  icon,
  label,
  startIcon,
  endIcon,
  fullWidth = false,
  tooltip,
  className,
  onError,
  pendingDelay,
  ...rest
}: ButtonProps) {
  const presentation = resolveButtonPresentation({
    ...rest,
    icon,
    label,
    tooltip,
    variant,
    content,
  });
  const own = { ...rest, isDisabled: useInheritedDisabled(rest) };
  const selection = useButtonSelection(own);
  const { isBusy, ...action } = useButtonAction({ ...own, ...selection, onError, pendingDelay });
  const platform = useDetectedPlatform();
  const options = { platform, isTooltipName: presentation.isTooltipName, isBusy };
  const isLink = rest.href !== undefined;
  const hookProps = hooks.root({
    className,
    props: rest,
    data: {
      variant: presentation.variant,
      size,
      content: presentation.content,
      align,
      selected: !isLink && selection.isSelected,
      fullWidth,
    },
  });
  const parts = (
    <ButtonParts
      content={content}
      fallbackLabel={presentation.isIcon ? undefined : label}
      icon={icon}
      startIcon={startIcon}
      endIcon={endIcon}
      isPending={!isLink && action.isPending}
      pendingLabel={rest.pendingLabel}
    >
      {children}
    </ButtonParts>
  );
  const element = isLink ? (
    <AriaLink
      {...toAriaLinkProps(rest, options)}
      {...hookProps}
      aria-label={presentation.isIcon ? presentation.name : rest['aria-label']}
    >
      {parts}
    </AriaLink>
  ) : (
    <AriaButton
      {...toAriaButtonProps({ ...own, ...selection, ...action }, options)}
      {...hookProps}
      aria-label={presentation.isIcon ? presentation.name : rest['aria-label']}
    >
      {parts}
    </AriaButton>
  );
  return (
    <ButtonTooltip tooltip={presentation.hint} shortcut={rest.shortcut}>
      {element}
    </ButtonTooltip>
  );
}

export type { ButtonRenderState } from './button-state.js';

export { usePendingAction } from './button-action.js';
export { ScrollStripButton } from './scroll-strip-button.js';

export { runPendingAction } from './pending-action.js';
