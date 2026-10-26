import type { HTMLAttributes, ReactNode } from 'react';
import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import {
  formatDescriptionValue,
  type DescriptionFormatOptions,
  type DescriptionValue,
} from './format-description-value.js';

export type DescriptionListLayout = 'inline' | 'stacked';
export type DescriptionListColumns = 1 | 2 | 3 | 4;
/** How many of the list's columns a row covers; `full` covers the whole line. */
export type DescriptionRowSpan = DescriptionListColumns | 'full';

export interface DescriptionListProps
  extends
    BaseProps,
    Pick<HTMLAttributes<HTMLDListElement>, 'hidden' | 'aria-label' | 'aria-labelledby'> {
  /** `DescriptionRow` elements. */
  children?: ReactNode;
  /** `inline` puts labels and values on shared tracks; `stacked` puts values below labels. Defaults to `inline`. */
  layout?: DescriptionListLayout | undefined;
  /** How many columns of rows the stylesheet may lay out, from 1 to 4. Defaults to 1. */
  columns?: DescriptionListColumns | undefined;
}

/** The attributes a row forwards when the caller makes it a focus target. */
type RowAttributes = Pick<
  HTMLAttributes<HTMLDivElement>,
  | 'tabIndex'
  | 'onClick'
  | 'onKeyDown'
  | 'onContextMenu'
  | 'onFocus'
  | 'onBlur'
  | 'aria-label'
  | 'aria-describedby'
>;

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

const hooks = createHooks('description-list', ['row', 'label', 'value', 'secondary']);

/** Read-only label and value pairs in a native description list. */
export function DescriptionList({
  children,
  layout = 'inline',
  columns = 1,
  className,
  ...rest
}: DescriptionListProps) {
  return (
    <dl {...rest} {...hooks.root({ className, data: { layout, columns } })}>
      {children}
    </dl>
  );
}

/** One term with its value and an optional second definition, grouped in a `<div>`. */
export function DescriptionRow({
  label,
  children,
  value,
  formatOptions,
  secondary,
  span = 1,
  className,
  ...rest
}: DescriptionRowProps) {
  const { locale } = useLocale();
  const shown =
    children === undefined && value !== undefined
      ? formatDescriptionValue(value, { locale, formatOptions })
      : children;
  return (
    <div {...rest} {...hooks.slot('row', { span }, className)}>
      <dt {...hooks.slot('label')}>{label}</dt>
      <dd {...hooks.slot('value')}>{shown}</dd>
      {isEmptyNode(secondary) ? null : <dd {...hooks.slot('secondary')}>{secondary}</dd>}
    </div>
  );
}
