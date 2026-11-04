'use client';

// The cell element every table cell renders, and the full-width rows whose one cell spans every
// column: detail rows and the notice row.

import { type FocusEvent, type JSX, type ReactNode, useContext, useId } from 'react';
import type { Key } from '../../core/props.js';
import { Cell, type CellRenderProps, Row, TableStateContext } from '../../primitives/index.js';
import { keepTextControlKeys } from '../../utils/text-control-keys.js';

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
  // A text control in the cell keeps its caret keys from the grid's navigation and typeahead.
  const keyed = keepTextControlKeys(props);
  return isVirtualized ? (
    <div {...(keyed as JSX.IntrinsicElements['div'])} {...selected} onFocus={onFocus} />
  ) : (
    <td {...(keyed as JSX.IntrinsicElements['td'])} {...selected} onFocus={onFocus} />
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
export function renderLabelledRow(isVirtualized: boolean, labelId: string) {
  return (props: JSX.IntrinsicElements['tr' | 'div']) =>
    isVirtualized ? (
      <div {...(props as JSX.IntrinsicElements['div'])} aria-labelledby={labelId} />
    ) : (
      <tr {...(props as JSX.IntrinsicElements['tr'])} aria-labelledby={labelId} />
    );
}

/**
 * A row element named by `name` itself, whichever of its cells are row headers: React Aria names a
 * row by its row header cells, which may be empty in a structural row.
 */
export function renderNamedRow(isVirtualized: boolean, name: string) {
  return ({ 'aria-labelledby': _labelledBy, ...props }: JSX.IntrinsicElements['tr' | 'div']) =>
    isVirtualized ? (
      <div {...(props as JSX.IntrinsicElements['div'])} aria-label={name} />
    ) : (
      <tr {...(props as JSX.IntrinsicElements['tr'])} aria-label={name} />
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
