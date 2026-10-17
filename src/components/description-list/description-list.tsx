import type { HTMLAttributes, ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

export type DescriptionListLayout = 'inline' | 'stacked';
export type DescriptionListColumns = 1 | 2;

export interface DescriptionListProps
  extends
    BaseProps,
    Pick<HTMLAttributes<HTMLDListElement>, 'hidden' | 'aria-label' | 'aria-labelledby'> {
  /** `DescriptionRow` elements. */
  children?: ReactNode;
  /** `inline` puts labels and values on shared tracks; `stacked` puts values below labels. Defaults to `inline`. */
  layout?: DescriptionListLayout | undefined;
  /** How many columns of rows the stylesheet may lay out. Defaults to 1. */
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
  /** A second definition below the value. Nullish, boolean and empty-string values add none. */
  secondary?: ReactNode;
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
  secondary,
  className,
  ...rest
}: DescriptionRowProps) {
  return (
    <div {...rest} {...hooks.slot('row', undefined, className)}>
      <dt {...hooks.slot('label')}>{label}</dt>
      <dd {...hooks.slot('value')}>{children}</dd>
      {isEmptyNode(secondary) ? null : <dd {...hooks.slot('secondary')}>{secondary}</dd>}
    </div>
  );
}
