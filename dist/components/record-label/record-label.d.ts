import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Size } from '../../core/props.js';
import { type IconSource } from '../icon/icon.js';
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
export type RecordLabelPresentation = Pick<RecordLabelProps, 'name' | 'icon' | 'href' | 'isExternal' | 'unavailable' | 'type' | 'version' | 'state' | 'preview'>;
/** Looks up how a referenced record shows, each time its chip is drawn. */
export type RecordLabelResolver = (reference: RecordLabelReference) => RecordLabelPresentation | undefined;
/**
 * A record named by its icon and identifier, which never break apart, then its name, which gives up
 * width first: cut with a tooltip, or wrapped. With `href` the whole label is a link.
 */
export declare function RecordLabelText({ identifier, name, icon, size, href, isExternal, truncate, unavailable, className, isChipLabel, ...rest }: Pick<RecordLabelProps, 'identifier' | 'name' | 'icon' | 'size' | 'href' | 'isExternal' | 'truncate' | 'unavailable' | keyof BaseProps | keyof AriaLabellingProps> & {
    isChipLabel?: boolean;
}): import("react").JSX.Element;
/** One record reference, as a plain label or a chip with metadata, preview and removal. */
export declare function RecordLabel({ mode, type, version, state, layout, preview, onRemove, ...rest }: RecordLabelProps): import("react").JSX.Element;
//# sourceMappingURL=record-label.d.ts.map