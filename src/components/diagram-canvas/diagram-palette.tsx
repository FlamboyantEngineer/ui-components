'use client';

import { createContext, useContext, useMemo, type HTMLAttributes, type RefObject } from 'react';
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
  return useMemo(
    () => ({
      isEnabled: isEditing && onNodeAdd !== undefined,
      add: (type, at) => {
        const centre = { x: (size?.width ?? 0) / 2, y: (size?.height ?? 0) / 2 };
        const point = toDiagramPoint(viewport, at ?? centre);
        onNodeAdd?.({ type, x: snapToGrid(point.x, gridSize), y: snapToGrid(point.y, gridSize) });
      },
    }),
    [isEditing, onNodeAdd, viewport, size, gridSize],
  );
}

/** Makes the viewport element accept palette items dropped on it. */
export function usePaletteDrop({
  ref,
  palette,
}: {
  ref: RefObject<HTMLElement | null>;
  palette: DiagramPalette;
}): { dropProps: HTMLAttributes<HTMLElement>; isDropTarget: boolean } {
  const { dropProps, isDropTarget } = useDrop({
    ref,
    isDisabled: !palette.isEnabled,
    getDropOperation: (types) => (types.has(paletteDragType) ? 'copy' : 'cancel'),
    onDrop: (event) => {
      for (const item of event.items) {
        if (item.kind === 'text' && item.types.has(paletteDragType)) {
          const point = { x: event.x, y: event.y };
          // A drop whose text cannot be read adds nothing.
          void item.getText(paletteDragType).then(
            (type) => palette.add(type, point),
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
