import type { ReactNode } from 'react';
import { VisuallyHidden } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { formatCount, normalizeCount } from '../../utils/count.js';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type BadgeSize = 'sm' | 'md' | 'lg';

/** `subtle` is a tinted pill, `solid` a filled token, `status` a tone dot before the label. */
export type BadgeVariant = 'subtle' | 'solid' | 'status';

export type BadgePlacement = 'inline' | 'overlay';

interface BadgeCommonProps {
  /** The value's tone. Defaults to `neutral`. */
  tone?: BadgeTone | undefined;
  /** Scale. Defaults to `md`. */
  size?: BadgeSize | undefined;
  /** Drop the pill inside chrome that already draws its own edge; tone and dot stay. */
  bare?: boolean | undefined;
  id?: string | undefined;
  hidden?: boolean | undefined;
  className?: string | undefined;
  'aria-hidden'?: boolean | 'true' | 'false' | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

export interface BadgeLabelProps extends BadgeCommonProps {
  /** Shape. Defaults to `subtle`. */
  variant?: BadgeVariant | undefined;
  /** The short value the badge shows. */
  children: ReactNode;
  /** Replacement accessible text. */
  'aria-label'?: string | undefined;
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
  /** Replacement accessible text, for example "12 unread messages". */
  'aria-label'?: string | undefined;
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

function CountBadge({
  count,
  max,
  more = false,
  placement = 'inline',
  tone = 'neutral',
  size = 'md',
  bare = false,
  id,
  hidden,
  className,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  ...rest
}: BadgeCountProps) {
  const strings = useUiStrings();
  const visible = formatCount(count, { max, more });
  const exact = normalizeCount(count);
  const spoken =
    ariaLabel ?? (exact === undefined ? '' : more ? strings.countOrMore(exact) : String(exact));
  const hiddenFromReaders = ariaHidden === true || ariaHidden === 'true';
  const separate = !hiddenFromReaders && spoken !== visible;

  return (
    <span
      {...hooks.root({
        className,
        props: rest,
        data: { variant: 'count', tone, size, placement, bare },
      })}
      id={id}
      hidden={hidden}
      aria-hidden={ariaHidden}
    >
      <span {...hooks.slot('label')} aria-hidden={separate || undefined}>
        {visible}
      </span>
      {separate ? (
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
  id,
  hidden,
  className,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  ...rest
}: BadgeLabelProps) {
  const isStatus = variant === 'status';
  return (
    <span
      {...hooks.root({
        className,
        props: rest,
        data: { variant, tone, size, bare, mutedDot: isStatus && mutedDot },
      })}
      id={id}
      hidden={hidden}
      role={isStatus && announce ? 'status' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
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
