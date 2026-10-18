import { useRef, type CSSProperties, type PointerEvent } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import type { DiagramNode, DiagramPort } from './diagram-model.js';
import type { DiagramController } from './use-diagram-controller.js';

export interface DiagramPortViewProps {
  node: DiagramNode;
  port: DiagramPort;
  controller: DiagramController;
}

const dragThreshold = 3;

/** The port's place on its node, centred on the node's edge. */
function placePort(port: DiagramPort): CSSProperties {
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
export function DiagramPortView({ node, port, controller }: DiagramPortViewProps) {
  const strings = useUiStrings();
  const drag = useRef<{ x: number; y: number; isDragging: boolean } | null>(null);
  const { connect } = controller;
  const data = {
    side: port.side,
    connectSource: connect.connecting?.port === port.id && connect.connecting.node === node.id,
  };
  if (!controller.isEditing) {
    return <span {...hooks.slot('port', data)} aria-hidden="true" style={placePort(port)} />;
  }
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    if (connect.complete(node.id, port.id)) return;
    connect.start(node.id, port.id);
    drag.current = { x: event.clientX, y: event.clientY, isDragging: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (!active) return;
    if (
      !active.isDragging &&
      Math.hypot(event.clientX - active.x, event.clientY - active.y) < dragThreshold
    )
      return;
    active.isDragging = true;
    connect.track(controller.toDiagram(event.clientX, event.clientY));
  };
  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    drag.current = null;
    if (!active?.isDragging) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const target = controller.findTarget(event.clientX, event.clientY);
    if (!target || !connect.complete(target.node, target.port)) connect.cancel();
  };
  return (
    <button
      {...hooks.slot('port', data)}
      ref={controller.registerTarget({ node: node.id, port: port.id })}
      type="button"
      aria-label={strings.diagramPortLabel(node.label, port.label)}
      style={placePort(port)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !connect.connecting) return;
        event.preventDefault();
        connect.cancel();
      }}
      onClick={(event) => {
        // A pointer press acts on pointer down; a click from the keyboard has no pointer detail.
        if (event.detail !== 0) return;
        if (!connect.complete(node.id, port.id)) connect.start(node.id, port.id);
      }}
    />
  );
}
