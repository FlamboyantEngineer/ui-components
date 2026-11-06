// Comma-separated values by RFC 4180: Windows line breaks between rows, and a cell holding the
// delimiter, a quote or a line break wrapped in quotes with its quotes doubled.

/** How `formatCsv` writes its text. */
export interface CsvOptions {
  /** The cell delimiter, one character. Defaults to a comma. */
  delimiter?: string | undefined;
  /**
   * Prefixes an apostrophe to text a spreadsheet would read as a formula: text starting with `=`,
   * `+`, `-`, `@`, a tab or a carriage return, except a plain number. Defaults to true.
   */
  escapeFormulas?: boolean | undefined;
}

/** The byte order mark that tells spreadsheet applications a file is UTF-8. */
export const CSV_BYTE_ORDER_MARK = '﻿';

const formulaStart = /^[=+\-@\t\r]/;
const plainNumber = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

function guardFormula(text: string): string {
  return formulaStart.test(text) && !plainNumber.test(text) ? `'${text}` : text;
}

function quoteCell(text: string, delimiter: string): string {
  const needsQuotes = text.includes(delimiter) || /["\n\r]/.test(text);
  return needsQuotes ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Rows of cell text as comma-separated values: cells joined by the delimiter, rows by Windows line
 * breaks, with no final line break and no byte order mark.
 */
export function formatCsv(rows: readonly (readonly string[])[], options: CsvOptions = {}): string {
  const { delimiter = ',', escapeFormulas = true } = options;
  if (delimiter.length !== 1 || /["\n\r]/.test(delimiter)) {
    throw new Error('A CSV delimiter is one character other than a quote or a line break.');
  }
  return rows
    .map((cells) =>
      cells
        .map((cell) => quoteCell(escapeFormulas ? guardFormula(cell) : cell, delimiter))
        .join(delimiter),
    )
    .join('\r\n');
}
