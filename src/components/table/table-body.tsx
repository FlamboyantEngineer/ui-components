'use client';

import type { ReactNode } from 'react';
import {
  Collection,
  TableBody as AriaTableBody,
  TableLoadMoreItem,
} from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { InlineError } from '../inline-error/inline-error.js';
import { tableHooks as hooks } from './table-hooks.js';
import { renderBodyNode } from './table-group-row.js';
import type { TableBodyNode } from './table-groups.js';
import type { TableRowModel } from './table-row-model.js';
import { TableSpanningRow } from './table-spanning-row.js';
import type { TableRow } from './table-rows.js';
import { countTableColumns } from './table-structure.js';

/** The notice a table shows in place of its rows. */
export type TableStatus = 'loading' | 'empty' | 'error';

/** The rows, or the notice that replaces them. */
export interface TableBodyProps<T> {
  /** The rows of the current page, with their child rows, under their groups when grouped. */
  nodes: readonly TableBodyNode<T>[];
  model: TableRowModel<T>;
  status: TableStatus | null;
  /** The notice's text or content. */
  message: ReactNode;
  onRetry?: (() => void | Promise<unknown>) | undefined;
  /** Asks for more rows when the end of the rows scrolls into view. */
  onLoadMore?: (() => void) | undefined;
  /** More rows are loading: a loading row follows the rows. */
  isLoading?: boolean | undefined;
  /** The loading row's text or content; the provider's `loading` string when omitted. */
  loadingMessage?: ReactNode;
}

/** The key of the notice row, kept out of row actions. */
const stateRowId = 'ui-table-state-row';

function TableStateRow<T>({ status, props }: { status: TableStatus; props: TableBodyProps<T> }) {
  const { message, onRetry } = props;
  // Focusable so a retry button stays reachable, never selectable.
  return (
    <TableSpanningRow
      id={stateRowId}
      textValue={typeof message === 'string' ? message : status}
      isVirtualized={props.model.structure.isVirtualized}
      colSpan={countTableColumns(props.model.structure)}
      rowHooks={hooks.slot('state-row', { variant: status })}
      cellClassName={hooks.slotClass('state-cell')}
    >
      {status === 'error' ? (
        <InlineError onRetry={onRetry}>{message}</InlineError>
      ) : (
        <EmptyState variant={status} size="sm" description={message} />
      )}
    </TableSpanningRow>
  );
}

/** The loading row after the rows, which asks for more as it scrolls into view. */
function TableLoader({
  onLoadMore,
  isLoading,
  loadingMessage,
}: Pick<TableBodyProps<unknown>, 'onLoadMore' | 'isLoading' | 'loadingMessage'>) {
  const strings = useUiStrings();
  return (
    <TableLoadMoreItem
      className={hooks.slotClass('loader')}
      // React Aria calls it whenever the end is in view; a request already loading waits.
      onLoadMore={() => {
        if (!isLoading) onLoadMore?.();
      }}
      isLoading={isLoading}
    >
      <EmptyState variant="loading" size="sm" description={loadingMessage ?? strings.loading} />
    </TableLoadMoreItem>
  );
}

/** The table body: one row per item with its child rows, or one full-width notice row. */
export function TableBody<T extends TableRow>(props: TableBodyProps<T>) {
  const { status, nodes, model, onLoadMore, isLoading, loadingMessage } = props;
  if (model.structure.columns.length === 0) {
    return <AriaTableBody className={hooks.slotClass('body')} />;
  }
  if (status) {
    return (
      <AriaTableBody className={hooks.slotClass('body')}>
        <TableStateRow status={status} props={props} />
      </AriaTableBody>
    );
  }
  return (
    <AriaTableBody className={hooks.slotClass('body')}>
      <Collection items={nodes} dependencies={[model]}>
        {(node) => renderBodyNode(node, model)}
      </Collection>
      {onLoadMore || isLoading ? (
        <TableLoader {...{ onLoadMore, isLoading, loadingMessage }} />
      ) : null}
    </AriaTableBody>
  );
}
