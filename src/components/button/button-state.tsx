import type { JSX, ReactElement, Ref } from 'react';
import type {
  ButtonProps as AriaButtonProps,
  ButtonRenderProps,
  LinkProps as AriaLinkProps,
  PressEvent,
} from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { NativeProps } from '../../core/props.js';
import { UiLink } from '../../core/provider.js';
import { formatAriaKeyShortcuts, type ShortcutChord } from '../shortcut/shortcut.js';

/** The states and pass-through props Button and IconButton share. */
export interface ButtonStateProps
  extends
    Omit<AriaButtonProps, 'className' | 'style' | 'children'>,
    Pick<NativeProps<'button'>, 'role' | 'aria-checked' | 'aria-selected'> {
  /** The `<button>`, or the `<a>` of a button with `href`. */
  ref?: Ref<HTMLButtonElement | HTMLAnchorElement> | undefined;
  /** The current choice: `data-selected`, and `aria-pressed` unless the caller states toggle semantics. */
  isSelected?: boolean | undefined;
  /** The initial state of a toggle button, which a press then flips. Makes the button a toggle. */
  defaultSelected?: boolean | undefined;
  /** Receives a toggle button's new state on every press. Makes the button a toggle. */
  onChange?: ((isSelected: boolean) => void) | undefined;
  /** Names the busy indicator while pending. Defaults to the provider's `loading` string. */
  pendingLabel?: string | undefined;
  /** Keep a disabled button focusable, with `aria-disabled="true"`, refusing activation. */
  focusableWhenDisabled?: boolean | undefined;
  /**
   * A keyboard chord that runs the same command, such as `Ctrl+S`: drawn after the hint in the
   * tooltip and published as `aria-keyshortcuts`. The button never listens for it.
   */
  shortcut?: ShortcutChord | undefined;
  /**
   * Makes the button a link to this URL: a React Aria `Link` drawn through the provider's link
   * renderer. `render`, `type`, the pending and selected states and `focusableWhenDisabled` apply
   * to a `<button>` only.
   */
  href?: string | undefined;
  /** A link button's target. `_blank` adds `rel="noopener noreferrer"` unless `rel` is given. */
  target?: AriaLinkProps['target'];
  /** A link button's relationship to its destination. */
  rel?: string | undefined;
}

export interface ButtonStateOptions {
  /** The tooltip only repeats the accessible name, so it adds no description. */
  isTooltipName?: boolean | undefined;
}

/** Attributes React Aria's Button does not forward, applied through its `render` hook. */
type PassThroughAttributes = Pick<
  NativeProps<'button'>,
  'role' | 'aria-checked' | 'aria-selected' | 'aria-keyshortcuts'
>;

type ButtonElementProps = JSX.IntrinsicElements['button'];
type LinkRenderProps = Parameters<NonNullable<AriaLinkProps['render']>>[0];

interface PassThrough {
  attributes: PassThroughAttributes;
  focusableDisabled: boolean;
  /** Replaces the tooltip's description, `undefined` removing it, when set. */
  describedBy?: { value: string | undefined } | undefined;
  render: AriaButtonProps['render'];
}

/** A chord's `aria-keyshortcuts` value, or `undefined` without a chord or for an empty key. */
export function toKeyShortcuts(shortcut: ShortcutChord | undefined): string | undefined {
  return shortcut ? formatAriaKeyShortcuts(shortcut) || undefined : undefined;
}

function hasEntries(value: object): boolean {
  return Object.keys(value).length > 0;
}

/**
 * Applies what React Aria's Button does not forward (a `role` and its states), the `data-disabled`
 * of a focusable disabled button and a removed tooltip description through its `render` hook,
 * handing the result to the caller's `render` when there is one.
 */
function renderPassThrough({
  attributes,
  focusableDisabled,
  describedBy,
  render,
}: PassThrough): Pick<AriaButtonProps, 'render'> {
  const extra: Record<string, unknown> = Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined),
  );
  if (focusableDisabled) extra['data-disabled'] = 'true';
  if (describedBy) extra['aria-describedby'] = describedBy.value;
  if (!hasEntries(extra)) return render ? { render } : {};
  return {
    render: (props, state: ButtonRenderProps) => {
      const merged = { ...props, ...extra } as ButtonElementProps;
      return render ? render(merged, state) : <button {...merged} />;
    },
  };
}

/** The props that only Button and IconButton read, which React Aria's Button never takes. */
function omitOwnProps({
  pendingLabel: _pendingLabel,
  defaultSelected: _defaultSelected,
  onChange: _onChange,
  href: _href,
  target: _target,
  rel: _rel,
  ...rest
}: ButtonStateProps) {
  return rest;
}

/** Whether the caller states toggle semantics itself, so `isSelected` adds no `aria-pressed`. */
function statesToggle(props: ButtonStateProps): boolean {
  return (
    props['aria-pressed'] !== undefined ||
    props['aria-checked'] !== undefined ||
    props.role !== undefined
  );
}

/**
 * React Aria Button props for the states Button and IconButton share: a focusable disabled button
 * stays in the focus order but refuses activation and never submits, and `isSelected` adds
 * `aria-pressed` unless the caller states toggle semantics with `aria-pressed`, `aria-checked` or a
 * `role`. A `shortcut` becomes `aria-keyshortcuts`.
 */
export function toAriaButtonProps(
  props: ButtonStateProps,
  { isTooltipName = false }: ButtonStateOptions = {},
): AriaButtonProps & Pick<NativeProps<'button'>, 'ref'> {
  const {
    isSelected = false,
    isDisabled = false,
    focusableWhenDisabled = false,
    type = 'button',
    onPress,
    shortcut,
    role,
    render,
    ref,
    'aria-checked': ariaChecked,
    'aria-selected': ariaSelected,
    ...rest
  } = omitOwnProps(props);
  const focusableDisabled = isDisabled && focusableWhenDisabled;
  return {
    ...rest,
    ref: ref as Ref<HTMLButtonElement> | undefined,
    type: focusableDisabled ? 'button' : type,
    isDisabled: isDisabled && !focusableWhenDisabled,
    onPress: focusableDisabled ? undefined : onPress,
    ...(isSelected && !statesToggle(props) ? { 'aria-pressed': true } : {}),
    ...(focusableDisabled ? { 'aria-disabled': true } : {}),
    ...renderPassThrough({
      attributes: {
        role,
        'aria-checked': ariaChecked,
        'aria-selected': ariaSelected,
        'aria-keyshortcuts': toKeyShortcuts(shortcut),
      },
      focusableDisabled,
      describedBy: isTooltipName ? { value: rest['aria-describedby'] } : undefined,
      render,
    }),
  };
}

/**
 * The selected state and press handler of a button. With `defaultSelected` or `onChange` it is a
 * toggle: a press flips the state (held here unless `isSelected` controls it) and reports it, and
 * it always states `aria-pressed`. Otherwise `isSelected` only shows the state.
 */
export function useButtonSelection({
  isSelected,
  defaultSelected,
  onChange,
  onPress,
  'aria-pressed': ariaPressed,
}: Pick<
  ButtonStateProps,
  'isSelected' | 'defaultSelected' | 'onChange' | 'onPress' | 'aria-pressed'
>): Pick<ButtonStateProps, 'isSelected' | 'onPress' | 'aria-pressed'> {
  const isToggle = defaultSelected !== undefined || onChange !== undefined;
  const [selected, setSelected] = useControllableState(
    isSelected,
    defaultSelected ?? false,
    onChange,
  );
  if (!isToggle) return { isSelected, onPress, 'aria-pressed': ariaPressed };
  return {
    isSelected: selected,
    'aria-pressed': ariaPressed ?? selected,
    onPress: (event: PressEvent) => {
      onPress?.(event);
      setSelected(!selected);
    },
  };
}

/** Draws a link button's anchor through the provider's link renderer; a disabled one is a span. */
function renderLinkElement(props: LinkRenderProps, extra: Record<string, unknown>): ReactElement {
  if ('href' in props && typeof props.href === 'string' && props['aria-disabled'] === undefined) {
    return <UiLink {...props} {...extra} href={props.href} />;
  }
  const { href: _href, ...spanProps } = props as LinkRenderProps & { href?: unknown };
  return <span {...(spanProps as JSX.IntrinsicElements['span'])} {...extra} />;
}

/** React Aria Link props for a button with `href`: its press, focus and disabled states. */
export function toAriaLinkProps(
  {
    href,
    target,
    rel,
    isDisabled,
    onPress,
    onPressStart,
    onPressEnd,
    onPressChange,
    onPressUp,
    onHoverStart,
    onHoverEnd,
    onHoverChange,
    onFocus,
    onBlur,
    autoFocus,
    shortcut,
    ref,
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-current': ariaCurrent,
  }: ButtonStateProps,
  { isTooltipName = false }: ButtonStateOptions = {},
): AriaLinkProps & { ref?: Ref<HTMLAnchorElement> | undefined } {
  const extra: Record<string, unknown> = { 'aria-keyshortcuts': toKeyShortcuts(shortcut) };
  if (isTooltipName) extra['aria-describedby'] = ariaDescribedBy;
  return {
    ...{ href, target, isDisabled, autoFocus, id },
    ...{ onPress, onPressStart, onPressEnd, onPressChange, onPressUp },
    ...{ onHoverStart, onHoverEnd, onHoverChange, onFocus, onBlur },
    rel: rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined),
    ref: ref as Ref<HTMLAnchorElement> | undefined,
    'aria-describedby': ariaDescribedBy,
    'aria-current': ariaCurrent,
    render: (props) => renderLinkElement(props, extra),
  };
}
