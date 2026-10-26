import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { AnnotationContext } from './annotation-context.js';
import { annotationLayerHooks as hooks } from './annotation-hooks.js';
import { findAnnotationAt, getLayerOrigin, isSameMeasurement, measureTargets, } from './anchor-geometry.js';
export { AnnotationMargin } from './annotation-margin.js';
const noRects = [];
/**
 * Draws the anchors of annotations over its content as highlight marks: caller rectangles, or the
 * boxes of elements inside it, measured again when the layer resizes. Pressing a mark makes its
 * annotation active; an `AnnotationMargin` inside lays out a card for each annotation.
 */
export function AnnotationLayer({ annotations, activeId, defaultActiveId = null, onActiveChange, children, className, ...rest }) {
    const [active, setActive] = useControllableState(activeId, defaultActiveId, onActiveChange);
    const [layer, setLayer] = useState(null);
    const [measured, setMeasured] = useState(new Map());
    const measure = () => {
        if (!layer)
            return;
        const next = measureTargets(layer, annotations);
        setMeasured((current) => (isSameMeasurement(current, next) ? current : next));
    };
    useLayoutEffect(measure);
    useResizeObserver([layer], measure);
    const anchors = annotations.map((annotation) => ({
        annotation,
        rects: annotation.rects ?? measured.get(annotation.id) ?? noRects,
    }));
    const onClick = (event) => {
        if (!layer || event.target.closest(`.${hooks.slotClass('margin')}`))
            return;
        const origin = getLayerOrigin(layer);
        const hit = findAnnotationAt(anchors, {
            x: event.clientX - origin.left,
            y: event.clientY - origin.top,
        });
        if (hit !== null && hit !== active)
            setActive(hit);
    };
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest }), ref: setLayer, style: { position: 'relative' }, onClick: onClick, children: [_jsx(AnnotationContext, { value: { anchors, activeId: active, setActiveId: setActive, layer }, children: children }), _jsx("div", { ...hooks.slot('marks'), "aria-hidden": "true", style: { position: 'absolute', inset: 0, pointerEvents: 'none' }, children: anchors.flatMap(({ annotation, rects }) => rects.map((rect, index) => (_jsx("div", { ...hooks.slot('mark', { active: annotation.id === active }), style: {
                        position: 'absolute',
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    } }, `${toKeyIdentity(annotation.id)}-${index}`)))) })] }));
}
//# sourceMappingURL=annotation-layer.js.map