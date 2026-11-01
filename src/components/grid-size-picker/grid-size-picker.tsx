'use client';

import { getOwnerDocument } from '../../utils/owner-window.js';
import { isFocusLost } from '../../utils/focus-target.js';
import { useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { useHover, useLocale, usePress } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeProps } from '../../utils/merge-props.js';
import { getShownGridSize, moveGridSize, type GridSize } from './grid-size.js';
import { useScopedDisabled } from '../field/field.js';

export type { GridSize } from './grid-size.js';

export interface GridSizePickerProps extends BaseProps, AriaLabellingProps {
  /** Called with the size of the cell the reader presses, or of the focused cell on Enter or Space. */
  onSelect: (size: GridSize) => void;
  /** The most rows the grid grows to. Defaults to 10. */
  maxRows?: number | undefined;
  /** The most columns the grid grows to. Defaults to 10. */
  maxColumns?: number | undefined;
  /** The rows shown before the grid grows one row past the previewed size. Defaults to 5. */
  minRows?: number | undefined;
  /** The columns shown before the grid grows one column past the previewed size. Defaults to 5. */
  minColumns?: number | undefined;
  /** Leaves the grid out of the tab order and ignores presses and keys. */
  isDisabled?: boolean | undefined;
  /** Focuses the first cell when the picker mounts. */
  autoFocus?: boolean | undefined;
}

interface GridCellProps {
  rows: number;
  columns: number;
  preview: GridSize;
  /** The cell that holds the tab stop and that the keys move from. */
  focused: GridSize;
  isDisabled: boolean;
  onPreview: (size: GridSize) => void;
  onFocusCell: (size: GridSize) => void;
  onSelect: (size: GridSize) => void;
  focusRef: (node: HTMLDivElement | null) => void;
}

function isSameSize(left: GridSize, right: GridSize): boolean {
  return left.rows === right.rows && left.columns === right.columns;
}

function clampSize(size: GridSize, max: GridSize): GridSize {
  return { rows: Math.min(size.rows, max.rows), columns: Math.min(size.columns, max.columns) };
}

const hooks = createHooks('grid-size-picker', ['grid', 'row', 'cell', 'readout']);

function GridCell({
  rows,
  columns,
  preview,
  focused,
  isDisabled,
  onPreview,
  onFocusCell,
  onSelect,
  focusRef,
}: GridCellProps) {
  const strings = useUiStrings();
  const size = { rows, columns };
  const isPreview = isSameSize(size, preview);
  const isFocused = isSameSize(size, focused);
  // A press, or Enter or Space on the focused cell, chooses this cell's size: the focused cell,
  // not a hovered one, is the size the reader hears.
  const { pressProps } = usePress({ isDisabled, onPress: () => onSelect(size) });
  const { hoverProps } = useHover({ isDisabled, onHoverStart: () => onPreview(size) });
  return (
    <div
      {...mergeProps(pressProps, hoverProps)}
      {...hooks.slot('cell', {
        inRange: rows <= preview.rows && columns <= preview.columns,
        active: isPreview,
      })}
      ref={isFocused ? focusRef : undefined}
      role="gridcell"
      aria-label={strings.gridSizeCell(rows, columns)}
      tabIndex={isFocused && !isDisabled ? 0 : -1}
      onFocus={isDisabled ? undefined : () => onFocusCell(size)}
    />
  );
}

/**
 * The previewed size and the focused cell, and the keyboard handling that moves them and moves
 * focus along. The pointer previews the cell it hovers; focus and the keys move both the focused
 * cell and the preview, starting from the focused cell, so a hover never changes where the keys
 * go. Bounds that shrink below either clamp it for good, so growing them again does not bring back
 * a size the reader left; when that removes the focused cell, focus moves to the clamped one.
 */
function useGridPreview(max: GridSize, autoFocus: boolean) {
  const { direction } = useLocale();
  const [own, setOwn] = useState(() => {
    const first = { rows: 1, columns: 1 };
    return { preview: first, focused: first };
  });
  const preview = clampSize(own.preview, max);
  const focused = clampSize(own.focused, max);
  if (!isSameSize(preview, own.preview) || !isSameSize(focused, own.focused)) {
    setOwn({ preview, focused });
  }
  const setPreview = (size: GridSize) => setOwn((current) => ({ ...current, preview: size }));
  const focusCell = (size: GridSize) => setOwn({ preview: size, focused: size });
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cellRef = useRef<HTMLDivElement | null>(null);
  const shouldFocus = useRef(autoFocus);
  // Browsers fire no blur when they remove a focused cell, so this stays set until focus leaves.
  const hasFocus = useRef(false);
  useLayoutEffect(() => {
    const isLost = hasFocus.current && isFocusLost(getOwnerDocument(gridRef.current));
    if (!shouldFocus.current && !isLost) return;
    shouldFocus.current = false;
    cellRef.current?.focus();
  });
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = moveGridSize(focused, {
      key: event.key,
      isRtl: direction === 'rtl',
      isCorner: event.ctrlKey || event.metaKey,
      max,
    });
    if (!next) return;
    event.preventDefault();
    event.stopPropagation();
    shouldFocus.current = true;
    focusCell(next);
  };
  const focusRef = (node: HTMLDivElement | null) => {
    cellRef.current = node;
  };
  const gridProps = {
    ref: gridRef,
    onFocus: () => {
      hasFocus.current = true;
    },
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) hasFocus.current = false;
    },
  };
  return { preview, focused, setPreview, focusCell, move, focusRef, gridProps };
}

/**
 * Chooses a number of rows and columns, as for a new table, from a grid of cells: hovering or
 * focusing a cell previews its size, shown in a readout such as `3 × 4`, and the grid grows one row
 * and column past the preview up to its maximum. Arrow keys, Home and End move focus and the preview
 * from the focused cell; a press chooses the pressed cell, and Enter or Space the focused one.
 */
export function GridSizePicker({
  onSelect,
  maxRows = 10,
  maxColumns = 10,
  minRows = 5,
  minColumns = 5,
  isDisabled: ownDisabled,
  autoFocus = false,
  className,
  id,
  ...rest
}: GridSizePickerProps) {
  const strings = useUiStrings();
  const isDisabled = useScopedDisabled(ownDisabled);
  const max = { rows: maxRows, columns: maxColumns };
  const { preview, focused, setPreview, focusCell, move, focusRef, gridProps } = useGridPreview(
    max,
    autoFocus,
  );
  // The grid grows past the preview and keeps the focused cell, wherever the pointer is.
  const reach = {
    rows: Math.max(preview.rows, focused.rows),
    columns: Math.max(preview.columns, focused.columns),
  };
  const shown = getShownGridSize(reach, { min: { rows: minRows, columns: minColumns }, max });
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isDisabled) move(event);
  };
  const cell = {
    ...{ preview, focused, isDisabled, onSelect, focusRef },
    ...{ onPreview: setPreview, onFocusCell: focusCell },
  };
  return (
    <div {...hooks.root({ className, props: rest, data: { disabled: isDisabled } })} id={id}>
      <div
        {...hooks.slot('grid')}
        {...gridProps}
        role="grid"
        aria-label={
          rest['aria-labelledby'] ? undefined : (rest['aria-label'] ?? strings.gridSizePicker)
        }
        aria-labelledby={rest['aria-labelledby']}
        aria-describedby={rest['aria-describedby']}
        aria-details={rest['aria-details']}
        aria-disabled={isDisabled || undefined}
        onKeyDown={onKeyDown}
      >
        {Array.from({ length: shown.rows }, (_, row) => (
          <div {...hooks.slot('row')} key={row} role="row">
            {Array.from({ length: shown.columns }, (_, column) => (
              <GridCell key={column} rows={row + 1} columns={column + 1} {...cell} />
            ))}
          </div>
        ))}
      </div>
      <div {...hooks.slot('readout')} aria-hidden="true">
        {strings.gridSize(preview.rows, preview.columns)}
      </div>
    </div>
  );
}
