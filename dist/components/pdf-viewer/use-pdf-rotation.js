import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { createViewportCache } from './use-pdf-document.js';
/** The document turned by `rotation` degrees clockwise: a quarter turn swaps each page's sides. */
export function rotatePdf(loaded, rotation) {
    if (rotation === loaded.rotation)
        return loaded;
    const isQuarterTurn = (rotation - loaded.rotation) % 180 !== 0;
    return {
        ...loaded,
        rotation,
        sizes: isQuarterTurn
            ? loaded.sizes.map(({ width, height }) => ({ width: height, height: width }))
            : loaded.sizes,
        getViewport: createViewportCache(loaded.pages, rotation),
    };
}
/**
 * The reader's rotation of the pages, keeping their place across a turn. A new document starts
 * as the document itself sets each page.
 */
export function usePdfRotation({ loaded, pages, }) {
    const { captureAnchor, restoreAnchor } = pages;
    const [turn, setTurn] = useState({ loaded, rotation: 0 });
    const rotation = turn.loaded === loaded ? turn.rotation : 0;
    const view = useMemo(() => loaded && rotatePdf(loaded, rotation), [loaded, rotation]);
    const rotate = useCallback((degrees) => {
        captureAnchor();
        setTurn((previous) => ({
            loaded,
            rotation: ((previous.loaded === loaded ? previous.rotation : 0) + degrees + 360) % 360,
        }));
    }, [captureAnchor, loaded]);
    useLayoutEffect(() => restoreAnchor(), [rotation, restoreAnchor]);
    return { view, rotate };
}
//# sourceMappingURL=use-pdf-rotation.js.map