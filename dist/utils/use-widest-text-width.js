import { useEffect, useState } from 'react';
function widestText(element, texts) {
    const canvas = typeof OffscreenCanvas === 'undefined' ? null : new OffscreenCanvas(1, 1).getContext('2d');
    const view = element.ownerDocument.defaultView;
    if (!canvas || !view)
        return null;
    const style = view.getComputedStyle(element);
    canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return Math.ceil(texts.reduce((widest, text) => Math.max(widest, canvas.measureText(text).width), 0));
}
/**
 * The width, in pixels, of the widest of `texts` in the font of `ref`'s element, measured on a
 * canvas once per set of texts and again when the document's fonts finish loading. `null` where
 * no canvas is available.
 */
export function useWidestTextWidth(ref, texts) {
    const [width, setWidth] = useState(null);
    const key = JSON.stringify(texts);
    useEffect(() => {
        const element = ref.current;
        if (!element)
            return undefined;
        const lines = JSON.parse(key);
        let active = true;
        const measure = () => {
            if (active)
                setWidth(widestText(element, lines));
        };
        measure();
        void element.ownerDocument.fonts?.ready.then(measure);
        return () => {
            active = false;
        };
    }, [ref, key]);
    return width;
}
//# sourceMappingURL=use-widest-text-width.js.map