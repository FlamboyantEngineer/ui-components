'use client';

import { LockGlyph, WarningGlyph } from '../../core/glyphs.js';
import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, mergeClassNames, type HookProps } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { Icon, type IconSource } from '../icon/icon.js';
import { toIconProps } from '../icon/icon.js';
import { Link } from '../link/link.js';
import { RecordChipParts } from './record-chip-parts.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';

export type RecordLabelSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** Why a record cannot be shown: the reader may not see it, or it no longer exists. */
export type RecordUnavailable = 'restricted' | 'missing';

export type RecordLabelMode = 'label' | 'chip';
export type RecordLabelLayout = 'inline' | 'stacked';

export interface RecordLabelProps extends BaseProps, AriaLabellingProps {
  /** Plain label or a chip with metadata and removal. Defaults to `label`. */
  mode?: RecordLabelMode | undefined;
  /** The kind of record, shown in chip mode when present. */
  type?: string | undefined;
  /** The referenced version, shown in chip mode when present. */
  version?: string | undefined;
  /** A status badge or other state shown in chip mode. */
  state?: ReactNode;
  /** Chip layout. Defaults to `inline`. */
  layout?: RecordLabelLayout | undefined;
  /** Content shown on hover and focus of a linked chip. */
  preview?: ReactNode;
  /** Shows the chip's remove action. */
  onRemove?: (() => void) | undefined;
  /** The record's identifier, such as `REQ-12`. It never breaks from its icon. */
  identifier: string;
  /** The record's name, after the identifier. */
  name?: string | undefined;
  /** A icon component or rendered element for the record's kind. Decorative. */
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

/** A record a message refers to, as its reference token carries it. */
export interface RecordLabelReference {
  /** The record's identity, opaque to the library. */
  id: string;
  /** The text the reference shows: the chip's identifier. */
  label: string;
  /** The record's kind or scope, as the host names it. */
  recordType?: string | undefined;
}

/** How the host shows a referenced record: what its chip draws besides the identifier. */
export type RecordLabelPresentation = Pick<
  RecordLabelProps,
  'name' | 'icon' | 'href' | 'isExternal' | 'unavailable' | 'type' | 'version' | 'state' | 'preview'
>;

/** Looks up how a referenced record shows, each time its chip is drawn. */
export type RecordLabelResolver = (
  reference: RecordLabelReference,
) => RecordLabelPresentation | undefined;

const hooks = createHooks('record-label', [
  'label',
  'identity',
  'icon',
  'identifier',
  'name',
  'accessible-label',
]);

const unavailableGlyphs = { restricted: LockGlyph, missing: WarningGlyph } as const;

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
 * The root's caller props and the text read in place of the visible label. A link carries the
 * caller's name; a span cannot, so it reads `aria-label` from hidden text and drops `aria-labelledby`.
 */
function resolveLabelling<P extends AriaLabellingProps>(props: P, isLink: boolean) {
  const { 'aria-label': ariaLabel, 'aria-labelledby': _labelledBy, ...unnamed } = props;
  if (isLink) return { rootProps: props, hiddenText: undefined };
  return { rootProps: unnamed, hiddenText: ariaLabel || undefined };
}

function resolveRecordHooks({
  isChipLabel,
  className,
  data,
}: {
  isChipLabel: boolean;
  className: string | undefined;
  data: Record<string, string | boolean | undefined>;
}) {
  return isChipLabel
    ? {
        ...hooks.slot('label', data),
        className: mergeClassNames(hooks.slotClass('label'), className),
      }
    : hooks.root({ className, data: { ...data, mode: 'label' } });
}

/**
 * A record named by its icon and identifier, which never break apart, then its name, which gives up
 * width first: cut with a tooltip, or wrapped. With `href` the whole label is a link.
 */
export function RecordLabelText({
  identifier,
  name,
  icon,
  size = 'md',
  href,
  isExternal,
  truncate = true,
  unavailable,
  className,
  isChipLabel = false,
  ...rest
}: Pick<
  RecordLabelProps,
  | 'identifier'
  | 'name'
  | 'icon'
  | 'size'
  | 'href'
  | 'isExternal'
  | 'truncate'
  | 'unavailable'
  | keyof BaseProps
  | keyof AriaLabellingProps
> & { isChipLabel?: boolean }) {
  const strings = useUiStrings();
  const glyph = unavailable ? unavailableGlyphs[unavailable] : icon;
  const text = name?.trim();
  const link = unavailable ? undefined : href;
  const { rootProps, hiddenText } = resolveLabelling(rest, link !== undefined);
  const isHidden = hiddenText !== undefined || undefined;
  return (
    <RecordLabelRoot
      {...rootProps}
      {...resolveRecordHooks({ isChipLabel, className, data: { size, truncate, unavailable } })}
      href={link}
      isExternal={isExternal}
    >
      <span {...hooks.slot('identity')} aria-hidden={isHidden}>
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
            <TruncationTooltip className={hooks.slotClass('name')} aria-hidden={isHidden}>
              {text}
            </TruncationTooltip>
          ) : (
            <span {...hooks.slot('name')} aria-hidden={isHidden}>
              {text}
            </span>
          )}
        </>
      ) : null}
      {hiddenText === undefined ? null : (
        <VisuallyHidden elementType="span" className={hooks.slotClass('accessible-label')}>
          {hiddenText}
        </VisuallyHidden>
      )}
    </RecordLabelRoot>
  );
}

/** One record reference, as a plain label or a chip with metadata, preview and removal. */
export function RecordLabel({
  mode = 'label',
  type,
  version,
  state,
  layout,
  preview,
  onRemove,
  ...rest
}: RecordLabelProps) {
  return mode === 'chip' ? (
    <RecordChipParts
      {...rest}
      type={type}
      version={version}
      state={state}
      layout={layout}
      preview={preview}
      onRemove={onRemove}
    />
  ) : (
    <RecordLabelText {...rest} />
  );
}
