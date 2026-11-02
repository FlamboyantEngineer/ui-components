'use client';

import type { ReactNode } from 'react';
import { useLocale } from '../../primitives/index.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size, Tone, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { formatCount, normalizeCount } from '../../utils/count.js';
import { Icon, type IconSource } from '../icon/icon.js';
import { toIconProps } from '../icon/icon.js';

export type BadgeSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `subtle` is a tinted pill, `solid` a filled token, `status` a tone dot before the label. */
export type BadgeVariant = 'subtle' | 'solid' | 'status';

export type BadgePlacement = 'inline' | 'overlay';

interface BadgeCommonProps
  extends
    BaseProps,
    RefProps<HTMLSpanElement>,
    Pick<NativeProps<'span'>, 'hidden' | 'aria-hidden' | 'aria-label'> {
  /** The value's tone. Defaults to `neutral`. */
  tone?: Tone | undefined;
  /** Scale. Defaults to `md`. */
  size?: BadgeSize | undefined;
  /** Drop the pill inside chrome that already draws its own edge; tone and dot stay. */
  bare?: boolean | undefined;
}

export interface BadgeLabelProps extends BadgeCommonProps {
  /** Shape. Defaults to `subtle`. */
  variant?: BadgeVariant | undefined;
  /** The short value the badge shows. */
  children: ReactNode;
  /** A `status` badge is a polite live region unless this is `false`. */
  announce?: boolean | undefined;
  /** Soften only the status dot, keeping the label's contrast. */
  mutedDot?: boolean | undefined;
  /** A decorative icon before the label: an imported icon component or rendered element. */
  startIcon?: IconSource;
  /** A decorative icon after the label: an imported icon component or rendered element. */
  endIcon?: IconSource;
  count?: never;
  max?: never;
  more?: never;
  placement?: never;
  showZero?: never;
}

export interface BadgeCountProps extends BadgeCommonProps {
  /** The count. Shown as a whole, nonnegative number; a value that is not finite shows nothing. */
  count: number;
  /** Counts above this cap read as `max+`. Omit for the exact count. */
  max?: number | undefined;
  /** More entries exist beyond the counted ones: the count reads as `count+` and "count or more". */
  more?: boolean | undefined;
  /** `overlay` pins the count to the upper trailing corner of a positioned host. Defaults to `inline`. */
  placement?: BadgePlacement | undefined;
  /** Show a count of zero. Defaults to `true`; `false` renders nothing while the count is zero. */
  showZero?: boolean | undefined;
  variant?: never;
  children?: never;
  announce?: never;
  mutedDot?: never;
  startIcon?: never;
  endIcon?: never;
}

export interface BadgeDotProps extends BadgeCommonProps {
  /** A tone dot with no text, such as a corner marker on an icon or avatar. */
  variant: 'dot';
  /** `overlay` pins the dot to the upper trailing corner of a positioned host. Defaults to `inline`. */
  placement?: BadgePlacement | undefined;
  children?: never;
  count?: never;
  max?: never;
  more?: never;
  showZero?: never;
  announce?: never;
  mutedDot?: never;
  startIcon?: never;
  endIcon?: never;
}

export type BadgeProps = BadgeLabelProps | BadgeCountProps | BadgeDotProps;

const hooks = createHooks('badge', ['dot', 'start-icon', 'label', 'end-icon', 'accessible-label']);

function isCountBadge(props: BadgeProps): props is BadgeCountProps {
  return typeof props.count === 'number';
}

function isDotBadge(props: BadgeProps): props is BadgeDotProps {
  return props.variant === 'dot';
}

function isAriaHidden(value: NativeProps<'span'>['aria-hidden']): boolean {
  return value === true || value === 'true';
}

/** Text only assistive technology reads, in place of a visible label that differs from it. */
function AccessibleLabel({ children }: { children: string }) {
  return (
    <VisuallyHidden as="span" className={hooks.slotClass('accessible-label')}>
      {children}
    </VisuallyHidden>
  );
}

/** The text a count is read as: the caller's label, else the uncapped count ("12 or more" with `more`). */
function describeCount(
  { count, more, 'aria-label': ariaLabel }: Pick<BadgeCountProps, 'count' | 'more' | 'aria-label'>,
  strings: UiStrings,
  locale: string,
): string {
  if (ariaLabel !== undefined) return ariaLabel;
  const exact = normalizeCount(count);
  if (exact === undefined) return '';
  return more ? strings.countOrMore(exact) : formatCount(exact, locale);
}

function CountBadge({
  count,
  max,
  more = false,
  placement = 'inline',
  tone = 'neutral',
  size = 'md',
  bare = false,
  showZero = true,
  className,
  'aria-label': ariaLabel,
  ...rest
}: BadgeCountProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const visible = formatCount(count, locale, { max, more });
  const spoken = describeCount({ count, more, 'aria-label': ariaLabel }, strings, locale);
  const isSeparate = !isAriaHidden(rest['aria-hidden']) && spoken !== visible;
  const data = { variant: 'count', tone, size, placement, bare };
  if (!showZero && normalizeCount(count) === 0 && !more) return null;

  return (
    <span {...rest} {...hooks.root({ className, data })}>
      <span {...hooks.slot('label')} aria-hidden={isSeparate || undefined}>
        {visible}
      </span>
      {isSeparate ? <AccessibleLabel>{spoken}</AccessibleLabel> : null}
    </span>
  );
}

/** A tone dot with no text: decorative, or read as its `aria-label` from visually hidden text. */
function DotBadge({
  placement = 'inline',
  tone = 'neutral',
  size = 'md',
  bare = false,
  className,
  'aria-label': ariaLabel,
  ...rest
}: BadgeDotProps) {
  const isSpoken = Boolean(ariaLabel) && !isAriaHidden(rest['aria-hidden']);
  const data = { variant: 'dot', tone, size, placement, bare };
  return (
    <span
      {...rest}
      aria-hidden={isSpoken ? rest['aria-hidden'] : true}
      {...hooks.root({ className, data })}
    >
      {isSpoken && ariaLabel ? <AccessibleLabel>{ariaLabel}</AccessibleLabel> : null}
    </span>
  );
}

/**
 * Where a label badge's `aria-label` goes: its name when it has a role, else visually hidden text
 * read in place of the visible label, since a generic element cannot carry a name.
 */
function resolveLabelName({
  role,
  ariaLabel,
  ariaHidden,
}: {
  role: 'status' | undefined;
  ariaLabel: string | undefined;
  ariaHidden: NativeProps<'span'>['aria-hidden'];
}): { name: string | undefined; hiddenText: string | undefined } {
  if (role) return { name: ariaLabel, hiddenText: undefined };
  const isSpoken = Boolean(ariaLabel) && !isAriaHidden(ariaHidden);
  return { name: undefined, hiddenText: isSpoken ? ariaLabel : undefined };
}

/** A label badge's decorative icon in its slot, or nothing. */
function renderLabelIcon(source: IconSource, slot: 'start-icon' | 'end-icon') {
  return !source ? null : <Icon {...toIconProps(source)} className={hooks.slotClass(slot)} />;
}

function LabelBadge({
  variant = 'subtle',
  children,
  announce = true,
  mutedDot = false,
  startIcon,
  endIcon,
  tone = 'neutral',
  size = 'md',
  bare = false,
  className,
  'aria-label': ariaLabel,
  ...rest
}: BadgeLabelProps) {
  const isStatus = variant === 'status';
  const role = isStatus && announce ? 'status' : undefined;
  const { name, hiddenText } = resolveLabelName({
    role,
    ariaLabel,
    ariaHidden: rest['aria-hidden'],
  });
  const data = { variant, tone, size, bare, mutedDot: isStatus && mutedDot };
  return (
    <span {...rest} {...hooks.root({ className, data })} role={role} aria-label={name}>
      {isStatus ? <span {...hooks.slot('dot')} aria-hidden="true" /> : null}
      {renderLabelIcon(startIcon, 'start-icon')}
      <span {...hooks.slot('label')} aria-hidden={hiddenText !== undefined || undefined}>
        {children}
      </span>
      {renderLabelIcon(endIcon, 'end-icon')}
      {hiddenText === undefined ? null : <AccessibleLabel>{hiddenText}</AccessibleLabel>}
    </span>
  );
}

/**
 * A compact, non-interactive value a reader scans: a tag, a type, a state or a count.
 * Pass `children` for a label, `count` for a formatted number, or `variant="dot"` for a marker.
 */
export function Badge(props: BadgeProps) {
  if (isCountBadge(props)) return <CountBadge {...props} />;
  if (isDotBadge(props)) return <DotBadge {...props} />;
  return <LabelBadge {...props} />;
}
