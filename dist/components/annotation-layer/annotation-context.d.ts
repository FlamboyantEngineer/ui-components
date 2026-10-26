import type { Key } from '../../core/props.js';
import type { AnchoredAnnotation } from './anchor-geometry.js';
/** What a margin inside a layer reads: the anchors, the active annotation and the layer element. */
export interface AnnotationContextValue {
    anchors: readonly AnchoredAnnotation[];
    activeId: Key | null;
    setActiveId: (id: Key | null) => void;
    layer: HTMLElement | null;
}
export declare const AnnotationContext: import("react").Context<AnnotationContextValue | null>;
/** The layer around a margin; a margin outside a layer is a mistake. */
export declare function useAnnotationContext(): AnnotationContextValue;
//# sourceMappingURL=annotation-context.d.ts.map