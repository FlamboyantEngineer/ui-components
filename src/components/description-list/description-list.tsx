import type { HTMLAttributes, ReactNode } from 'react';
import { createHooks, pickDataAttributes } from '../../core/hooks.js';

export type DescriptionListLayout = 'inline' | 'stacked';
export type DescriptionListColumns = 1 | 2;

export interface DescriptionListProps {
  /** `DescriptionRow` elements. */
  children?: ReactNode;
  /** `inline` puts labels and values on shared tracks; `stacked` puts values below labels. Defaults to `inline`. */
  layout?: DescriptionListLayout | undefined;
  /** How many columns of rows the stylesheet may lay out. Defaults to 1. */
  columns?: DescriptionListColumns | undefined;
  hidden?: boolean | undefined;
  className?: string | undefined;
  id?: string | undefined;
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('description-list', ['row', 'label', 'value', 'secondary']);

/** Read-only label and value pairs in a native description list. */
export function DescriptionList({
  children,
  layout = 'inline',
  columns = 1,
  hidden,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: DescriptionListProps) {
  return (
    <dl
      {...hooks.root({ className, props: rest, data: { layout, columns } })}
      id={id}
      hidden={hidden}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </dl>
  );
}

type RowAttributes = Pick<
  HTMLAttributes<HTMLDivElement>,
  | 'id'
  | 'tabIndex'
  | 'onClick'
  | 'onKeyDown'
  | 'onContextMenu'
  | 'onFocus'
  | 'onBlur'
  | 'aria-label'
  | 'aria-describedby'
>;

export interface DescriptionRowProps extends RowAttributes {
  /** The term. Shown as given, with no punctuation added. */
  label: ReactNode;
  /** The value. Zero and empty values are shown as given. */
  children?: ReactNode;
  /** A second definition below the value. Nullish, boolean and empty-string values add none. */
  secondary?: ReactNode;
  className?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

function hasSecondary(secondary: ReactNode): boolean {
  return (
    secondary !== null &&
    secondary !== undefined &&
    typeof secondary !== 'boolean' &&
    secondary !== ''
  );
}

/** One term with its value and an optional second definition, grouped in a `<div>`. */
export function DescriptionRow({
  label,
  children,
  secondary,
  className,
  id,
  tabIndex,
  onClick,
  onKeyDown,
  onContextMenu,
  onFocus,
  onBlur,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: DescriptionRowProps) {
  return (
    <div
      {...pickDataAttributes(rest)}
      {...hooks.slot('row', undefined, className)}
      id={id}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <dt {...hooks.slot('label')}>{label}</dt>
      <dd {...hooks.slot('value')}>{children}</dd>
      {hasSecondary(secondary) ? <dd {...hooks.slot('secondary')}>{secondary}</dd> : null}
    </div>
  );
}
