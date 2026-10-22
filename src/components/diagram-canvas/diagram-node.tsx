import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { capturePointer } from '../../utils/pointer-drag.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import {
  findConnectedNode,
  resolveNodeRect,
  type DiagramDirection,
  type DiagramNode,
} from './diagram-model.js';
import { DiagramPortView } from './diagram-port.js';
import type { DiagramController } from './use-diagram-controller.js';

/** The states a canvas passes to `renderNode` with each node. */
export interface DiagramNodeRenderState {
  isSelected: boolean;
  /** The canvas is in edit mode. */
  isEditing: boolean;
}

export interface DiagramNodeViewProps<T> {
  node: DiagramNode<T>;
  controller: DiagramController;
  /** What the node's description reads after the caller's: its selection and connections. */
  description: string;
  renderNode: ((node: DiagramNode<T>, state: DiagramNodeRenderState) => ReactNode) | undefined;
}

interface PointerStart {
  x: number;
  y: number;
  isDragging: boolean;
  wasSelected: boolean;
  isToggle: boolean;
}

const dragThreshold = 3;
const arrowDirections: Record<string, DiagramDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

function isToggleEvent(event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }) {
  return event.shiftKey || event.metaKey || event.ctrlKey;
}

/** Selection on press, and a drag that moves the node (and the selection holding it). */
function useNodePointer(id: Key, controller: DiagramController) {
  const { selection, moves, connect, isEditing } = controller;
  return usePointerDrag<HTMLElement, PointerStart>({
    capture: false,
    resetKey: isEditing,
    onCancel: () => moves.cancel(),
    onStart: (event) => {
      event.stopPropagation();
      if (isEditing && connect.complete(id)) return null;
      const isToggle = isToggleEvent(event);
      const wasSelected = selection.selected.has(id);
      if (isToggle || !wasSelected) selection.select(id, isToggle);
      const state = {
        x: event.clientX,
        y: event.clientY,
        isDragging: false,
        wasSelected,
        isToggle,
      };
      if (isEditing && !isToggle) {
        moves.begin(id);
        capturePointer(event);
      }
      return state;
    },
    onMove: (event, active) => {
      if (!isEditing || active.isToggle) return;
      const delta = { x: event.clientX - active.x, y: event.clientY - active.y };
      if (!active.isDragging && Math.hypot(delta.x, delta.y) < dragThreshold) return;
      active.isDragging = true;
      moves.drag(delta);
    },
    onEnd: (_event, active, isCancelled) => {
      if (isCancelled || (active.isDragging && !isEditing)) {
        moves.cancel();
        return;
      }
      if (active.isDragging) moves.end();
      else {
        moves.cancel();
        if (active.wasSelected && !active.isToggle) selection.replace([id]);
      }
    },
  });
}

/** The keys a focused node handles: selection, moves, removal, connection and navigation. */
function useNodeKeys(node: DiagramNode, controller: DiagramController) {
  const { selection, moves, connect, isEditing } = controller;
  const navigate = (direction: DiagramDirection) => {
    const next = findConnectedNode({
      id: node.id,
      direction,
      nodes: controller.nodes,
      edges: controller.edges,
    });
    if (next !== undefined) controller.focusNode(next);
  };
  const remove = () => {
    const index = controller.nodes.findIndex((item) => item.id === node.id);
    const next = controller.nodes.find(
      (item, position) => position > index && !selection.selected.has(item.id),
    );
    moves.remove(node.id);
    if (next) controller.focusNode(next.id);
  };
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    const direction = arrowDirections[event.key];
    let isHandled = true;
    if (direction && (!isEditing || event.altKey)) navigate(direction);
    else if (direction) moves.step(node.id, { direction, large: event.shiftKey });
    else if (event.key === ' ') selection.select(node.id, isToggleEvent(event));
    else if (event.key === 'Enter') isHandled = connect.complete(node.id);
    else if (event.key === 'Escape' && connect.connecting) connect.cancel();
    else if ((event.key === 'Delete' || event.key === 'Backspace') && isEditing) remove();
    else isHandled = false;
    if (isHandled) event.preventDefault();
  };
}

/** One node: a focusable, named group at its position, holding the caller's content and its ports. */
export function DiagramNodeView<T>({
  node,
  controller,
  description,
  renderNode,
}: DiagramNodeViewProps<T>) {
  const strings = useUiStrings();
  const descriptionId = useId();
  const element = useRef<HTMLDivElement>(null);
  const rect = resolveNodeRect(node);
  const isSelected = controller.selection.selected.has(node.id);
  const isConnectSource = controller.connect.connecting?.node === node.id;
  const pointer = useNodePointer(node.id, controller);
  const onKeyDown = useNodeKeys(node, controller);
  const { reveal } = controller.view;
  const revealRef = useRef(() => reveal(rect));
  revealRef.current = () => reveal(rect);
  // Keep a node moved by the keyboard in view.
  useEffect(() => {
    if (element.current && element.current === element.current.ownerDocument.activeElement) {
      revealRef.current();
    }
  }, [node.x, node.y]);
  const text = [node.description, isSelected ? strings.diagramSelected : '', description];
  return (
    <div
      {...hooks.slot('node', {
        selected: isSelected,
        moving: controller.moves.preview?.has(node.id) ?? false,
        connectSource: isConnectSource,
      })}
      ref={mergeRefs(element, controller.registerTarget({ node: node.id }))}
      role="group"
      tabIndex={0}
      aria-roledescription={strings.diagramNode}
      aria-label={node.label}
      aria-describedby={descriptionId}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
      onKeyDown={onKeyDown}
      onFocus={(event) => {
        if (event.target === event.currentTarget) reveal(rect);
      }}
      {...pointer}
    >
      {renderNode ? (
        renderNode(node, { isSelected, isEditing: controller.isEditing })
      ) : (
        <span {...hooks.slot('node-label')}>{node.label}</span>
      )}
      {node.ports?.map((port) => (
        <DiagramPortView key={port.id} node={node} port={port} controller={controller} />
      ))}
      <span id={descriptionId} hidden>
        {text.filter(Boolean).join(' ')}
      </span>
    </div>
  );
}
