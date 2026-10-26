import type { BaseProps } from '../../core/props.js';
import { type ButtonProps } from '../button/button.js';
export interface CopyButtonProps extends Pick<ButtonProps, 'variant' | 'size' | 'isDisabled'>, BaseProps {
    /** The text to copy, exactly as given. */
    value: string;
    /** Names the button. Defaults to the provider's `copy` string. */
    label?: string | undefined;
    /** How long the copied or failed state lasts, in milliseconds. Defaults to 2000. */
    timeout?: number | undefined;
    /** Called after each copy with whether the text reached the clipboard. */
    onCopy?: ((copied: boolean) => void) | undefined;
}
/**
 * An icon button that copies `value` to the clipboard, shows a check mark (or an error glyph)
 * while the outcome lasts, and announces it in a polite live region.
 */
export declare function CopyButton({ value, label, timeout, onCopy, variant, size, isDisabled, className, id, ...rest }: CopyButtonProps): import("react").JSX.Element;
//# sourceMappingURL=copy-button.d.ts.map