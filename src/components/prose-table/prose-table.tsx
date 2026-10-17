import type { ReactNode, TableHTMLAttributes } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';

export interface ProseTableCell {
  /** Stable within its row or heading list. */
  key: string;
  content: ReactNode;
}

export interface ProseTableRow {
  /** Stable within the table. */
  key: string;
  cells: readonly ProseTableCell[];
}

export interface ProseTableProps
  extends BaseProps, Pick<TableHTMLAttributes<HTMLTableElement>, 'aria-label' | 'aria-labelledby'> {
  /** Column headings, one per column. */
  header: readonly ProseTableCell[];
  /** Body rows. A row with fewer cells than headings is padded with empty cells. */
  rows: readonly ProseTableRow[];
}

const hooks = createHooks('prose-table');

/** A static table inside running text: column headings and body rows, nothing interactive. */
export function ProseTable({ header, rows, className, ...rest }: ProseTableProps) {
  return (
    <table {...rest} {...hooks.root({ className })}>
      <thead>
        <tr>
          {header.map((cell) => (
            <th key={cell.key} scope="col">
              {cell.content}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            {row.cells.map((cell) => (
              <td key={cell.key}>{cell.content}</td>
            ))}
            {header.slice(row.cells.length).map((heading) => (
              <td key={`missing:${heading.key}`} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
