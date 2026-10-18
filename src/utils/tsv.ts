// Tab-separated text as spreadsheets copy it: tabs between cells and line breaks between rows. A
// cell holding a tab, a line break or a quote is wrapped in quotes, with its quotes doubled.

const quotedCharacters = /[\t\n\r"]/;

function quoteCell(text: string): string {
  return quotedCharacters.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** The index of the next tab or line break at or after `index`, or the end of `text`. */
function findSeparator(text: string, index: number): number {
  for (let at = index; at < text.length; at += 1) {
    if (text[at] === '\t' || text[at] === '\n') return at;
  }
  return text.length;
}

/** A quoted cell from its opening quote: the text and the index after the closing quote. */
function readQuotedCell(text: string, start: number): [string, number] {
  let value = '';
  let index = start + 1;
  while (index < text.length) {
    const character = text[index];
    if (character === '"' && text[index + 1] === '"') {
      value += '"';
      index += 2;
    } else if (character === '"') {
      return [value, index + 1];
    } else {
      value += character;
      index += 1;
    }
  }
  return [value, index];
}

/** One cell from `index`: its text and the index of the separator after it. */
function readCell(text: string, index: number): [string, number] {
  if (text[index] !== '"') {
    const end = findSeparator(text, index);
    return [text.slice(index, end), end];
  }
  const [quoted, after] = readQuotedCell(text, index);
  // Text between a closing quote and the separator is kept, as spreadsheets do.
  const end = findSeparator(text, after);
  return [quoted + text.slice(after, end), end];
}

/** Rows of cell text as tab-separated text, quoting the cells that need it. */
export function formatTsv(rows: readonly (readonly string[])[]): string {
  return rows.map((cells) => cells.map(quoteCell).join('\t')).join('\n');
}

/**
 * Tab-separated text as rows of cell text. Quoted cells may hold tabs, line breaks and doubled
 * quotes; Windows line breaks read as one, and a final line break ends the last row. Empty text
 * has no rows.
 */
export function parseTsv(text: string): string[][] {
  if (text === '') return [];
  const normalized = text.replace(/\r\n?/g, '\n');
  const body = normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized;
  const rows: string[][] = [];
  let cells: string[] = [];
  let index = 0;
  while (index <= body.length) {
    const [cell, end] = readCell(body, index);
    cells.push(cell);
    if (body[end] !== '\t') {
      rows.push(cells);
      cells = [];
    }
    index = end + 1;
  }
  return rows;
}
