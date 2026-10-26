import { type ButtonProps } from '../button/button.js';
export interface FieldRestoreButtonProps extends Omit<ButtonProps, 'icon' | 'label' | 'preventFocusOnPress'> {
    /** What the button restores, a field or a value; it is named `Restore <label>`. */
    label: string;
}
/**
 * The icon button that puts a committed value back. Pressing it with a pointer leaves focus on the
 * control being edited.
 */
export declare function FieldRestoreButton({ label, className, ...rest }: FieldRestoreButtonProps): import("react").JSX.Element;
//# sourceMappingURL=field-restore-button.d.ts.map