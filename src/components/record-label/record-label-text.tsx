'use client';

import type { ReactNode, Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { LockGlyph, WarningGlyph } from '../../core/glyphs.js';
import { type HookProps, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { Link } from '../link/link.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { RecordLabelProps } from './record-label.js';
import { recordLabelHooks as hooks } from './record-label-hooks.js';

// The label part of a record label, shared by the plain label and the chip, so the chip's parts
// need nothing from the main module at run time.

const unavailableGlyphs = { restricted: LockGlyph, missing: WarningGlyph } as const;

/** The root: a link to the record, or a span. */
function RecordLabelRoot({
  ref,
  href,
  isExternal,
  children,
  ...rest
}: HookProps &
  AriaLabellingProps &
  Pick<RecordLabelProps, 'ref' | 'href' | 'isExternal' | 'id'> & {
    children: ReactNode;
  }) {
  // The root is this span or the link below, so each takes the ref as its own element's.
  if (href === undefined) {
    return (
      <span {...rest} ref={ref as Ref<HTMLSpanElement> | undefined}>
        {children}
      </span>
    );
  }
  return (
    <Link
      {...rest}
      ref={ref as Ref<HTMLAnchorElement> | undefined}
      href={href}
      isExternal={isExternal}
      variant="secondary"
      underline="hover"
    >
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
        <VisuallyHidden as="span" className={hooks.slotClass('accessible-label')}>
          {hiddenText}
        </VisuallyHidden>
      )}
    </RecordLabelRoot>
  );
}
