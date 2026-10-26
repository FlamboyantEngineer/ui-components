import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { Button } from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { formatSignatureStroke, signatureSpace, } from './signature-path.js';
export const signaturePadHooks = createHooks('signature-pad', [
    'modes',
    'surface',
    'canvas',
    'stroke',
    'actions',
    'input',
]);
const hooks = signaturePadHooks;
/** The pointer position in the drawing space, kept inside it. */
function toDrawingPoint(event, size) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = box.width > 0 ? ((event.clientX - box.left) / box.width) * size.width : 0;
    const y = box.height > 0 ? ((event.clientY - box.top) / box.height) * size.height : 0;
    return { x: clamp(x, 0, size.width), y: clamp(y, 0, size.height) };
}
/**
 * Captures one stroke at a time from the primary button of a mouse, a pen or a touch. The pointer
 * is captured, so a stroke that leaves the surface keeps drawing along its edge until release; a
 * cancelled pointer drops the stroke.
 */
function useStrokeCapture(size, { isEditable, onStroke }) {
    const [livePath, setLivePath] = useState(null);
    const add = (event, points) => {
        points.push(toDrawingPoint(event, size));
        setLivePath(formatSignatureStroke(points));
    };
    const handlers = usePointerDrag({
        isDisabled: !isEditable,
        onCancel: () => setLivePath(null),
        onStart: (event) => {
            event.preventDefault();
            const points = [];
            add(event, points);
            return points;
        },
        onMove: add,
        onEnd: (event, points, isCancelled) => {
            if (!isCancelled) {
                points.push(toDrawingPoint(event, size));
                onStroke(formatSignatureStroke(points));
            }
            setLivePath(null);
        },
    });
    return { livePath, handlers };
}
/**
 * The drawing area, an image named by the field's label and described by its stroke count, whose
 * SVG canvas shows the strokes drawn so far, then Undo stroke and Clear buttons.
 */
export function SignatureSurface({ control, drawing, isEditable, onDraw }) {
    const strings = useUiStrings();
    const strokesId = useId();
    const size = drawing ?? { kind: 'drawn', ...signatureSpace, paths: [] };
    const { paths } = size;
    const { livePath, handlers } = useStrokeCapture(size, {
        isEditable,
        onStroke: (path) => onDraw({ ...size, paths: [...paths, path] }),
    });
    const hasStrokes = paths.length > 0;
    return (_jsxs(_Fragment, { children: [_jsx("div", { ...hooks.slot('surface', { drawing: livePath !== null }), ref: control.ref, id: control.id, role: "img", tabIndex: -1, "aria-label": control['aria-label'], "aria-labelledby": control['aria-labelledby'], "aria-describedby": [strokesId, control['aria-describedby']].filter(Boolean).join(' '), "aria-invalid": control['aria-invalid'], children: _jsx("svg", { ...hooks.slot('canvas'), ...handlers, viewBox: `0 0 ${size.width} ${size.height}`, preserveAspectRatio: "none", style: { width: '100%', height: '100%', touchAction: 'none' }, children: [...paths, ...(livePath ? [livePath] : [])].map((path, index) => (_jsx("path", { ...hooks.slot('stroke'), d: path, fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", vectorEffect: "non-scaling-stroke" }, index))) }) }), _jsx(VisuallyHidden, { id: strokesId, elementType: "span", children: strings.signatureStrokes(paths.length) }), _jsxs("div", { ...hooks.slot('actions'), children: [_jsx(Button, { size: "sm", startIcon: "undo", isDisabled: !isEditable || !hasStrokes, onPress: () => onDraw(paths.length > 1 ? { ...size, paths: paths.slice(0, -1) } : null), children: strings.undoStroke }), _jsx(Button, { size: "sm", startIcon: "delete", isDisabled: !isEditable || !hasStrokes, onPress: () => onDraw(null), children: strings.clear })] })] }));
}
//# sourceMappingURL=signature-surface.js.map