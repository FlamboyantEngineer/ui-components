import type { HTMLAttributes, ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type DescriptionFormatOptions, type DescriptionValue } from './format-description-value.js';
export type DescriptionListLayout = 'inline' | 'stacked';
export type DescriptionListColumns = 1 | 2 | 3 | 4;
/** How many of the list's columns a row covers; `full` covers the whole line. */
export type DescriptionRowSpan = DescriptionListColumns | 'full';
export interface DescriptionListProps extends BaseProps, Pick<HTMLAttributes<HTMLDListElement>, 'hidden' | 'aria-label' | 'aria-labelledby'> {
    /** `DescriptionRow` elements. */
    children?: ReactNode;
    /** `inline` puts labels and values on shared tracks; `stacked` puts values below labels. Defaults to `inline`. */
    layout?: DescriptionListLayout | undefined;
    /** How many columns of rows the stylesheet may lay out, from 1 to 4. Defaults to 1. */
    columns?: DescriptionListColumns | undefined;
}
/** The attributes a row forwards when the caller makes it a focus target. */
type RowAttributes = Pick<HTMLAttributes<HTMLDivElement>, 'tabIndex' | 'onClick' | 'onKeyDown' | 'onContextMenu' | 'onFocus' | 'onBlur' | 'aria-label' | 'aria-describedby'>;
export interface DescriptionRowProps extends BaseProps, RowAttributes {
    /** The term. Shown as given, with no punctuation added. */
    label: ReactNode;
    /** The value. Zero and empty values are shown as given. */
    children?: ReactNode;
    /** A value to format for the provider's locale, shown when there are no children. */
    value?: DescriptionValue | undefined;
    /** `Intl` options for formatting `value` as a number, a date or a list. */
    formatOptions?: DescriptionFormatOptions | undefined;
    /** A second definition below the value. Nullish, boolean and empty-string values add none. */
    secondary?: ReactNode;
    /** How many of the list's columns the row covers. Defaults to 1. */
    span?: DescriptionRowSpan | undefined;
}
/** Read-only label and value pairs in a native description list. */
export declare function DescriptionList({ children, layout, columns, className, ...rest }: DescriptionListProps): import("react").JSX.Element;
/** One term with its value and an optional second definition, grouped in a `<div>`. */
export declare function DescriptionRow({ label, children, value, formatOptions, secondary, span, className, ...rest }: DescriptionRowProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=description-list.d.ts.map