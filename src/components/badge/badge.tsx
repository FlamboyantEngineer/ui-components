import type { ReactNode } from 'react';
import { VisuallyHidden } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { formatCount, normalizeCount } from '../../utils/count.js';

export type BadgeTone = Tone;

export type BadgeSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `subtle` is a tinted pill, `solid` a filled token, `status` a tone dot before the label. */
export type BadgeVariant = 'subtle' | 'solid' | 'status';

export type BadgePlacement = 'inline' | 'overlay';

interface BadgeCommonProps
  extends BaseProps, Pick<NativeProps<'span'>, 'hidden' | 'aria-hidden' | 'aria-label'> {
  /** The value's tone. Defaults to `neutral`. */
  tone?: BadgeTone | undefined;
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
  count?: never;
  max?: never;
  more?: never;
  placement?: never;
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
  variant?: never;
  children?: never;
  announce?: never;
  mutedDot?: never;
}

export type BadgeProps = BadgeLabelProps | BadgeCountProps;

const hooks = createHooks('badge', ['dot', 'label', 'accessible-label']);

function isCountBadge(props: BadgeProps): props is BadgeCountProps {
  return typeof props.count === 'number';
}

/** The text a count is read as: the caller's label, else the uncapped count ("12 or more" with `more`). */
function describeCount(
  { count, more, 'aria-label': ariaLabel }: Pick<BadgeCountProps, 'count' | 'more' | 'aria-label'>,
  strings: UiStrings,
): string {
  if (ariaLabel !== undefined) return ariaLabel;
  const exact = normalizeCount(count);
  if (exact === undefined) return '';
  return more ? strings.countOrMore(exact) : String(exact);
}

function CountBadge({
  count,
  max,
  more = false,
  placement = 'inline',
  tone = 'neutral',
  size = 'md',
  bare = false,
  className,
  'aria-label': ariaLabel,
  ...rest
}: BadgeCountProps) {
  const strings = useUiStrings();
  const visible = formatCount(count, { max, more });
  const spoken = describeCount({ count, more, 'aria-label': ariaLabel }, strings);
  const isHidden = rest['aria-hidden'] === true || rest['aria-hidden'] === 'true';
  const isSeparate = !isHidden && spoken !== visible;
  const data = { variant: 'count', tone, size, placement, bare };

  return (
    <span {...rest} {...hooks.root({ className, data })}>
      <span {...hooks.slot('label')} aria-hidden={isSeparate || undefined}>
        {visible}
      </span>
      {isSeparate ? (
        <VisuallyHidden elementType="span" className={hooks.slotClass('accessible-label')}>
          {spoken}
        </VisuallyHidden>
      ) : null}
    </span>
  );
}

function LabelBadge({
  variant = 'subtle',
  children,
  announce = true,
  mutedDot = false,
  tone = 'neutral',
  size = 'md',
  bare = false,
  className,
  ...rest
}: BadgeLabelProps) {
  const isStatus = variant === 'status';
  const data = { variant, tone, size, bare, mutedDot: isStatus && mutedDot };
  return (
    <span
      {...rest}
      {...hooks.root({ className, data })}
      role={isStatus && announce ? 'status' : undefined}
    >
      {isStatus ? <span {...hooks.slot('dot')} aria-hidden="true" /> : null}
      <span {...hooks.slot('label')}>{children}</span>
    </span>
  );
}

/**
 * A compact, non-interactive value a reader scans: a tag, a type, a state or a count.
 * Pass `children` for a label, or `count` for a formatted number.
 */
export function Badge(props: BadgeProps) {
  return isCountBadge(props) ? <CountBadge {...props} /> : <LabelBadge {...props} />;
}
