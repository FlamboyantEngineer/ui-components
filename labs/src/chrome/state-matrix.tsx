import { Fragment, type ReactNode } from 'react';

type Axes = Readonly<Record<string, readonly string[]>>;

export type MatrixCell<A extends Axes> = { [K in keyof A]: A[K][number] };

export interface StateMatrixProps<A extends Axes> {
  /** Ordered axes. The last axis becomes the columns; the others multiply into rows. */
  axes: A;
  render: (cell: MatrixCell<A>) => ReactNode;
  caption?: string;
}

function multiplyAxes(axes: Array<[string, readonly string[]]>): Array<Record<string, string>> {
  return axes.reduce<Array<Record<string, string>>>(
    (rows, [name, values]) =>
      rows.flatMap((row) => values.map((value) => ({ ...row, [name]: value }))),
    [{}],
  );
}

function formatCellId(cell: Record<string, string>): string {
  return Object.entries(cell)
    .map(([name, value]) => `${name}=${value}`)
    .join(' ');
}

/**
 * Renders every combination of the axes side by side, one table cell each. Cells carry
 * `data-lab-cell="axis=value …"` so browser tests and screenshots can address them.
 * A plain table keeps the grid readable even with no stylesheet.
 */
export function StateMatrix<const A extends Axes>({ axes, render, caption }: StateMatrixProps<A>) {
  const entries = Object.entries(axes) as Array<[string, readonly string[]]>;
  const columnAxis = entries.at(-1);
  if (!columnAxis) return null;
  const [columnName, columnValues] = columnAxis;
  const rowAxes = entries.slice(0, -1);
  const rows = multiplyAxes(rowAxes);
  const rowLabel = rowAxes.map(([name]) => name).join(' · ');

  return (
    <table data-lab-matrix={entries.map(([name]) => name).join(' ')} cellPadding={8}>
      {caption ? <caption>{caption}</caption> : null}
      <thead>
        <tr>
          <th scope="col">{rowLabel ? `${rowLabel} \\ ${columnName}` : columnName}</th>
          {columnValues.map((value) => (
            <th key={value} scope="col">
              {value}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const id = formatCellId(row);
          return (
            <tr key={id || 'row'}>
              <th scope="row">{Object.values(row).join(' · ') || '—'}</th>
              {columnValues.map((value) => {
                const cell = { ...row, [columnName]: value };
                return (
                  <td key={value} data-lab-cell={formatCellId(cell)}>
                    <Fragment>{render(cell as MatrixCell<A>)}</Fragment>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
