/** A signature drawn with a pointer: one SVG path per stroke, in a `width` × `height` space. */
export interface DrawnSignature {
    kind: 'drawn';
    /** The drawing space's width: the SVG `viewBox` width the paths are drawn in. */
    width: number;
    /** The drawing space's height. */
    height: number;
    /** SVG path data, one entry per stroke, in drawing order. */
    paths: string[];
}
/** A signature typed as the signer's name, the keyboard alternative to drawing. */
export interface TypedSignature {
    kind: 'typed';
    text: string;
}
/** A drawn or typed signature. A field with no signature holds `null`. */
export type SignatureValue = DrawnSignature | TypedSignature;
/** A pointer position in the drawing space. */
export interface SignaturePoint {
    x: number;
    y: number;
}
/** The drawing space of a new signature: three times as wide as it is high. */
export declare const signatureSpace: {
    readonly width: 600;
    readonly height: 200;
};
/**
 * The SVG path data of one stroke: a quadratic curve through the midpoints between the pointer
 * positions, which smooths the jitter of a hand-drawn line. A single point is a zero-length line,
 * which a round line cap draws as a dot.
 */
export declare function formatSignatureStroke(points: readonly SignaturePoint[]): string;
/**
 * A drawn signature as standalone SVG markup: round, unfilled strokes in `currentColor`, so the
 * markup inlined in a page takes the text colour and an image of it draws in black.
 */
export declare function formatSignatureSvg(drawing: DrawnSignature): string;
/** A drawn signature as a `data:` URL of its SVG markup, for an image source or a stored file. */
export declare function formatSignatureDataUrl(drawing: DrawnSignature): string;
//# sourceMappingURL=signature-path.d.ts.map