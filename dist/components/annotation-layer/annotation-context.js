import { createContext, useContext } from 'react';
export const AnnotationContext = createContext(null);
/** The layer around a margin; a margin outside a layer is a mistake. */
export function useAnnotationContext() {
    const context = useContext(AnnotationContext);
    if (!context)
        throw new Error('AnnotationMargin must be inside an AnnotationLayer.');
    return context;
}
//# sourceMappingURL=annotation-context.js.map