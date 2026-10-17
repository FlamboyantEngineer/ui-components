import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  ProgressBar,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { Tooltip } from '../tooltip/tooltip.js';

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

export interface ButtonProps
  extends
    Omit<AriaButtonProps, 'className' | 'style' | 'children' | 'render'>,
    Pick<NativeProps<'button'>, 'ref' | 'role' | 'aria-checked' | 'aria-selected'>,
    BaseProps {
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
  /** The current choice: `data-selected`, and `aria-pressed` unless the caller states toggle semantics. */
  isSelected?: boolean | undefined;
  /** Names the busy indicator while pending. Defaults to the provider's `loading` string. */
  pendingLabel?: string | undefined;
  /** Keep a disabled button focusable, with `aria-disabled="true"`, refusing activation. */
  focusableWhenDisabled?: boolean | undefined;
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

/** The props of the states Button shares with IconButton. */
type ButtonStateProps = Omit<
  ButtonProps,
  | 'variant'
  | 'size'
  | 'children'
  | 'content'
  | 'align'
  | 'startIcon'
  | 'endIcon'
  | 'fullWidth'
  | 'tooltip'
>;

type ButtonPartsProps = Pick<
  ButtonProps,
  'children' | 'content' | 'startIcon' | 'endIcon' | 'isPending' | 'pendingLabel'
>;

const hooks = createHooks('button', ['spinner', 'start-icon', 'label', 'end-icon']);

/**
 * Applies what React Aria's Button does not forward (a `role` and its states) and the `data-disabled`
 * of a focusable disabled button, through its `render` hook.
 */
function renderPassThrough(
  attributes: Pick<ButtonProps, 'role' | 'aria-checked' | 'aria-selected'>,
  focusableDisabled: boolean,
): Pick<AriaButtonProps, 'render'> {
  const extra: Record<string, unknown> = Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined),
  );
  if (focusableDisabled) extra['data-disabled'] = 'true';
  if (Object.keys(extra).length === 0) return {};
  return { render: (props) => <button {...props} {...extra} /> };
}

/**
 * React Aria Button props for the states Button and IconButton share: a focusable disabled button
 * stays in the focus order but refuses activation and never submits, and `isSelected` adds
 * `aria-pressed` unless the caller states toggle semantics with `aria-pressed`, `aria-checked` or a
 * `role`.
 */
export function toAriaButtonProps({
  isSelected = false,
  isDisabled = false,
  focusableWhenDisabled = false,
  pendingLabel: _pendingLabel,
  type = 'button',
  onPress,
  role,
  'aria-checked': ariaChecked,
  'aria-selected': ariaSelected,
  ...rest
}: ButtonStateProps): AriaButtonProps & Pick<NativeProps<'button'>, 'ref'> {
  const focusableDisabled = isDisabled && focusableWhenDisabled;
  const statesToggle =
    rest['aria-pressed'] !== undefined || ariaChecked !== undefined || role !== undefined;
  return {
    ...rest,
    type: focusableDisabled ? 'button' : type,
    isDisabled: isDisabled && !focusableWhenDisabled,
    onPress: focusableDisabled ? undefined : onPress,
    ...(isSelected && !statesToggle ? { 'aria-pressed': true } : {}),
    ...(focusableDisabled ? { 'aria-disabled': true } : {}),
    ...renderPassThrough(
      { role, 'aria-checked': ariaChecked, 'aria-selected': ariaSelected },
      focusableDisabled,
    ),
  };
}

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

/** Wraps a button in a `Tooltip` when it has a hint. */
export function withTooltip(button: ReactNode, tooltip: ReactNode) {
  return isEmptyHint(tooltip) ? button : <Tooltip content={tooltip}>{button}</Tooltip>;
}

function isEmptyHint(tooltip: ReactNode): boolean {
  return tooltip == null || tooltip === false || tooltip === '';
}

/** A labelled command button. */
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
  return withTooltip(
    <AriaButton
      {...toAriaButtonProps(rest)}
      {...hooks.root({
        className,
        props: rest,
        data: { variant, size, content, align, selected: rest.isSelected, fullWidth },
      })}
    >
      <ButtonParts
        content={content}
        startIcon={startIcon}
        endIcon={endIcon}
        isPending={rest.isPending}
        pendingLabel={rest.pendingLabel}
      >
        {children}
      </ButtonParts>
    </AriaButton>,
    tooltip,
  );
}
