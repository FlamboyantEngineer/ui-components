'use client';

import {
  memo,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefCallback,
  type RefObject,
} from 'react';
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
import type { DiagramController, DiagramTarget } from './use-diagram-controller.js';

/** The states a canvas passes to `renderNode` with each node. */
export interface DiagramNodeRenderState {
  isSelected: boolean;
  /** The canvas is in edit mode. */
  isEditing: boolean;
}

interface DiagramNodeViewProps<T> {
  node: DiagramNode<T>;
  /**
   * The canvas's latest controller, read when the reader acts. The node renders from its other
   * props only, so a change elsewhere in the diagram does not render it again.
   */
  controller: RefObject<DiagramController>;
  /** The canvas's ref callback factory, the same function every render. */
  registerTarget: (target: DiagramTarget) => RefCallback<HTMLElement>;
  isSelected: boolean;
  isEditing: boolean;
  /** A move is being dragged that carries this node. */
  isMoving: boolean;
  /** The port of this node a connection starts from, or `null`. */
  connectPort: string | null;
  /** What the node's description reads after the caller's: its connections. */
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
function useNodePointer(id: Key, controller: RefObject<DiagramController>, isEditing: boolean) {
  return usePointerDrag<HTMLElement, PointerStart>({
    capture: false,
    resetKey: isEditing,
    onCancel: () => controller.current.moves.cancel(),
    onStart: (event) => {
      const { selection, moves, connect } = controller.current;
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
      controller.current.moves.drag(delta);
    },
    onEnd: (_event, active, isCancelled) => {
      const { selection, moves } = controller.current;
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

/** The node focus moves to once `id` (with the selection holding it) is removed, if any is left. */
function findNodeLeft(controller: DiagramController, id: Key): DiagramNode | undefined {
  const { nodes, selection } = controller;
  const removed = selection.selected.has(id) ? selection.selected : new Set([id]);
  const index = nodes.findIndex((item) => item.id === id);
  const isLeft = (item: DiagramNode) => !removed.has(item.id);
  return nodes.slice(index + 1).find(isLeft) ?? nodes.slice(0, index).findLast(isLeft);
}

/** The keys a focused node handles: selection, moves, removal, connection and navigation. */
function useNodeKeys(node: DiagramNode, controller: RefObject<DiagramController>) {
  const navigate = (direction: DiagramDirection) => {
    const { nodes, edges, focusNode } = controller.current;
    const next = findConnectedNode({ id: node.id, direction, nodes, edges });
    if (next !== undefined) focusNode(next);
  };
  // Focus goes to the next node left, else the previous one, else the viewport.
  const remove = () => {
    const current = controller.current;
    const left = findNodeLeft(current, node.id);
    current.moves.remove(node.id);
    if (left) current.focusNode(left.id);
    else current.viewportElement?.focus();
  };
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    const { selection, moves, connect, isEditing } = controller.current;
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
function DiagramNodeElement<T>({
  node,
  controller,
  registerTarget,
  isSelected,
  isEditing,
  isMoving,
  connectPort,
  description,
  renderNode,
}: DiagramNodeViewProps<T>) {
  const strings = useUiStrings();
  const descriptionId = useId();
  const element = useRef<HTMLDivElement>(null);
  const rect = resolveNodeRect(node);
  const pointer = useNodePointer(node.id, controller, isEditing);
  const onKeyDown = useNodeKeys(node, controller);
  const reveal = () => controller.current.view.reveal(rect);
  const revealRef = useRef(reveal);
  revealRef.current = reveal;
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
        moving: isMoving,
        connectSource: connectPort !== null,
      })}
      ref={mergeRefs(element, registerTarget({ node: node.id }))}
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
        if (event.target === event.currentTarget) reveal();
      }}
      {...pointer}
    >
      {renderNode ? (
        renderNode(node, { isSelected, isEditing })
      ) : (
        <span {...hooks.slot('node-label')}>{node.label}</span>
      )}
      {node.ports?.map((port) => (
        <DiagramPortView
          key={port.id}
          node={node}
          port={port}
          controller={controller}
          registerTarget={registerTarget}
          isEditing={isEditing}
          isConnectSource={connectPort === port.id}
        />
      ))}
      <span id={descriptionId} hidden>
        {text.filter(Boolean).join(' ')}
      </span>
    </div>
  );
}

/** A node, rendered again only when its own props change. */
export const DiagramNodeView = memo(DiagramNodeElement) as typeof DiagramNodeElement;
