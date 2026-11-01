/** Copies a cell without the live track width or virtual position. */
function copyCell(source: HTMLElement, tag: 'th' | 'td'): HTMLTableCellElement {
  const cell = source.ownerDocument.createElement(tag);
  for (const attribute of source.attributes) {
    if (!['id', 'style', 'role'].includes(attribute.name))
      cell.setAttribute(attribute.name, attribute.value);
  }
  for (const child of source.childNodes) cell.append(child.cloneNode(true));
  for (const child of cell.querySelectorAll('[id]')) child.removeAttribute('id');
  // Virtualized cell hooks may use flex layout; fit those cells without changing that layout.
  Object.assign(cell.style, {
    width: 'max-content',
    minWidth: '0',
    maxWidth: 'none',
    height: 'auto',
  });
  return cell;
}

function appendRow(
  section: HTMLTableSectionElement,
  cells: Iterable<HTMLElement>,
  options: { grid: HTMLElement; tag: 'th' | 'td'; className?: string },
): void {
  const row = section.insertRow();
  row.className = options.className ?? '';
  for (const cell of cells) {
    if (
      cell.closest('.ui-table__grid') !== options.grid ||
      cell.parentElement?.closest('td, th, .ui-table__column, .ui-table__cell') ||
      cell.classList.contains('ui-table__column-group')
    )
      continue;
    row.append(copyCell(cell, options.tag));
  }
}

/** Native table layout also measures the cells rendered as positioned elements by virtualization. */
function prepareMeasurement(grid: HTMLElement): HTMLTableElement {
  const table = grid.ownerDocument.createElement('table');
  table.className = grid.className;
  table.setAttribute('aria-hidden', 'true');
  table.inert = true;
  Object.assign(table.style, {
    position: 'absolute',
    visibility: 'hidden',
    width: 'max-content',
    minWidth: '0',
    maxWidth: 'none',
    height: 'auto',
    tableLayout: 'auto',
  });
  const sourceHeader = grid.querySelector<HTMLElement>('.ui-table__header, thead');
  const header = table.createTHead();
  header.className = sourceHeader?.className ?? '';
  if (sourceHeader)
    appendRow(header, sourceHeader.querySelectorAll<HTMLElement>('.ui-table__column, th'), {
      grid,
      tag: 'th',
    });
  const body = table.createTBody();
  body.className = grid.querySelector('.ui-table__body, tbody')?.className ?? '';
  for (const sourceRow of grid.querySelectorAll<HTMLElement>('.ui-table__row, tbody > tr')) {
    if (
      sourceRow.closest('.ui-table__grid') !== grid ||
      sourceRow.parentElement?.closest('td, th, .ui-table__cell') ||
      sourceRow.matches(
        '.ui-table__group-row, .ui-table__detail-row, .ui-table__state-row, .ui-table__action-row',
      )
    )
      continue;
    appendRow(body, sourceRow.querySelectorAll<HTMLElement>('.ui-table__cell, td, th'), {
      grid,
      tag: 'td',
      className: sourceRow.className,
    });
  }
  return table;
}

/** Intrinsic header and rendered-cell widths in the containing page's typography and spacing. */
export function measureContentWidths(
  root: HTMLElement,
  columns: readonly string[],
): Readonly<Record<string, number>> | null {
  const grid = root.querySelector<HTMLElement>('.ui-table__grid');
  if (!grid || grid.getBoundingClientRect().width === 0) return null;
  const table = prepareMeasurement(grid);
  grid.parentElement?.append(table);
  try {
    const wanted = new Set(columns);
    const widths = Object.create(null) as Record<string, number>;
    for (const cell of table.querySelectorAll<HTMLElement>(
      ':scope > thead > tr > [data-column], :scope > tbody > tr > [data-column]',
    )) {
      const id = cell.dataset.column;
      if (!id || !wanted.has(id) || cell.closest('.ui-table__grid') !== table) continue;
      const width = Math.ceil(cell.getBoundingClientRect().width);
      if (width > 0) widths[id] = Math.max(widths[id] ?? 0, width);
    }
    return widths;
  } finally {
    table.remove();
  }
}
