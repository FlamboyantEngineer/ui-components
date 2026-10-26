import type { ReactNode } from 'react';
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
/** An inline run of small labelled controls inside one property row, such as the sides of a margin. */
export declare function PropertyStrip({ children, className, ...rest }: PropertyStripProps): import("react").JSX.Element;
/** One cell of a `PropertyStrip`: a decorative letter before its control. */
export declare function PropertyStripCell({ letter, label, children, className, ...rest }: PropertyStripCellProps): import("react").JSX.Element;
//# sourceMappingURL=property-strip.d.ts.map