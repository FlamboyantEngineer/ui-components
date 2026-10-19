import { useId, useRef } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import type { DiagramEdge, DiagramNode } from './diagram-model.js';
import type { DiagramController } from './use-diagram-controller.js';

export interface DiagramOutlineProps {
  controller: DiagramController;
}

/** An edge seen from one of its nodes, with the node at its other end. */
export interface DiagramLink {
  edge: DiagramEdge;
  other: DiagramNode;
}

interface OutlineLinksProps {
  direction: 'outgoing' | 'incoming';
  node: DiagramNode;
  links: readonly DiagramLink[];
  controller: DiagramController;
  onFollow: (id: Key) => void;
}

/** A link's text: the label of the node at the other end, then the edge's label, if any. */
export function formatDiagramLink({ edge, other }: DiagramLink): string {
  return edge.label ? `${other.label} (${edge.label})` : other.label;
}

/** The edges leaving a node and the edges reaching it, with the nodes at their other ends. */
export function collectDiagramLinks(
  node: DiagramNode,
  { nodes, edges }: { nodes: readonly DiagramNode[]; edges: readonly DiagramEdge[] },
): { outgoing: DiagramLink[]; incoming: DiagramLink[] } {
  const byId = new Map(nodes.map((item) => [item.id, item]));
  const link = (edge: DiagramEdge, otherId: Key) => {
    const other = byId.get(otherId);
    return other ? [{ edge, other }] : [];
  };
  return {
    outgoing: edges
      .filter((edge) => edge.source === node.id)
      .flatMap((edge) => link(edge, edge.target)),
    incoming: edges
      .filter((edge) => edge.target === node.id)
      .flatMap((edge) => link(edge, edge.source)),
  };
}

/** One direction of a node's links: buttons that move to the node at the other end. */
function OutlineLinks({ direction, node, links, controller, onFollow }: OutlineLinksProps) {
  const strings = useUiStrings();
  const labelId = useId();
  if (links.length === 0) return null;
  const isRemovable = controller.isEditing && direction === 'outgoing';
  return (
    <div {...hooks.slot('outline-links', { direction })}>
      <span {...hooks.slot('outline-links-label')} id={labelId}>
        {direction === 'outgoing' ? strings.diagramLeadsTo : strings.diagramComesFrom}
      </span>
      <ul aria-labelledby={labelId}>
        {links.map((link) => (
          <li key={link.edge.id}>
            <button
              {...hooks.slot('outline-link')}
              type="button"
              onClick={() => onFollow(link.other.id)}
            >
              {formatDiagramLink(link)}
            </button>
            {isRemovable ? (
              <IconButton
                className={hooks.slotClass('outline-remove')}
                icon="close"
                label={strings.diagramRemoveConnection(node.label, link.other.label)}
                size="xs"
                variant="ghost"
                onPress={() => controller.moves.removeEdge(link.edge.id)}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The diagram as a list: every node with the nodes it leads to and comes from, as buttons that
 * move to that node's entry. In edit mode each outgoing link has a button that removes it.
 */
export function DiagramOutline({ controller }: DiagramOutlineProps) {
  const strings = useUiStrings();
  const items = useRef(new Map<Key, HTMLLIElement>());
  const onFollow = (id: Key) => items.current.get(id)?.focus();
  if (controller.nodes.length === 0) return <p {...hooks.slot('empty')}>{strings.diagramEmpty}</p>;
  return (
    <ul {...hooks.slot('outline')} aria-label={strings.diagramOutlineView}>
      {controller.nodes.map((node) => {
        const links = collectDiagramLinks(node, controller);
        const shared = { node, controller, onFollow };
        return (
          <li
            key={node.id}
            {...hooks.slot('outline-item', {
              selected: controller.selection.selected.has(node.id),
            })}
            ref={(element) => {
              if (element) items.current.set(node.id, element);
              else items.current.delete(node.id);
            }}
            tabIndex={-1}
          >
            <span {...hooks.slot('outline-label')}>{node.label}</span>
            <OutlineLinks {...shared} direction="outgoing" links={links.outgoing} />
            <OutlineLinks {...shared} direction="incoming" links={links.incoming} />
          </li>
        );
      })}
    </ul>
  );
}
