import type { ReactNode } from 'react';
import { Button as AriaButton, Link as AriaLink, ProgressBar } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { Shortcut } from '../shortcut/shortcut.js';
import { Tooltip } from '../tooltip/tooltip.js';
import {
  toAriaButtonProps,
  toAriaLinkProps,
  toKeyShortcuts,
  useButtonSelection,
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
export type ButtonContent = 'label' | 'parts' | 'sentence';

export type ButtonAlign = 'center' | 'start';

export interface ButtonProps extends ButtonStateProps, BaseProps {
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
  /** An icon before the label. Replaced by the spinner while pending. */
  startIcon?: IconSource;
  /** An icon after the label. Hidden while pending. */
  endIcon?: IconSource;
  /** Take the full width of the container. */
  fullWidth?: boolean | undefined;
  /**
   * A hint shown in a `Tooltip` on hover and keyboard focus. A natively disabled button cannot show
   * it; use `focusableWhenDisabled` to explain why a command is unavailable.
   */
  tooltip?: ReactNode;
}

export interface ButtonSpinnerProps extends Pick<BaseProps, 'className'> {
  /** Names the busy indicator. Defaults to the provider's `loading` string. */
  label?: string | undefined;
}

/** What a button shows in its tooltip: the hint, then the keyboard shortcut. */
type ButtonHint = Pick<ButtonProps, 'tooltip' | 'shortcut'>;

type ButtonPartsProps = Pick<
  ButtonProps,
  'children' | 'content' | 'startIcon' | 'endIcon' | 'isPending' | 'pendingLabel'
>;

const hooks = createHooks('button', ['spinner', 'start-icon', 'label', 'end-icon']);

/** The busy indicator of a pending button: an indeterminate progress bar React Aria announces. */
export function ButtonSpinner({ className, label }: ButtonSpinnerProps) {
  const strings = useUiStrings();
  return (
    <ProgressBar isIndeterminate aria-label={label ?? strings.loading} className={className} />
  );
}

/** The spinner while pending, else the icons, around the label. */
function ButtonParts({
  children,
  content,
  startIcon,
  endIcon,
  isPending,
  pendingLabel,
}: ButtonPartsProps) {
  return (
    <>
      {isPending ? (
        <ButtonSpinner className={hooks.slotClass('spinner')} label={pendingLabel} />
      ) : null}
      {!isPending && startIcon ? (
        <Icon {...toIconProps(startIcon)} className={hooks.slotClass('start-icon')} />
      ) : null}
      {content === 'parts' ? children : <span {...hooks.slot('label')}>{children}</span>}
      {!isPending && endIcon ? (
        <Icon {...toIconProps(endIcon)} className={hooks.slotClass('end-icon')} />
      ) : null}
    </>
  );
}

/** Wraps a button in a `Tooltip` when it has a hint or a shortcut, which follows the hint. */
export function withTooltip(button: ReactNode, { tooltip, shortcut }: ButtonHint) {
  const keys = shortcut && toKeyShortcuts(shortcut) ? <Shortcut chord={shortcut} /> : null;
  const hint = isEmptyHint(tooltip) ? null : tooltip;
  if (hint === null && keys === null) return button;
  const content = (
    <>
      {hint}
      {hint !== null && keys !== null ? ' ' : null}
      {keys}
    </>
  );
  return <Tooltip content={content}>{button}</Tooltip>;
}

function isEmptyHint(tooltip: ReactNode): boolean {
  return tooltip == null || tooltip === false || tooltip === '';
}

/** A labelled command button, or a link drawn as one with `href`. */
export function Button({
  variant = 'secondary',
  size = 'md',
  children,
  content = 'label',
  align = 'center',
  startIcon,
  endIcon,
  fullWidth = false,
  tooltip,
  className,
  ...rest
}: ButtonProps) {
  const selection = useButtonSelection(rest);
  const isLink = rest.href !== undefined;
  const hookProps = hooks.root({
    className,
    props: rest,
    data: { variant, size, content, align, selected: !isLink && selection.isSelected, fullWidth },
  });
  const parts = (
    <ButtonParts
      content={content}
      startIcon={startIcon}
      endIcon={endIcon}
      isPending={!isLink && rest.isPending}
      pendingLabel={rest.pendingLabel}
    >
      {children}
    </ButtonParts>
  );
  const element = isLink ? (
    <AriaLink {...toAriaLinkProps(rest)} {...hookProps}>
      {parts}
    </AriaLink>
  ) : (
    <AriaButton {...toAriaButtonProps({ ...rest, ...selection })} {...hookProps}>
      {parts}
    </AriaButton>
  );
  return withTooltip(element, { tooltip, shortcut: rest.shortcut });
}

export { toAriaButtonProps, toAriaLinkProps, useButtonSelection } from './button-state.js';
