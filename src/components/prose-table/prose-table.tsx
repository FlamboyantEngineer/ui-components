import type { ReactNode } from 'react';
import { createHooks, dataAttributes } from '../../core/hooks.js';
import type { BaseProps, NativeProps, RefProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

/** Text alignment of a column, as in Markdown's `:---`, `:---:` and `---:`. */
export type ProseTableAlign = 'start' | 'center' | 'end';

export interface ProseTableCell {
  /** Stable within its row or heading list. */
  key: string;
  content: ReactNode;
}

/** A column heading, with the options that apply to every cell of its column. */
export interface ProseTableColumn extends ProseTableCell {
  /** Alignment of the heading and the column's cells. Unset, the stylesheet decides. */
  align?: ProseTableAlign | undefined;
  /** The column's cells name their rows, as `<th scope="row">`. */
  isRowHeader?: boolean | undefined;
}

export interface ProseTableRow {
  /** Stable within the table. */
  key: string;
  cells: readonly ProseTableCell[];
}

export interface ProseTableProps
  extends
    RefProps<HTMLTableElement>,
    BaseProps,
    Pick<NativeProps<'table'>, 'aria-label' | 'aria-labelledby'> {
  /** Column headings, one per column. */
  header: readonly ProseTableColumn[];
  /** Body rows. A row with fewer cells than headings is padded with empty cells. */
  rows: readonly ProseTableRow[];
  /** Footer rows, such as totals, after the body. Padded like body rows. */
  footer?: readonly ProseTableRow[] | undefined;
  /** Text that names the table, in a `<caption>`. Nullish, boolean and empty values add none. */
  caption?: ReactNode;
  /** Keep the column headings in view while a scrolling ancestor scrolls the rows. */
  stickyHeader?: boolean | undefined;
}

const hooks = createHooks('prose-table', ['caption']);

function ProseTableBodyCell({
  column,
  children,
}: {
  column: ProseTableColumn | undefined;
  children?: ReactNode;
}) {
  const data = dataAttributes({ align: column?.align });
  if (column?.isRowHeader) {
    return (
      <th {...data} scope="row">
        {children}
      </th>
    );
  }
  return <td {...data}>{children}</td>;
}

function renderRows(rows: readonly ProseTableRow[], header: readonly ProseTableColumn[]) {
  return rows.map((row) => (
    <tr key={row.key}>
      {row.cells.map((cell, index) => (
        <ProseTableBodyCell key={cell.key} column={header[index]}>
          {cell.content}
        </ProseTableBodyCell>
      ))}
      {header.slice(row.cells.length).map((column) => (
        <ProseTableBodyCell key={`missing:${column.key}`} column={column} />
      ))}
    </tr>
  ));
}

/** A static table inside running text: column headings, body and footer rows, nothing interactive. */
export function ProseTable({
  header,
  rows,
  footer,
  caption,
  stickyHeader = false,
  className,
  ...rest
}: ProseTableProps) {
  return (
    <table {...rest} {...hooks.root({ className, data: { stickyHeader } })}>
      {isEmptyNode(caption) ? null : <caption {...hooks.slot('caption')}>{caption}</caption>}
      <thead>
        <tr>
          {header.map((column) => (
            <th key={column.key} {...dataAttributes({ align: column.align })} scope="col">
              {column.content}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{renderRows(rows, header)}</tbody>
      {footer && footer.length > 0 ? <tfoot>{renderRows(footer, header)}</tfoot> : null}
    </table>
  );
}
