import type { ReactNode } from 'react';
import {
  Cell,
  Collection,
  Row,
  TableBody as AriaTableBody,
  TableLoadMoreItem,
} from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { InlineError } from '../inline-error/inline-error.js';
import { tableHooks as hooks } from './table-hooks.js';
import { TableDataRow, type TableRowModel } from './table-row.js';
import type { TableRow } from './table-rows.js';
import { countTableColumns } from './table-structure.js';
import type { TableNode } from './table-tree.js';

/** The notice a table shows in place of its rows. */
export type TableStatus = 'loading' | 'empty' | 'error';

/** The rows, or the notice that replaces them. */
export interface TableBodyProps<T> {
  /** The rows of the current page, with their child rows. */
  nodes: readonly TableNode<T>[];
  model: TableRowModel<T>;
  status: TableStatus | null;
  /** The notice's text or content. */
  message: ReactNode;
  onRetry?: (() => void | Promise<unknown>) | undefined;
  /** Asks for more rows when the end of the rows scrolls into view. */
  onLoadMore?: (() => void) | undefined;
  /** More rows are loading: a loading row follows the rows. */
  isLoading?: boolean | undefined;
}

/** The key of the notice row, kept out of row actions. */
export const stateRowId = 'ui-table-state-row';

function TableStateRow<T>({ status, props }: { status: TableStatus; props: TableBodyProps<T> }) {
  const { message, onRetry } = props;
  return (
    <Row
      id={stateRowId}
      textValue={typeof message === 'string' ? message : status}
      // Focusable so a retry button stays reachable, never selectable.
      isDisabled
      disabledBehavior="selection"
      {...hooks.slot('state-row', { variant: status })}
    >
      <Cell
        colSpan={countTableColumns(props.model.structure)}
        className={hooks.slotClass('state-cell')}
      >
        {status === 'error' ? (
          <InlineError onRetry={onRetry}>{message}</InlineError>
        ) : (
          <EmptyState variant={status} size="sm" description={message} />
        )}
      </Cell>
    </Row>
  );
}

/** The loading row after the rows, which asks for more as it scrolls into view. */
function TableLoader({
  onLoadMore,
  isLoading,
}: Pick<TableBodyProps<unknown>, 'onLoadMore' | 'isLoading'>) {
  const strings = useUiStrings();
  return (
    <TableLoadMoreItem
      className={hooks.slotClass('loader')}
      onLoadMore={onLoadMore}
      isLoading={isLoading}
    >
      <EmptyState variant="loading" size="sm" description={strings.loading} />
    </TableLoadMoreItem>
  );
}

/** The table body: one row per item with its child rows, or one full-width notice row. */
export function TableBody<T extends TableRow>(props: TableBodyProps<T>) {
  const { status, nodes, model, onLoadMore, isLoading } = props;
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
        {(node) => <TableDataRow node={node} model={model} />}
      </Collection>
      {onLoadMore || isLoading ? (
        <TableLoader onLoadMore={onLoadMore} isLoading={isLoading} />
      ) : null}
    </AriaTableBody>
  );
}
