import { type FieldInputProps } from '../field/field.js';
import type { SignatureValue } from './signature-path.js';
export type { DrawnSignature, SignatureValue, TypedSignature } from './signature-path.js';
export interface SignaturePadProps extends FieldInputProps<SignatureValue | null> {
    /** Offers typing the name as the keyboard alternative to drawing. Defaults to true. */
    allowsTyping?: boolean | undefined;
}
/**
 * A field for a signature: drawn with a mouse, a pen or a touch as smoothed strokes on an SVG
 * canvas, with Undo stroke and Clear, or typed as the signer's name, the keyboard alternative. The
 * value is a drawn signature (SVG path data) or a typed one, and `null` while empty. It has the
 * field base's label, validation, dirty state, restore, undo and menu.
 */
export declare function SignaturePad({ allowsTyping, ...props }: SignaturePadProps): import("react").JSX.Element;
//# sourceMappingURL=signature-pad.d.ts.map