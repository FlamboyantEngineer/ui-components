import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';

export interface PropertyStripProps extends BaseProps {
  /** The strip's cells. */
  children?: ReactNode;
}

export interface PropertyStripCellProps extends BaseProps {
  /** A short visible label before the control, such as `T`. Decorative: the control names itself. */
  letter: string;
  /** The full name the letter stands for, shown as its native tooltip. */
  label: string;
  /** The cell's control. */
  children?: ReactNode;
}

const stripHooks = createHooks('property-strip');
const cellHooks = createHooks('property-strip-cell', ['letter']);

/** An inline run of small labelled controls inside one property row, such as the sides of a margin. */
export function PropertyStrip({ children, className, ...rest }: PropertyStripProps) {
  return (
    <span {...rest} {...stripHooks.root({ className })}>
      {children}
    </span>
  );
}

/** One cell of a `PropertyStrip`: a decorative letter before its control. */
export function PropertyStripCell({
  letter,
  label,
  children,
  className,
  ...rest
}: PropertyStripCellProps) {
  return (
    <span {...rest} {...cellHooks.root({ className })}>
      <span {...cellHooks.slot('letter')} title={label} aria-hidden="true">
        {letter}
      </span>
      {children}
    </span>
  );
}
