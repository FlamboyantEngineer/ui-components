'use client';

import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Size, RefProps } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';
import { RecordChipParts } from './record-chip-parts.js';
import { RecordLabelText } from './record-label-text.js';

export type RecordLabelSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** Why a record cannot be shown: the reader may not see it, or it no longer exists. */
export type RecordUnavailable = 'restricted' | 'missing';

export type RecordLabelMode = 'label' | 'chip';
export type RecordLabelLayout = 'inline' | 'stacked';

export interface RecordLabelProps
  extends RefProps<HTMLSpanElement | HTMLAnchorElement>, BaseProps, AriaLabellingProps {
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
