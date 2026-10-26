import { jsx as _jsx } from "react/jsx-runtime";
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { useUiStrings } from '../../core/provider.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
const dragThreshold = 3;
/** The port's place on its node, centred on the node's edge. */
function placePort(port) {
    const along = `${(port.position ?? 0.5) * 100}%`;
    const isVertical = port.side === 'left' || port.side === 'right';
    return {
        position: 'absolute',
        left: isVertical ? (port.side === 'left' ? 0 : '100%') : along,
        top: isVertical ? along : port.side === 'top' ? 0 : '100%',
        transform: 'translate(-50%, -50%)',
    };
}
/**
 * A port: in edit mode a button that starts a connection when pressed or dragged, and ends one
 * that is in progress; otherwise a decorative mark.
 */
export function DiagramPortView({ node, port, controller, registerTarget, isEditing, isConnectSource, }) {
    const strings = useUiStrings();
    const connect = () => controller.current.connect;
    const data = { side: port.side, connectSource: isConnectSource };
    const drag = usePointerDrag({
        isDisabled: !isEditing,
        onCancel: () => connect().cancel(),
        onStart: (event) => {
            event.stopPropagation();
            if (connect().complete(node.id, port.id))
                return null;
            connect().start(node.id, port.id);
            return { x: event.clientX, y: event.clientY, isDragging: false };
        },
        onMove: (event, active) => {
            if (!active.isDragging &&
                Math.hypot(event.clientX - active.x, event.clientY - active.y) < dragThreshold)
                return;
            active.isDragging = true;
            connect().track(controller.current.toDiagram(event.clientX, event.clientY));
        },
        onEnd: (event, active, isCancelled) => {
            if (isCancelled) {
                connect().cancel();
                return;
            }
            if (!active.isDragging)
                return;
            const target = controller.current.findTarget(event.clientX, event.clientY);
            if (!target || !connect().complete(target.node, target.port))
                connect().cancel();
        },
    });
    if (!isEditing) {
        return _jsx("span", { ...hooks.slot('port', data), "aria-hidden": "true", style: placePort(port) });
    }
    return (_jsx("button", { ...hooks.slot('port', data), ref: registerTarget({ node: node.id, port: port.id }), type: "button", "aria-label": strings.diagramPortLabel(node.label, port.label), style: placePort(port), ...drag, onKeyDown: (event) => {
            if (event.key !== 'Escape' || !connect().connecting)
                return;
            event.preventDefault();
            connect().cancel();
        }, onClick: (event) => {
            // A pointer press acts on pointer down; a click from the keyboard has no pointer detail.
            if (event.detail !== 0)
                return;
            if (!connect().complete(node.id, port.id))
                connect().start(node.id, port.id);
        } }));
}
//# sourceMappingURL=diagram-port.js.map