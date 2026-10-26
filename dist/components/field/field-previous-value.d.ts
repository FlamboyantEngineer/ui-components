import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
export interface FieldPreviousValueProps extends BaseProps {
    /** The value the edit replaced or removed: text, or an icon with its label. */
    children: ReactNode;
    /** Puts this one value back. Without it the marker only shows the value. */
    onRestore?: (() => void) | undefined;
    /** Names the restore button (`Restore <restoreLabel>`); defaults to the text content of `children`. */
    restoreLabel?: string | undefined;
    /** The field is locked: the restore button is disabled. */
    isDisabled?: boolean | undefined;
}
/**
 * Marks a value that differs from the field's committed value: the previous value in a `<del>`
 * element, and, when the control can put that one value back, a restore button.
 */
export declare function FieldPreviousValue({ children, onRestore, restoreLabel, isDisabled, className, id, ...rest }: FieldPreviousValueProps): import("react").JSX.Element;
//# sourceMappingURL=field-previous-value.d.ts.map