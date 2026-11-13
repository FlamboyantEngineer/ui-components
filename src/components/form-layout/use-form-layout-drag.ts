'use client';

import { type HTMLAttributes, type RefObject, useMemo, useRef, useState } from 'react';
import type { PressEvent } from '../../core/events.js';
import { useDrag, useDrop, useLocale } from '../../primitives/index.js';
import { armElementDrag, resolveDropPosition } from '../../utils/pointer-drag.js';
import { useDragType } from '../../utils/use-drag-type.js';
import { useItemDrag } from '../../utils/use-item-drag.js';
import { useLatest } from '../../utils/use-latest.js';
import {
  canPlaceFormLayoutNode,
  findFormLayoutNode,
  type FormLayoutArrangement,
  type FormLayoutPlace,
  type FormLayoutRules,
  type FormLayoutValue,
} from './form-layout-tree.js';

/** What every drag in one designer shares: its own media type, what is dragged, and the drop. */
export interface FormLayoutDrag {
  /** Unique to the designer, so other designers and drop targets refuse its nodes. */
  dragType: string;
  /** The id of the node being dragged. */
  draggingNode: RefObject<string | null>;
  /** Notes the key of the palette entry a drag starts from, or null when it ends. */
  setDraggingEntry: (key: string | null) => void;
  /** The place a drop at `target` makes, counted as a move does, or null when it is refused. */
  resolve: (target: FormLayoutPlace) => FormLayoutPlace | null;
  drop: (place: FormLayoutPlace) => void;
}

interface FormLayoutDragSource<D> {
  layout: FormLayoutValue<D>;
  rules: FormLayoutRules;
  /** The node type of the palette entry `key`. */
  entryType: (key: string) => string | undefined;
  onMove: (id: string, place: FormLayoutPlace) => void;
  onInsert: (key: string, place: FormLayoutPlace) => void;
}

/** The designer's drag and drop, each drop checked against the layout last rendered. */
export function useFormLayoutDrag<D>(source: FormLayoutDragSource<D>): FormLayoutDrag {
  const latest = useLatest(source);
  const dragType = useDragType('form-layout');
  const draggingNode = useRef<string | null>(null);
  const draggingEntry = useRef<string | null>(null);
  return useMemo(() => {
    const resolve = (target: FormLayoutPlace): FormLayoutPlace | null => {
      const { layout, rules, entryType } = latest.current;
      const id = draggingNode.current;
      if (id !== null) {
        const found = findFormLayoutNode(layout, id);
        if (!found) return null;
        const isSameParent = found.parentId === target.parentId;
        const index = isSameParent && found.index < target.index ? target.index - 1 : target.index;
        if (isSameParent && index === found.index) return null;
        const place = { parentId: target.parentId, index };
        return canPlaceFormLayoutNode(layout, rules, { type: found.node.type, id, place })
          ? place
          : null;
      }
      const type = draggingEntry.current === null ? undefined : entryType(draggingEntry.current);
      if (type === undefined) return null;
      return canPlaceFormLayoutNode(layout, rules, { type, place: target }) ? target : null;
    };
    const drop = (place: FormLayoutPlace) => {
      const id = draggingNode.current;
      if (id !== null) latest.current.onMove(id, place);
      else if (draggingEntry.current !== null)
        latest.current.onInsert(draggingEntry.current, place);
    };
    const setDraggingEntry = (key: string | null) => {
      draggingEntry.current = key;
    };
    return { dragType, draggingNode, setDraggingEntry, resolve, drop };
  }, [dragType, latest]);
}

/** Lets only the handle start a node's pointer drag, so presses in its preview never drag it. */
function armNode(event: PressEvent): void {
  const node = event.target.closest('[data-key]');
  if (event.pointerType === 'keyboard' || event.pointerType === 'virtual' || !node) return;
  armElementDrag(node);
}

interface NodeDropMove {
  position: 'before' | 'after';
  place: FormLayoutPlace;
}

export interface FormLayoutNodeDragOptions {
  ref: RefObject<HTMLDivElement | null>;
  id: string;
  label: string;
  /** Where the node sits now. */
  parentId: string | null;
  index: number;
  /** How the node's container lays it out, which decides whether before is above or to the left. */
  arrangement: FormLayoutArrangement;
  drag: FormLayoutDrag | null;
  isLocked: boolean;
}

/** One node's drag and drop: it drags from its handle and takes drops before or after itself. */
export function useFormLayoutNodeDrag(options: FormLayoutNodeDragOptions) {
  const { ref, id, label, parentId, index, arrangement, drag, isLocked } = options;
  const { direction } = useLocale();
  const resolveMove = (point: { x: number; y: number }): NodeDropMove | null => {
    const box = ref.current?.getBoundingClientRect();
    if (!drag || !box) return null;
    // A row or grid reads right to left in a right-to-left locale: its right half is before.
    const isAfter =
      resolveDropPosition({
        width: box.width,
        height: box.height,
        ...point,
        orientation: arrangement === 'stack' ? 'vertical' : 'horizontal',
        isRtl: direction === 'rtl',
      }) === 'after';
    const place = drag.resolve({ parentId, index: isAfter ? index + 1 : index });
    return place ? { position: isAfter ? 'after' : 'before', place } : null;
  };
  const item = useItemDrag<string, NodeDropMove>({
    ref,
    key: id,
    textValue: label,
    dragType: drag?.dragType ?? '',
    dragging: drag?.draggingNode ?? null,
    isDisabled: !drag || isLocked,
    isDropDisabled: !drag,
    resolveMove,
    onMove: (move) => drag?.drop(move.place),
  });
  // The node turns draggable only while its handle is pressed (`armNode`).
  const { draggable: _draggable, ...nodeProps } = item.dragProps;
  return {
    props: (drag ? nodeProps : {}) as HTMLAttributes<HTMLDivElement>,
    handleProps: { onPressStart: armNode, onPress: item.startDrag },
    isDragging: item.isDragging,
    dropPosition: item.dropPosition,
  };
}

/** The drop target at the end of a container (the top level when `parentId` is null). */
export function useFormLayoutSlotDrop(options: {
  ref: RefObject<HTMLDivElement | null>;
  parentId: string | null;
  index: number;
  drag: FormLayoutDrag | null;
}): { dropProps: HTMLAttributes<HTMLElement>; isDropTarget: boolean } {
  const { ref, parentId, index, drag } = options;
  const [isDropTarget, setDropTarget] = useState(false);
  const resolve = () => drag?.resolve({ parentId, index }) ?? null;
  const { dropProps } = useDrop({
    ref,
    isDisabled: !drag,
    getDropOperation: (types, allowed) =>
      drag && types.has(drag.dragType) && allowed.includes('move') && resolve() ? 'move' : 'cancel',
    onDropEnter: () => setDropTarget(resolve() !== null),
    onDropExit: () => setDropTarget(false),
    onDrop: () => {
      setDropTarget(false);
      const place = resolve();
      if (place) drag?.drop(place);
    },
  });
  return { dropProps, isDropTarget };
}

/** A palette entry's drag: it drags a new node of its type into the canvas. */
export function useFormLayoutEntryDrag(options: {
  entryKey: string;
  label: string;
  drag: FormLayoutDrag | null;
}): { dragProps: HTMLAttributes<HTMLElement>; isDragging: boolean } {
  const { entryKey, label, drag } = options;
  const { dragProps, isDragging } = useDrag({
    // The entry's own press adds its node; a keyboard or virtual press never starts a drag.
    hasDragButton: true,
    isDisabled: !drag,
    getItems: () => [{ [drag?.dragType ?? '']: entryKey, 'text/plain': label }],
    getAllowedDropOperations: () => ['move'],
    onDragStart: () => {
      drag?.setDraggingEntry(entryKey);
    },
    onDragEnd: () => {
      drag?.setDraggingEntry(null);
    },
  });
  return { dragProps, isDragging };
}
