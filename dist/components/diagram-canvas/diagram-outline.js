import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Button } from '../button/button.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import { formatDiagramLink } from './diagram-links.js';
/**
 * Where focus goes once a link's remove button is gone with its link: the next link of the list,
 * else the previous one, else the node's entry.
 */
function findFocusAfterRemoval(button) {
    const item = button.closest('li');
    const sibling = item?.nextElementSibling ?? item?.previousElementSibling;
    const link = sibling?.querySelector(`.${hooks.slotClass('outline-link')}`);
    const entry = item?.parentElement?.closest(`.${hooks.slotClass('outline-item')}`);
    return link ?? entry ?? null;
}
/** One direction of a node's links: buttons that move to the node at the other end. */
function OutlineLinks({ direction, node, links, controller, onFollow }) {
    const strings = useUiStrings();
    const labelId = useId();
    if (links.length === 0)
        return null;
    const isRemovable = controller.isEditing && direction === 'outgoing';
    return (_jsxs("div", { ...hooks.slot('outline-links', { direction }), children: [_jsx("span", { ...hooks.slot('outline-links-label'), id: labelId, children: direction === 'outgoing' ? strings.diagramLeadsTo : strings.diagramComesFrom }), _jsx("ul", { "aria-labelledby": labelId, children: links.map((link) => (_jsxs("li", { children: [_jsx("button", { ...hooks.slot('outline-link'), type: "button", onClick: () => onFollow(link.other.id), children: formatDiagramLink(link) }), isRemovable ? (_jsx(Button, { className: hooks.slotClass('outline-remove'), icon: "close", label: strings.diagramRemoveConnection(node.label, link.other.label), size: "xs", variant: "ghost", onPress: (event) => {
                                const next = findFocusAfterRemoval(event.target);
                                controller.moves.removeEdge(link.edge.id);
                                next?.focus();
                            } })) : null] }, toKeyIdentity(link.edge.id)))) })] }));
}
/**
 * The diagram as a list: every node with the nodes it leads to and comes from, as buttons that
 * move to that node's entry. In edit mode each outgoing link has a button that removes it.
 */
export function DiagramOutline({ controller }) {
    const strings = useUiStrings();
    const items = useRef(new Map());
    const onFollow = (id) => items.current.get(id)?.focus();
    if (controller.nodes.length === 0)
        return _jsx("p", { ...hooks.slot('empty'), children: strings.diagramEmpty });
    return (_jsx("ul", { ...hooks.slot('outline'), "aria-label": strings.diagramOutlineView, children: controller.nodes.map((node) => {
            const links = controller.links.get(node.id);
            const shared = { node, controller, onFollow };
            return (_jsxs("li", { ...hooks.slot('outline-item', {
                    selected: controller.selection.selected.has(node.id),
                }), ref: (element) => {
                    if (element)
                        items.current.set(node.id, element);
                    else
                        items.current.delete(node.id);
                }, tabIndex: -1, children: [_jsx("span", { ...hooks.slot('outline-label'), children: node.label }), _jsx(OutlineLinks, { ...shared, direction: "outgoing", links: links.outgoing }), _jsx(OutlineLinks, { ...shared, direction: "incoming", links: links.incoming })] }, toKeyIdentity(node.id)));
        }) }));
}
//# sourceMappingURL=diagram-outline.js.map