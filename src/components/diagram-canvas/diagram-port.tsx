import type { CSSProperties } from 'react';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
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
  const { connect } = controller;
  const data = {
    side: port.side,
    connectSource: connect.connecting?.port === port.id && connect.connecting.node === node.id,
  };
  const drag = usePointerDrag<HTMLButtonElement, { x: number; y: number; isDragging: boolean }>({
    isDisabled: !controller.isEditing,
    onCancel: connect.cancel,
    onStart: (event) => {
      event.stopPropagation();
      if (connect.complete(node.id, port.id)) return null;
      connect.start(node.id, port.id);
      return { x: event.clientX, y: event.clientY, isDragging: false };
    },
    onMove: (event, active) => {
      if (
        !active.isDragging &&
        Math.hypot(event.clientX - active.x, event.clientY - active.y) < dragThreshold
      )
        return;
      active.isDragging = true;
      connect.track(controller.toDiagram(event.clientX, event.clientY));
    },
    onEnd: (event, active, isCancelled) => {
      if (isCancelled) {
        connect.cancel();
        return;
      }
      if (!active.isDragging) return;
      const target = controller.findTarget(event.clientX, event.clientY);
      if (!target || !connect.complete(target.node, target.port)) connect.cancel();
    },
  });
  if (!controller.isEditing) {
    return <span {...hooks.slot('port', data)} aria-hidden="true" style={placePort(port)} />;
  }
  return (
    <button
      {...hooks.slot('port', data)}
      ref={controller.registerTarget({ node: node.id, port: port.id })}
      type="button"
      aria-label={strings.diagramPortLabel(node.label, port.label)}
      style={placePort(port)}
      {...drag}
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
