import { type PointerEvent, type ReactNode, type RefObject } from 'react';
import { type CodeDiagnostic } from './code-layers.js';
import type { CodeRange } from './code-ranges.js';
import type { CodeSegment } from './code-segments.js';
/** A diagnostic and the source it marks. */
export interface MarkedDiagnostic {
    diagnostic: CodeDiagnostic;
    range: CodeRange;
}
export interface CodeHoverOptions {
    inputRef: RefObject<HTMLTextAreaElement | null>;
    highlightRef: RefObject<HTMLPreElement | null>;
    marked: readonly MarkedDiagnostic[];
    renderHover: ((offset: number) => ReactNode) | undefined;
    /** What the highlighted copy draws; its text is read again only after it changes. */
    segments: readonly (CodeSegment | null)[];
}
/** What the tooltip shows, and the on-screen rectangle it points at. */
export interface CodeHoverTip {
    offset: number;
    rect: DOMRect;
    diagnostics: CodeDiagnostic[];
    info: ReactNode;
}
export interface CodeHoverModel {
    tip: CodeHoverTip | null;
    /** Shows the tip of a range the keyboard moved to. */
    showAt(range: CodeRange): void;
    onPointerMove(event: PointerEvent<HTMLTextAreaElement>): void;
    /** Hides the tip shortly, unless the pointer moves into it. */
    onPointerLeave(): void;
    /** Keeps the tip open while the pointer is over it. */
    hold(): void;
    close(): void;
}
export interface CodeHoverTooltipProps {
    model: CodeHoverModel;
    inputRef: RefObject<HTMLTextAreaElement | null>;
}
/**
 * The hover tip of a code editor: the problems marked under the pointer and the caller's hover
 * information for that offset, read from the highlighted copy under the text area.
 */
export declare function useCodeHover({ inputRef, highlightRef, marked, renderHover, segments, }: CodeHoverOptions): CodeHoverModel;
/** The hover tip: a non-modal popover on the tooltip layer, pointing at the hovered text. */
export declare function CodeHoverTooltip({ model, inputRef }: CodeHoverTooltipProps): import("react").JSX.Element;
//# sourceMappingURL=code-hover.d.ts.map