import { useEditorEffect, useEditorEventListener, useEditorState, } from '@handlewithcare/react-prosemirror';
import { useEffect, useState } from 'react';
import { findTopBlocks } from './block-commands.js';
import { useRichTextEditorContext } from './rich-text-context.js';
/** The position of the top-level block holding a document position. */
function findTopLevelPos(doc, pos) {
    const $pos = doc.resolve(pos);
    if ($pos.depth > 0)
        return $pos.before(1);
    let start = 0;
    for (let index = 0; index < $pos.index(0); index += 1)
        start += doc.child(index).nodeSize;
    return start;
}
/**
 * The block under the pointer, or else the block holding the selection while the document or the
 * handle has focus (or `isHeld`, as while the handle's menu is open), placed against the surface.
 */
export function useBlockTarget(isHeld) {
    const { surfaceRef } = useRichTextEditorContext('BlockHandle');
    const state = useEditorState();
    const [hovered, setHovered] = useState(null);
    const [hasEditorFocus, setEditorFocus] = useState(false);
    const [hasOwnFocus, setOwnFocus] = useState(false);
    const [isDragging, setDragging] = useState(false);
    const [top, setTop] = useState(null);
    const isFocused = hasEditorFocus || hasOwnFocus || isHeld;
    const hoveredPos = hovered?.doc === state.doc && !isHeld ? hovered.pos : null;
    const pos = hoveredPos ?? (isFocused ? (findTopBlocks(state)?.from ?? null) : null);
    useEditorEventListener('mousemove', (view, event) => {
        if (isHeld)
            return false;
        const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!found)
            return false;
        const { doc } = view.state;
        const block = findTopLevelPos(doc, found.pos);
        setHovered((current) => current?.pos === block && current.doc === doc ? current : { pos: block, doc });
        return false;
    });
    useEditorEventListener('focus', () => (setEditorFocus(true), false));
    useEditorEventListener('blur', (_view, event) => {
        const related = event.relatedTarget;
        if (!(related instanceof Element && surfaceRef.current?.contains(related)))
            setEditorFocus(false);
        return false;
    });
    useEffect(() => {
        const surface = surfaceRef.current;
        const leave = () => setHovered(null);
        surface?.addEventListener('pointerleave', leave);
        return () => surface?.removeEventListener('pointerleave', leave);
    }, [surfaceRef]);
    useEditorEffect((view) => {
        const dom = pos === null ? null : view.nodeDOM(pos);
        const surface = surfaceRef.current;
        if (!(dom instanceof HTMLElement) || !surface)
            return setTop(null);
        const offset = dom.getBoundingClientRect().top - surface.getBoundingClientRect().top;
        setTop(offset + surface.scrollTop);
    }, [pos, state]);
    if (pos === null || top === null)
        return null;
    return {
        pos,
        top,
        isDragging,
        setDragging,
        onFocus: () => setOwnFocus(true),
        onBlur: (event) => {
            const related = event.relatedTarget;
            if (!(related instanceof Node && event.currentTarget.contains(related)))
                setOwnFocus(false);
        },
    };
}
//# sourceMappingURL=use-block-target.js.map