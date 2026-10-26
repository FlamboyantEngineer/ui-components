import { useLayoutEffect, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
/** The connection the reader is drawing from a port, by pointer drag or by keyboard. */
export function useDiagramConnect({ nodes, isEditing, onConnect, announce, }) {
    const strings = useUiStrings();
    const [connecting, setConnecting] = useState(null);
    useLayoutEffect(() => {
        if (isEditing || !connecting)
            return;
        setConnecting(null);
        announce(strings.diagramConnectCancelled);
    }, [isEditing, connecting, announce, strings.diagramConnectCancelled]);
    const labelOf = (id) => nodes.find((node) => node.id === id)?.label ?? String(id);
    const cancel = () => {
        if (!connecting)
            return;
        setConnecting(null);
        announce(strings.diagramConnectCancelled);
    };
    return {
        connecting: isEditing ? connecting : null,
        start: (node, port) => {
            if (!isEditing)
                return;
            const portLabel = nodes
                .find((item) => item.id === node)
                ?.ports?.find((item) => item.id === port)?.label;
            setConnecting({ node, port, pointer: null });
            announce(strings.diagramConnecting(strings.diagramPortLabel(labelOf(node), portLabel ?? port)));
        },
        track: (pointer) => setConnecting((current) => (current ? { ...current, pointer } : current)),
        complete: (target, targetPort) => {
            if (!isEditing || !connecting)
                return false;
            if (target === connecting.node && targetPort === connecting.port) {
                cancel();
                return true;
            }
            setConnecting(null);
            onConnect?.({ source: connecting.node, sourcePort: connecting.port, target, targetPort });
            announce(strings.diagramConnected(labelOf(connecting.node), labelOf(target)));
            return true;
        },
        cancel,
    };
}
//# sourceMappingURL=use-diagram-connect.js.map