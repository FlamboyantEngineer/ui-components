import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, type HookProps } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { Link } from '../link/link.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';

export type RecordLabelSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** Why a record cannot be shown: the reader may not see it, or it no longer exists. */
export type RecordUnavailable = 'restricted' | 'missing';

export interface RecordLabelProps extends BaseProps, AriaLabellingProps {
  /** The record's identifier, such as `REQ-12`. It never breaks from its icon. */
  identifier: string;
  /** The record's name, after the identifier. */
  name?: string | undefined;
  /** A glyph name or icon node for the record's kind. Decorative. */
  icon?: IconSource;
  /** Icon and text size. Defaults to `md`. */
  size?: RecordLabelSize | undefined;
  /** Makes the label a link to the record, through the provider's link renderer. */
  href?: string | undefined;
  /** Opens the link in a new tab, and says so. */
  isExternal?: boolean | undefined;
  /** Keeps the name on one line, cut with a tooltip, instead of wrapping. Defaults to true. */
  truncate?: boolean | undefined;
  /** Shows only that the record is restricted or missing: a generic glyph, no link, no name. */
  unavailable?: RecordUnavailable | undefined;
}

const hooks = createHooks('record-label', ['identity', 'icon', 'identifier', 'name']);

const unavailableGlyphs = { restricted: 'lock', missing: 'warning' } as const;

/** The root: a link to the record, or a span. */
function RecordLabelRoot({
  href,
  isExternal,
  children,
  ...rest
}: HookProps &
  AriaLabellingProps &
  Pick<RecordLabelProps, 'href' | 'isExternal' | 'id'> & {
    children: ReactNode;
  }) {
  if (href === undefined) return <span {...rest}>{children}</span>;
  return (
    <Link {...rest} href={href} isExternal={isExternal} variant="secondary" underline="hover">
      {children}
    </Link>
  );
}

/**
 * A record named by its icon and identifier, which never break apart, then its name, which gives up
 * width first: cut with a tooltip, or wrapped. With `href` the whole label is a link.
 */
export function RecordLabel({
  identifier,
  name,
  icon,
  size = 'md',
  href,
  isExternal,
  truncate = true,
  unavailable,
  className,
  ...rest
}: RecordLabelProps) {
  const strings = useUiStrings();
  const glyph = unavailable ? unavailableGlyphs[unavailable] : icon;
  const text = name?.trim();
  return (
    <RecordLabelRoot
      {...rest}
      {...hooks.root({ className, props: rest, data: { size, truncate, unavailable } })}
      href={unavailable ? undefined : href}
      isExternal={isExternal}
    >
      <span {...hooks.slot('identity')}>
        {glyph ? (
          <Icon {...toIconProps(glyph)} size={size} className={hooks.slotClass('icon')} />
        ) : null}
        <span {...hooks.slot('identifier')}>
          {unavailable ? strings.recordUnavailable(unavailable) : identifier}
        </span>
      </span>
      {text && !unavailable ? (
        <>
          {' '}
          {truncate ? (
            <TruncationTooltip className={hooks.slotClass('name')}>{text}</TruncationTooltip>
          ) : (
            <span {...hooks.slot('name')}>{text}</span>
          )}
        </>
      ) : null}
    </RecordLabelRoot>
  );
}
