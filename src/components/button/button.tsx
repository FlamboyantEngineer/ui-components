import { isValidElement, type ReactNode, type Ref } from 'react';
import {
  Button as AriaButton,
  ProgressBar,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';

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

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/** `label` wraps children in one label slot; `parts` lays them out directly; `sentence` lets a prose label wrap. */
export type ButtonContent = 'label' | 'parts' | 'sentence';

export type ButtonAlign = 'center' | 'start';

export interface ButtonProps extends Omit<
  AriaButtonProps,
  'className' | 'style' | 'children' | 'render'
> {
  /** Emphasis and chrome. Defaults to `secondary`. */
  variant?: ButtonVariant | undefined;
  /** Block size. Defaults to `md`. */
  size?: ButtonSize | undefined;
  children?: ReactNode;
  content?: ButtonContent | undefined;
  /** Where content sits on the button's width. Defaults to `center`. */
  align?: ButtonAlign | undefined;
  /** A built-in glyph name or icon node before the label. Replaced by the spinner while pending. */
  startIcon?: GlyphName | ReactNode;
  /** A built-in glyph name or icon node after the label. Hidden while pending. */
  endIcon?: GlyphName | ReactNode;
  /**
   * The button is the current choice. Publishes `data-selected` and, unless the caller states toggle
   * semantics itself (`aria-pressed`, `aria-checked` or a `role`), `aria-pressed="true"`.
   */
  isSelected?: boolean | undefined;
  /** Names the busy indicator while pending. Defaults to the provider's `loading` string. */
  pendingLabel?: string | undefined;
  /** Keep a disabled button focusable, with `aria-disabled="true"`, refusing activation. */
  focusableWhenDisabled?: boolean | undefined;
  /** Take the full width of the container. */
  fullWidth?: boolean | undefined;
  role?: string | undefined;
  'aria-checked'?: boolean | 'true' | 'false' | 'mixed' | undefined;
  'aria-selected'?: boolean | 'true' | 'false' | undefined;
  className?: string | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('button', ['spinner', 'start-icon', 'label', 'end-icon']);

function isGlyphName(icon: unknown): icon is GlyphName {
  return typeof icon === 'string' && !isValidElement(icon);
}

/**
 * Attributes React Aria's Button does not forward (a `role` and its states) and the `data-disabled`
 * of a focusable disabled button, applied through its `render` hook.
 */
export function domPassThrough(
  attributes: {
    role?: string | undefined;
    'aria-checked'?: ButtonProps['aria-checked'];
    'aria-selected'?: ButtonProps['aria-selected'];
  },
  focusableDisabled: boolean,
): Pick<AriaButtonProps, 'render'> {
  const extra: Record<string, unknown> = Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined),
  );
  if (focusableDisabled) extra['data-disabled'] = 'true';
  if (Object.keys(extra).length === 0) return {};
  return { render: (props) => <button {...props} {...extra} /> };
}

/** The busy indicator of a pending button: an indeterminate progress bar React Aria announces. */
export function ButtonSpinner({
  className,
  label,
}: {
  className: string;
  label?: string | undefined;
}) {
  const strings = useUiStrings();
  return (
    <ProgressBar isIndeterminate aria-label={label ?? strings.loading} className={className} />
  );
}

/** Renders a glyph name or icon node as a decorative icon in a button slot. */
export function ButtonIcon({
  icon,
  className,
}: {
  icon: GlyphName | ReactNode;
  className: string;
}) {
  return isGlyphName(icon) ? (
    <Icon glyph={icon} className={className} />
  ) : (
    <Icon className={className}>{icon}</Icon>
  );
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
  isSelected = false,
  isDisabled = false,
  isPending = false,
  pendingLabel,
  focusableWhenDisabled = false,
  fullWidth = false,
  className,
  onPress,
  type = 'button',
  role,
  'aria-checked': ariaChecked,
  'aria-selected': ariaSelected,
  ...rest
}: ButtonProps) {
  const focusableDisabled = isDisabled && focusableWhenDisabled;
  const statesToggle =
    rest['aria-pressed'] !== undefined || ariaChecked !== undefined || role !== undefined;
  const label = content === 'parts' ? children : <span {...hooks.slot('label')}>{children}</span>;

  return (
    <AriaButton
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: {
          variant,
          size,
          content,
          align,
          selected: isSelected,
          fullWidth,
        },
      })}
      type={focusableDisabled ? 'button' : type}
      isDisabled={isDisabled && !focusableWhenDisabled}
      isPending={isPending}
      onPress={focusableDisabled ? undefined : onPress}
      {...(isSelected && !statesToggle ? { 'aria-pressed': true } : {})}
      {...(focusableDisabled ? { 'aria-disabled': true } : {})}
      {...domPassThrough(
        { role, 'aria-checked': ariaChecked, 'aria-selected': ariaSelected },
        focusableDisabled,
      )}
    >
      {isPending ? (
        <ButtonSpinner className={hooks.slotClass('spinner')} label={pendingLabel} />
      ) : null}
      {!isPending && startIcon ? (
        <ButtonIcon icon={startIcon} className={hooks.slotClass('start-icon')} />
      ) : null}
      {label}
      {!isPending && endIcon ? (
        <ButtonIcon icon={endIcon} className={hooks.slotClass('end-icon')} />
      ) : null}
    </AriaButton>
  );
}
