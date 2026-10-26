import type { FieldControlProps } from '../field/field.js';
import { type DrawnSignature } from './signature-path.js';
export interface SignatureSurfaceProps {
    control: FieldControlProps;
    /** The drawing shown, or `null` for an empty pad. */
    drawing: DrawnSignature | null;
    isEditable: boolean;
    /** Called with the drawing after a stroke ends, an undo or a clear; `null` when it is empty. */
    onDraw: (drawing: DrawnSignature | null) => void;
}
export declare const signaturePadHooks: import("../../core/hooks.js").ComponentHooks<"canvas" | "input" | "stroke" | "actions" | "surface" | "modes">;
/**
 * The drawing area, an image named by the field's label and described by its stroke count, whose
 * SVG canvas shows the strokes drawn so far, then Undo stroke and Clear buttons.
 */
export declare function SignatureSurface({ control, drawing, isEditable, onDraw }: SignatureSurfaceProps): import("react").JSX.Element;
//# sourceMappingURL=signature-surface.d.ts.map