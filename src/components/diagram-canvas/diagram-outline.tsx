import { useId, useRef } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { IconButton } from '../icon-button/icon-button.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import type { DiagramNode } from './diagram-model.js';
import type { DiagramLink } from './diagram-links.js';
import { formatDiagramLink } from './diagram-links.js';
import type { DiagramController } from './use-diagram-controller.js';

export interface DiagramOutlineProps {
  controller: DiagramController;
}

interface OutlineLinksProps {
  direction: 'outgoing' | 'incoming';
  node: DiagramNode;
  links: readonly DiagramLink[];
  controller: DiagramController;
  onFollow: (id: Key) => void;
}

/**
 * Where focus goes once a link's remove button is gone with its link: the next link of the list,
 * else the previous one, else the node's entry.
 */
function findFocusAfterRemoval(button: Element): HTMLElement | null {
  const item = button.closest('li');
  const sibling = item?.nextElementSibling ?? item?.previousElementSibling;
  const link = sibling?.querySelector<HTMLElement>(`.${hooks.slotClass('outline-link')}`);
  const entry = item?.parentElement?.closest<HTMLElement>(`.${hooks.slotClass('outline-item')}`);
  return link ?? entry ?? null;
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
          <li key={toKeyIdentity(link.edge.id)}>
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
                onPress={(event) => {
                  const next = findFocusAfterRemoval(event.target);
                  controller.moves.removeEdge(link.edge.id);
                  next?.focus();
                }}
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
        const links = controller.links.get(node.id)!;
        const shared = { node, controller, onFollow };
        return (
          <li
            key={toKeyIdentity(node.id)}
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
