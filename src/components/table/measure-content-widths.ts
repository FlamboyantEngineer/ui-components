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

interface RowOptions {
  grid: HTMLElement;
  /** The measured columns: only their cells are copied. */
  wanted: ReadonlySet<string>;
  tag: 'th' | 'td';
  className?: string;
}

function appendRow(
  section: HTMLTableSectionElement,
  cells: Iterable<HTMLElement>,
  options: RowOptions,
): void {
  const row = section.insertRow();
  row.className = options.className ?? '';
  for (const cell of cells) {
    if (
      !options.wanted.has(cell.dataset['column'] ?? '') ||
      cell.closest('.ui-table__grid') !== options.grid ||
      cell.parentElement?.closest('td, th, .ui-table__column, .ui-table__cell') ||
      cell.classList.contains('ui-table__column-group')
    )
      continue;
    row.append(copyCell(cell, options.tag));
  }
}

/**
 * Native table layout also measures the cells rendered as positioned elements by virtualization.
 * An auto-layout table sizes each column by its own cells, so only the measured columns are copied.
 */
function prepareMeasurement(grid: HTMLElement, wanted: ReadonlySet<string>): HTMLTableElement {
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
      wanted,
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
      wanted,
      tag: 'td',
      className: sourceRow.className,
    });
  }
  return table;
}

/** A layout length the scale of the measurement is read from: exact, unlike a rounded `offsetWidth`. */
const probeLength = 1000;

/**
 * Viewport pixels per layout pixel where the measurement table sits, through every ancestor
 * `transform` scale and CSS `zoom`: a hidden element of a known layout width, measured on screen.
 */
function measureScale(parent: HTMLElement): number {
  const probe = parent.ownerDocument.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  Object.assign(probe.style, {
    position: 'absolute',
    visibility: 'hidden',
    width: `${probeLength}px`,
    height: '0',
    padding: '0',
    border: '0',
  });
  parent.append(probe);
  const scale = probe.getBoundingClientRect().width / probeLength;
  probe.remove();
  return scale > 0 ? scale : 1;
}

/**
 * Intrinsic header and rendered-cell widths in the containing page's typography and spacing, in
 * layout pixels: the CSS widths that fit the content, whatever an ancestor's scale or zoom.
 */
export function measureContentWidths(
  root: HTMLElement,
  columns: readonly string[],
): Readonly<Record<string, number>> | null {
  const grid = root.querySelector<HTMLElement>('.ui-table__grid');
  if (!grid || grid.getBoundingClientRect().width === 0) return null;
  const parent = grid.parentElement;
  if (!parent) return null;
  const scale = measureScale(parent);
  const wanted = new Set(columns);
  const table = prepareMeasurement(grid, wanted);
  parent.append(table);
  try {
    const widths = Object.create(null) as Record<string, number>;
    for (const cell of table.querySelectorAll<HTMLElement>(
      ':scope > thead > tr > [data-column], :scope > tbody > tr > [data-column]',
    )) {
      const id = cell.dataset.column;
      if (!id || !wanted.has(id) || cell.closest('.ui-table__grid') !== table) continue;
      // Rounded up to whole layout pixels; a scaled rect's float error is no reason to add one.
      const width = Math.ceil(cell.getBoundingClientRect().width / scale - 0.001);
      if (width > 0) widths[id] = Math.max(widths[id] ?? 0, width);
    }
    return widths;
  } finally {
    table.remove();
  }
}
