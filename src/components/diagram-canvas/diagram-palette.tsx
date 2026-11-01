'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
  type RefObject,
} from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { useDrag, useDrop } from '../../primitives/index.js';
import type { BaseProps } from '../../core/props.js';
import { mergeProps } from '../../utils/merge-props.js';
import { Icon, type IconSource } from '../icon/icon.js';
import { toIconProps } from '../icon/icon.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import { snapToGrid, toDiagramPoint } from './diagram-model.js';
import type { DiagramPoint } from './edge-route.js';
import type { DiagramController } from './use-diagram-controller.js';

export interface DiagramPaletteItemProps extends BaseProps {
  /** What the item adds, handed to the canvas's `onNodeAdd`. */
  type: string;
  /** The item's text and accessible name. */
  label: string;
  /** A decorative icon before the label. */
  icon?: IconSource | undefined;
}

export interface DiagramPalette {
  /** Asks for a node of `type` at a point of the viewport element, by default its centre. */
  add: (type: string, at?: DiagramPoint) => void;
  /** The grid point of the diagram under a point of the viewport element, as it is shown now. */
  place: (at: DiagramPoint) => DiagramPoint;
  /** Asks for a node of `type` at a grid point of the diagram, while new nodes are allowed. */
  request: (type: string, at: DiagramPoint) => void;
  isEnabled: boolean;
}

export const DiagramPaletteContext = createContext<DiagramPalette | null>(null);

// The drag type a palette item carries, so the canvas only accepts palette items.
const paletteDragType = 'application/x-ui-diagram-node';

/** The palette of a canvas: adding asks the caller for a node at a grid point of the view. */
export function useCanvasPalette({
  controller,
  gridSize,
  onNodeAdd,
}: {
  controller: DiagramController;
  gridSize: number;
  onNodeAdd: ((request: { type: string; x: number; y: number }) => void) | undefined;
}): DiagramPalette {
  const { viewport, size } = controller.view;
  const { isEditing } = controller;
  return useMemo(() => {
    const isEnabled = isEditing && onNodeAdd !== undefined;
    const place = (at: DiagramPoint) => {
      const point = toDiagramPoint(viewport, at);
      return { x: snapToGrid(point.x, gridSize), y: snapToGrid(point.y, gridSize) };
    };
    const request = (type: string, { x, y }: DiagramPoint) => {
      if (isEnabled) onNodeAdd?.({ type, x, y });
    };
    return {
      isEnabled,
      place,
      request,
      add: (type, at) =>
        request(type, place(at ?? { x: (size?.width ?? 0) / 2, y: (size?.height ?? 0) / 2 })),
    };
  }, [isEditing, onNodeAdd, viewport, size, gridSize]);
}

/** Makes the viewport element accept palette items dropped on it. */
export function usePaletteDrop({
  ref,
  palette,
}: {
  ref: RefObject<HTMLElement | null>;
  palette: DiagramPalette;
}): { dropProps: HTMLAttributes<HTMLElement>; isDropTarget: boolean } {
  // Each drop reads its item's text before it adds; a drop still reading when new nodes stop being
  // allowed, or the canvas goes, belongs to a session that has ended and adds nothing.
  const session = useRef(0);
  const latest = useLatest(palette);
  useEffect(() => {
    if (!palette.isEnabled) session.current += 1;
  }, [palette.isEnabled]);
  useEffect(() => {
    const sessions = session;
    return () => {
      sessions.current += 1;
    };
  }, []);
  const { dropProps, isDropTarget } = useDrop({
    ref,
    isDisabled: !palette.isEnabled,
    getDropOperation: (types) => (types.has(paletteDragType) ? 'copy' : 'cancel'),
    onDrop: (event) => {
      for (const item of event.items) {
        if (item.kind === 'text' && item.types.has(paletteDragType)) {
          // The grid point under the drop as the view stood then; the current callback asks.
          const at = palette.place({ x: event.x, y: event.y });
          const ticket = session.current;
          // A drop whose text cannot be read adds nothing.
          void item.getText(paletteDragType).then(
            (type) => {
              if (session.current === ticket) latest.current.request(type, at);
            },
            () => undefined,
          );
          return;
        }
      }
    },
  });
  return { dropProps, isDropTarget };
}

/**
 * An entry of a diagram canvas's palette. Pressing it adds a node of its type in the middle of the
 * view; dragging it onto the canvas adds one where it is dropped. Outside an editing canvas that
 * takes new nodes it is disabled.
 */
export function DiagramPaletteItem({
  type,
  label,
  icon,
  className,
  ...rest
}: DiagramPaletteItemProps) {
  const palette = useContext(DiagramPaletteContext);
  const isDisabled = !palette?.isEnabled;
  const { dragProps } = useDrag({
    getItems: () => [{ [paletteDragType]: type, 'text/plain': label }],
    getAllowedDropOperations: () => ['copy'],
    hasDragButton: true,
    isDisabled,
  });
  return (
    <button
      {...mergeProps(rest, dragProps)}
      {...hooks.slot('palette-item', { disabled: isDisabled }, className)}
      type="button"
      disabled={isDisabled}
      onClick={() => palette?.add(type)}
    >
      {icon ? <Icon {...toIconProps(icon)} /> : null}
      {label}
    </button>
  );
}
