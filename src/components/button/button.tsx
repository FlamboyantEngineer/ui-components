'use client';

import { useContext, useState, type ComponentProps, type ReactNode } from 'react';
import {
  Button as AriaButton,
  FocusableContext,
  Link as AriaLink,
  ProgressBar,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ControlSize } from '../../core/props.js';
import { ExternalLinkGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, type IconSource } from '../icon/icon.js';
import { hasIcon, toIconProps } from '../icon/icon.js';
import { Shortcut, useDetectedPlatform } from '../shortcut/shortcut.js';
import type { LinkUnderline } from '../link/link.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { useButtonAction, type ButtonActionProps } from './button-action.js';
import { usePrimaryActionKeys } from './button-primary-keys.js';
import {
  toAriaButtonProps,
  toAriaLinkProps,
  toKeyShortcuts,
  useButtonSelection,
  useInheritedDisabled,
  type ButtonStateProps,
} from './button-state.js';

export type ButtonVariant =
  'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'accent' | 'chip' | 'link' | 'bare';

/** `label` wraps children in one label slot; `parts` lays them out directly; `sentence` lets a prose label wrap. */
export type ButtonContent = 'label' | 'parts' | 'sentence' | 'icon';

export type ButtonAlign = 'center' | 'start';

export interface ButtonProps extends ButtonStateProps, ButtonActionProps, BaseProps {
  /** Emphasis and chrome. Defaults to `secondary`. */
  variant?: ButtonVariant | undefined;
  /** Block size. Defaults to `md`. */
  size?: ControlSize | undefined;
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
  /**
   * An icon after the label. A link that opens a new tab shows the external-link glyph here unless
   * one is given; `null` or `false` shows none.
   */
  endIcon?: IconSource;
  /** A link button opens its destination in a new tab: `target="_blank"` unless `target` is given. */
  isExternal?: boolean | undefined;
  /** Take the full width of the container. */
  fullWidth?: boolean | undefined;
  /**
   * When the stylesheet underlines a `link` variant's text: `always`, on `hover` and keyboard
   * focus, or `none` (the default). Other variants never underline.
   */
  underline?: LinkUnderline | undefined;
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
  /** Says in hidden text that the link opens a new tab. */
  opensNewTab?: boolean | undefined;
};

const hooks = createHooks('button', [
  'spinner',
  'start-icon',
  'label',
  'end-icon',
  'icon',
  'new-tab-label',
]);

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
  opensNewTab = false,
}: ButtonPartsProps) {
  const strings = useUiStrings();
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
      {/* The space separates the label from the hidden text in the accessible name. */}
      {opensNewTab ? ' ' : null}
      {opensNewTab ? (
        <VisuallyHidden as="span" className={hooks.slotClass('new-tab-label')}>
          {strings.opensInNewTab}
        </VisuallyHidden>
      ) : null}
    </>
  );
}

/**
 * Wraps a button in a `Tooltip` for its hint and shortcut, which follows the hint. A button without
 * either keeps the wrapper with the tooltip disabled, so a hint that comes or goes leaves the
 * element, its ref, its content and its focus in place. In a caller's own tooltip or hover card the
 * `Tooltip` yields, hint or not, so that trigger keeps working.
 */
function ButtonTooltip({ children, tooltip, shortcut }: ButtonHint & { children: ReactNode }) {
  // Held here, so a hint that goes while open closes its tooltip.
  const [isOpen, setOpen] = useState(false);
  const keys = shortcut && toKeyShortcuts(shortcut) ? <Shortcut chord={shortcut} /> : null;
  const hint = isEmptyNode(tooltip) ? null : tooltip;
  const isEmpty = hint === null && keys === null;
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

/** The options a Button takes when the caller leaves them out; an icon-only button is `ghost`. */
export const buttonDefaults = { size: 'md', variant: 'secondary', iconVariant: 'ghost' } as const;

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
    variant: props.variant ?? (isIcon ? buttonDefaults.iconVariant : buttonDefaults.variant),
    content: isIcon ? 'icon' : props.content,
    isTooltipName: isIcon && hint === name && !props.shortcut,
  };
}

/**
 * A link button's target, its accessible name and whether it opens a new tab: then it shows the
 * external-link glyph after its label unless the caller gave an end icon, and says so in hidden
 * text, or in the name of an icon-only link.
 */
function useNewTab(
  props: Pick<ButtonProps, 'href' | 'target' | 'isExternal' | 'endIcon' | 'aria-label'>,
  { isDisabled, isIcon, name }: { isDisabled: boolean; isIcon: boolean; name?: string | undefined },
) {
  const strings = useUiStrings();
  const target = props.target ?? (props.isExternal ? '_blank' : undefined);
  const opensNewTab = props.href !== undefined && target === '_blank' && !isDisabled;
  const iconName = opensNewTab ? `${name} ${strings.opensInNewTab}` : name;
  return {
    target,
    endIcon:
      opensNewTab && !isIcon && props.endIcon === undefined ? ExternalLinkGlyph : props.endIcon,
    hasNewTabLabel: opensNewTab && !isIcon,
    ariaLabel: isIcon ? iconName : props['aria-label'],
  };
}

/** The root's data attributes: a link variant also says when its text is underlined. */
function toRootData(
  { variant, content }: { variant: ButtonVariant; content: ButtonContent | undefined },
  given: Required<Pick<ButtonProps, 'size' | 'align' | 'fullWidth' | 'underline'>>,
  isSelected: boolean | undefined,
) {
  const underline = variant === 'link' ? given.underline : undefined;
  return { ...given, variant, content, selected: isSelected, underline };
}

/**
 * React Aria's button drops its move handler while pending, but a tooltip or hover card around it
 * starts its hover on the first real move after keyboard use (`usePointerEntry`), so the trigger's
 * move handler is put back.
 */
function PointerMoveButton(props: ComponentProps<typeof AriaButton>) {
  const focusable = useContext(FocusableContext);
  const onPointerMove = props.isPending ? focusable?.onPointerMove : undefined;
  if (!onPointerMove) return <AriaButton {...props} />;
  const { render } = props;
  return (
    <AriaButton
      {...props}
      render={(dom, state) => {
        const restored = { ...dom, onPointerMove };
        return render ? render(restored, state) : <button {...restored} />;
      }}
    />
  );
}

/** A labelled command button, or a link drawn as one with `href`. */
export function Button({
  variant,
  size = buttonDefaults.size,
  children,
  content = 'label',
  align = 'center',
  icon,
  label,
  startIcon,
  endIcon,
  fullWidth = false,
  underline = 'none',
  tooltip,
  className,
  onError,
  pendingDelay,
  isExternal,
  ...given
}: ButtonProps) {
  const presentation = resolveButtonPresentation({
    ...given,
    icon,
    label,
    tooltip,
    variant,
    content,
  });
  const isDisabled = useInheritedDisabled(given);
  const newTab = useNewTab({ ...given, isExternal, endIcon }, { ...presentation, isDisabled });
  const rest = usePrimaryActionKeys({ ...given, target: newTab.target });
  const own = { ...rest, isDisabled };
  const selection = useButtonSelection(own);
  const { isBusy, ...action } = useButtonAction({ ...own, ...selection, onError, pendingDelay });
  const platform = useDetectedPlatform();
  const options = { platform, isTooltipName: presentation.isTooltipName, isBusy };
  const isLink = rest.href !== undefined;
  const hookProps = hooks.root({
    className,
    props: rest,
    data: toRootData(
      presentation,
      { size, align, fullWidth, underline },
      !isLink && selection.isSelected,
    ),
  });
  const parts = (
    <ButtonParts
      content={content}
      fallbackLabel={presentation.isIcon ? undefined : label}
      icon={icon}
      startIcon={startIcon}
      endIcon={newTab.endIcon}
      isPending={!isLink && action.isPending}
      pendingLabel={rest.pendingLabel}
      opensNewTab={newTab.hasNewTabLabel}
    >
      {children}
    </ButtonParts>
  );
  const element = isLink ? (
    <AriaLink {...toAriaLinkProps(rest, options)} {...hookProps} aria-label={newTab.ariaLabel}>
      {parts}
    </AriaLink>
  ) : (
    <PointerMoveButton
      {...toAriaButtonProps({ ...own, ...selection, ...action }, options)}
      {...hookProps}
      aria-label={newTab.ariaLabel}
    >
      {parts}
    </PointerMoveButton>
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
export { useInheritedDisabled } from './button-state.js';
