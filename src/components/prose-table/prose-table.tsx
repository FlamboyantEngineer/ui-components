import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';

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

export interface ProseTableProps {
  /** Column headings, one per column. */
  header: readonly ProseTableCell[];
  /** Body rows. A row with fewer cells than headings is padded with empty cells. */
  rows: readonly ProseTableRow[];
  className?: string | undefined;
  id?: string | undefined;
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('prose-table');

/** A static table inside running text: column headings and body rows, nothing interactive. */
export function ProseTable({
  header,
  rows,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: ProseTableProps) {
  return (
    <table
      {...hooks.root({ className, props: rest })}
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
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
