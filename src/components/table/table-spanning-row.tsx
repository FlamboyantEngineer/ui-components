'use client';

// The cell element every table cell renders, and the full-width rows whose one cell spans every
// column: detail rows and the notice row.

import { useContext, useId, type FocusEvent, type JSX, type ReactNode } from 'react';
import { Cell, Row, TableStateContext, type CellRenderProps } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';

type CellElementProps = JSX.IntrinsicElements['td' | 'div'];

/**
 * A cell's element. A control inside the cell that takes focus makes the cell the grid's focused
 * cell, so the grid keeps focus on the control. React Aria skips that while focus is visible, and
 * then moves focus back to the row or cell it focused last, or to the first row.
 */
function TableCellElement({
  props,
  cellKey,
  isVirtualized,
  isInRange,
}: {
  props: CellElementProps;
  cellKey: CellRenderProps['id'];
  isVirtualized: boolean;
  isInRange: boolean;
}) {
  const state = useContext(TableStateContext);
  const onFocus = (event: FocusEvent<HTMLTableCellElement & HTMLDivElement>) => {
    const cell = event.currentTarget;
    if (cellKey !== undefined && event.target !== cell && cell.contains(event.target)) {
      state?.selectionManager.setFocusedKey(cellKey);
    }
    props.onFocus?.(event);
  };
  // Cells inside a range of selected cells are marked selected for assistive technology.
  const selected = isInRange ? { 'aria-selected': 'true' as const } : {};
  return isVirtualized ? (
    <div {...(props as JSX.IntrinsicElements['div'])} {...selected} onFocus={onFocus} />
  ) : (
    <td {...(props as JSX.IntrinsicElements['td'])} {...selected} onFocus={onFocus} />
  );
}

export function renderCellElement(isVirtualized: boolean, isInRange = false, elementId?: string) {
  return (props: CellElementProps, { id }: { id?: Key | undefined }) => (
    <TableCellElement
      props={elementId === undefined ? props : { ...props, id: elementId }}
      cellKey={id}
      isVirtualized={isVirtualized}
      isInRange={isInRange}
    />
  );
}

/** A row element named by the element `labelId`. */
function renderLabelledRow(isVirtualized: boolean, labelId: string) {
  return (props: JSX.IntrinsicElements['tr' | 'div']) =>
    isVirtualized ? (
      <div {...(props as JSX.IntrinsicElements['div'])} aria-labelledby={labelId} />
    ) : (
      <tr {...(props as JSX.IntrinsicElements['tr'])} aria-labelledby={labelId} />
    );
}

interface TableSpanningRowProps {
  id: string;
  textValue: string;
  isVirtualized: boolean;
  colSpan: number;
  /** The row's hook class and data attributes. */
  rowHooks: object;
  cellClassName: string;
  children: ReactNode;
}

/**
 * A focusable, never selectable row whose one cell spans every column. React Aria names a row by
 * its row header cells, which this row does not render, so the row is named by its cell instead.
 */
export function TableSpanningRow(props: TableSpanningRowProps) {
  const cellId = useId();
  return (
    <Row
      id={props.id}
      textValue={props.textValue}
      isDisabled
      disabledBehavior="selection"
      render={renderLabelledRow(props.isVirtualized, cellId)}
      {...props.rowHooks}
    >
      <Cell
        colSpan={props.colSpan}
        className={props.cellClassName}
        render={renderCellElement(props.isVirtualized, false, cellId)}
      >
        {props.children}
      </Cell>
    </Row>
  );
}
