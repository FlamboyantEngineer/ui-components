import type { JSX, ReactElement, Ref } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type {
  AriaLabellingProps,
  FocusEventProps,
  HoverEventProps,
  KeyboardEventProps,
  PressEvent,
  PressEventProps,
} from '../../core/events.js';
import type { NativeProps } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { renderLinkElement } from '../link/link.js';
import {
  formatAriaKeyShortcuts,
  type ShortcutChord,
  type ShortcutPlatform,
} from '../shortcut/shortcut.js';

/** The states a button passes to `render` with the `<button>`'s props. */
export interface ButtonRenderState {
  /** The pointer is over the button. */
  isHovered: boolean;
  /** The button is being pressed. */
  isPressed: boolean;
  /** The button has focus. */
  isFocused: boolean;
  /** The button has keyboard focus. */
  isFocusVisible: boolean;
  /** The button is natively disabled. */
  isDisabled: boolean;
  /** The button is pending and refuses presses. */
  isPending: boolean;
}

/** ARIA attributes a button passes through to its element. */
type ButtonAriaAttributes = Pick<
  NativeProps<'button'>,
  | 'role'
  | 'aria-checked'
  | 'aria-selected'
  | 'aria-pressed'
  | 'aria-haspopup'
  | 'aria-expanded'
  | 'aria-controls'
  | 'aria-current'
>;

/** The states, handlers and link mode Button and IconButton share. */
export interface ButtonStateProps
  extends
    PressEventProps,
    HoverEventProps,
    FocusEventProps,
    KeyboardEventProps,
    AriaLabellingProps,
    ButtonAriaAttributes {
  /** The `<button>`, or the `<a>` of a button with `href`. */
  ref?: Ref<HTMLButtonElement | HTMLAnchorElement> | undefined;
  /** The native button type. Defaults to `button`. */
  type?: 'button' | 'submit' | 'reset' | undefined;
  /** Refuses interaction: the native `disabled` attribute, or `aria-disabled` with `focusableWhenDisabled`. */
  isDisabled?: boolean | undefined;
  /** Keep a disabled button focusable, with `aria-disabled="true"`, refusing activation. */
  focusableWhenDisabled?: boolean | undefined;
  /**
   * Shows a busy indicator and refuses presses, keeping focus. Button keeps its icons and label
   * under the indicator; Icon Button shows it in place of its icon.
   */
  isPending?: boolean | undefined;
  /** Names the busy indicator while pending. Defaults to the provider's `loading` string. */
  pendingLabel?: string | undefined;
  /** The current choice: `data-selected`, and `aria-pressed` unless the caller states toggle semantics. */
  isSelected?: boolean | undefined;
  /** The initial state of a toggle button, which a press then flips. Makes the button a toggle. */
  defaultSelected?: boolean | undefined;
  /** Receives a toggle button's new state on every press. Makes the button a toggle. */
  onChange?: ((isSelected: boolean) => void) | undefined;
  /** Focuses the button when it mounts. */
  autoFocus?: boolean | undefined;
  /** Keeps focus where it is when the button is pressed, for buttons inside a field. */
  preventFocusOnPress?: boolean | undefined;
  /** Hides the button with the native `hidden` attribute, as a scroll button at an edge is. */
  hidden?: boolean | undefined;
  /** Leaves the button out of the Tab order while keeping it pressable. */
  excludeFromTabOrder?: boolean | undefined;
  /**
   * The part of an enclosing library component the button fills, such as a calendar's `previous`;
   * `null` keeps the button out of any part.
   */
  slot?: string | null | undefined;
  /**
   * A keyboard chord that runs the same command, such as `Ctrl+S`: drawn after the hint in the
   * tooltip and published as `aria-keyshortcuts`. The button never listens for it.
   */
  shortcut?: ShortcutChord | undefined;
  /**
   * Makes the button a link to this URL, drawn through the provider's link renderer. `render`,
   * `type`, the pending and selected states and `focusableWhenDisabled` apply to a `<button>` only.
   */
  href?: string | undefined;
  /** A link button's target. `_blank` adds `rel="noopener noreferrer"` unless `rel` is given. */
  target?: NativeProps<'a'>['target'];
  /** A link button's relationship to its destination. */
  rel?: string | undefined;
  /** Replaces the `<button>` with the caller's own, given its props and the button's state. */
  render?: ElementRender<'button', ButtonRenderState> | undefined;
}

export interface ButtonStateOptions {
  /** The tooltip only repeats the accessible name, so it adds no description. */
  isTooltipName?: boolean | undefined;
  /** The notation of `aria-keyshortcuts`; `useDetectedPlatform()` so hydration matches the server. */
  platform?: ShortcutPlatform | undefined;
}

/** What a button hands its building block for a `<button>`. */
export interface ButtonElementProps extends Omit<
  ButtonStateProps,
  | 'ref'
  | 'role'
  | 'aria-checked'
  | 'aria-selected'
  | 'isSelected'
  | 'defaultSelected'
  | 'onChange'
  | 'pendingLabel'
  | 'focusableWhenDisabled'
  | 'shortcut'
  | 'href'
  | 'target'
  | 'rel'
> {
  ref?: Ref<HTMLButtonElement> | undefined;
  'aria-disabled'?: boolean | undefined;
}

/** What a button with `href` hands its building block for the `<a>`. */
export interface ButtonLinkElementProps
  extends
    PressEventProps,
    HoverEventProps,
    FocusEventProps,
    KeyboardEventProps,
    AriaLabellingProps,
    Pick<
      ButtonStateProps,
      'href' | 'target' | 'rel' | 'isDisabled' | 'autoFocus' | 'hidden' | 'aria-current'
    > {
  id?: string | undefined;
  ref?: Ref<HTMLAnchorElement> | undefined;
  /** Draws the `<a>`, or the `<span>` of a disabled link. */
  render: (props: AnchorDomProps | SpanDomProps) => ReactElement;
}

/** Attributes the building block's button does not forward, applied through its `render` hook. */
type PassThroughAttributes = Pick<
  NativeProps<'button'>,
  'role' | 'aria-checked' | 'aria-selected' | 'aria-keyshortcuts'
>;

type ButtonDomProps = JSX.IntrinsicElements['button'];
type AnchorDomProps = JSX.IntrinsicElements['a'];
type SpanDomProps = JSX.IntrinsicElements['span'];

interface PassThrough {
  attributes: PassThroughAttributes;
  focusableDisabled: boolean;
  /** Replaces the tooltip's description, `undefined` removing it, when set. */
  describedBy?: { value: string | undefined } | undefined;
  render: ButtonStateProps['render'];
}

/** A chord's `aria-keyshortcuts` value, or `undefined` without a chord or for an empty key. */
export function toKeyShortcuts(
  shortcut: ShortcutChord | undefined,
  platform?: ShortcutPlatform,
): string | undefined {
  return shortcut ? formatAriaKeyShortcuts(shortcut, platform) || undefined : undefined;
}

function hasEntries(value: object): boolean {
  return Object.keys(value).length > 0;
}

/**
 * Applies what the building block's button does not forward (a `role` and its states), the
 * `data-disabled` of a focusable disabled button and a removed tooltip description through its
 * `render` hook, handing the result to the caller's `render` when there is one.
 */
function renderPassThrough({
  attributes,
  focusableDisabled,
  describedBy,
  render,
}: PassThrough): Pick<ButtonElementProps, 'render'> {
  const extra: Record<string, unknown> = Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined),
  );
  if (focusableDisabled) extra['data-disabled'] = 'true';
  if (describedBy) extra['aria-describedby'] = describedBy.value;
  if (!hasEntries(extra)) return render ? { render } : {};
  return {
    render: (props, state) => {
      const merged = { ...props, ...extra } as ButtonDomProps;
      return render ? render(merged, state) : <button {...merged} />;
    },
  };
}

/** The props that only Button and IconButton read, which the building block's button never takes. */
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
function statesToggle(
  props: Pick<ButtonStateProps, 'role' | 'aria-checked' | 'aria-pressed'>,
): boolean {
  return (
    props['aria-pressed'] !== undefined ||
    props['aria-checked'] !== undefined ||
    props.role !== undefined
  );
}

/**
 * Building-block button props for the states Button and IconButton share: a focusable disabled
 * button stays in the focus order but refuses activation and never submits, and `isSelected` adds
 * `aria-pressed` unless the caller states toggle semantics with `aria-pressed`, `aria-checked` or a
 * `role`. A `shortcut` becomes `aria-keyshortcuts`.
 */
export function toAriaButtonProps(
  props: ButtonStateProps,
  { isTooltipName = false, platform }: ButtonStateOptions = {},
): ButtonElementProps {
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
        'aria-keyshortcuts': toKeyShortcuts(shortcut, platform),
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
 * it states `aria-pressed` unless the caller states toggle semantics. Otherwise `isSelected` only
 * shows the state.
 */
export function useButtonSelection(
  props: Pick<
    ButtonStateProps,
    | 'isSelected'
    | 'defaultSelected'
    | 'onChange'
    | 'onPress'
    | 'role'
    | 'aria-checked'
    | 'aria-pressed'
  >,
): Pick<ButtonStateProps, 'isSelected' | 'onPress' | 'aria-pressed'> {
  const { isSelected, defaultSelected, onChange, onPress, 'aria-pressed': ariaPressed } = props;
  const isToggle = defaultSelected !== undefined || onChange !== undefined;
  const [selected, setSelected] = useControllableState(
    isSelected,
    defaultSelected ?? false,
    onChange,
  );
  if (!isToggle) return { isSelected, onPress, 'aria-pressed': ariaPressed };
  return {
    isSelected: selected,
    'aria-pressed': statesToggle(props) ? ariaPressed : selected,
    onPress: (event: PressEvent) => {
      onPress?.(event);
      setSelected(!selected);
    },
  };
}

/**
 * The props that apply to a `<button>` only, which a link button never hands its building block:
 * the native type, the pending and selected states, the button's own focus options and its
 * button-only roles and states.
 */
function omitButtonOnlyProps({
  type: _type,
  isPending: _isPending,
  pendingLabel: _pendingLabel,
  isSelected: _isSelected,
  defaultSelected: _defaultSelected,
  onChange: _onChange,
  focusableWhenDisabled: _focusableWhenDisabled,
  preventFocusOnPress: _preventFocusOnPress,
  excludeFromTabOrder: _excludeFromTabOrder,
  slot: _slot,
  render: _render,
  role: _role,
  'aria-checked': _ariaChecked,
  'aria-selected': _ariaSelected,
  'aria-pressed': _ariaPressed,
  'aria-haspopup': _ariaHaspopup,
  'aria-expanded': _ariaExpanded,
  'aria-controls': _ariaControls,
  ...rest
}: ButtonStateProps) {
  return rest;
}

/**
 * Building-block link props for a button with `href`: everything a link takes (press, hover, focus
 * and key handlers, labelling, `id`, `autoFocus`, `hidden`), with a safe `rel` for a new tab.
 */
export function toAriaLinkProps(
  props: ButtonStateProps & { id?: string | undefined },
  { isTooltipName = false, platform }: ButtonStateOptions = {},
): ButtonLinkElementProps {
  const { shortcut, ref, target, rel, ...rest } = omitButtonOnlyProps(props);
  const extra: Record<string, unknown> = {
    'aria-keyshortcuts': toKeyShortcuts(shortcut, platform),
  };
  if (isTooltipName) extra['aria-describedby'] = rest['aria-describedby'];
  return {
    ...rest,
    target,
    rel: rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined),
    ref: ref as Ref<HTMLAnchorElement> | undefined,
    // The building block draws a `<span>` without `href`; its props fit an anchor's.
    render: (element) => renderLinkElement({ ...(element as AnchorDomProps), ...extra }),
  };
}
