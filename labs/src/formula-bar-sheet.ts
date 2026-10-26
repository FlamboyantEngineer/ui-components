// A tiny formula language for the formula bar lab: what a caller supplies, not the library.

import type { CodeToken } from '../../src/components/code-editor/code-editor.js';
import type { Completion } from '../../src/components/completion-list/completion-list.js';
import { formatCellReference, parseCellReference } from '../../src/utils/cell-reference.js';
import { requireDefined } from '../../src/utils/require-defined.js';

/** Raw cell contents by A1 reference. */
export type SheetCells = Readonly<Record<string, string>>;

const tokenPattern = /[A-Z]+[0-9]+(?::[A-Z]+[0-9]+)?|[A-Z]+|[0-9]+(?:\.[0-9]+)?|"[^"]*"?|\s+|./gi;
const functions: Readonly<Record<string, (values: number[]) => number>> = {
  SUM: (values) => values.reduce((sum, value) => sum + value, 0),
  AVERAGE: (values) => values.reduce((sum, value) => sum + value, 0) / values.length,
  MIN: (values) => Math.min(...values),
  MAX: (values) => Math.max(...values),
};

export const formulaFunctions: Completion[] = Object.keys(functions).map((label) => ({
  label,
  kind: 'function',
  description: 'Function',
}));

function readTokenType(text: string): string | null {
  if (/^[A-Z]+[0-9]+(:[A-Z]+[0-9]+)?$/i.test(text)) return 'key';
  if (/^[A-Z]+$/i.test(text)) return text.toUpperCase() in functions ? 'keyword' : 'invalid';
  if (/^[0-9]/.test(text)) return 'number';
  if (text.startsWith('"')) return 'string';
  return /^[-+*/(),:=]$/.test(text) ? 'punctuation' : null;
}

/** Splits a cell's content into tokens: references, functions, numbers and operators. */
export function tokenizeFormula(source: string): CodeToken[] {
  if (!source.startsWith('=')) return [{ text: source }];
  return (source.match(tokenPattern) ?? []).map((text) => ({ text, type: readTokenType(text) }));
}

/** The references a range such as `B2:C3` covers, row by row. */
function expandRange(range: string): string[] {
  const [from, to] = range.split(':').map((part) => parseCellReference(part));
  if (!from || !to) throw new Error('#REF!');
  const references: string[] = [];
  for (let row = Math.min(from.row, to.row); row <= Math.max(from.row, to.row); row += 1) {
    for (
      let column = Math.min(from.column, to.column);
      column <= Math.max(from.column, to.column);
      column += 1
    ) {
      references.push(formatCellReference({ row, column }));
    }
  }
  return references;
}

/** Evaluates an expression after `=`: numbers, references, + − × ÷, brackets and functions. */
function evaluateExpression(expression: string, readCell: (reference: string) => number): number {
  const tokens = (expression.match(tokenPattern) ?? []).filter((token) => token.trim() !== '');
  let index = 0;
  const take = () => tokens[index++];
  const expect = (token: string) => {
    if (take() !== token) throw new Error('#ERROR');
  };
  const call = (name: string): number => {
    const apply = functions[name.toUpperCase()];
    if (!apply) throw new Error('#NAME?');
    expect('(');
    const values: number[] = [];
    do {
      const token = tokens[index] ?? '';
      if (token.includes(':')) values.push(...expandRange(requireDefined(take())).map(readCell));
      else values.push(sum());
    } while (tokens[index] === ',' && take());
    expect(')');
    return apply(values);
  };
  const primary = (): number => {
    const token = take();
    if (token === undefined) throw new Error('#ERROR');
    if (token === '(') {
      const value = sum();
      expect(')');
      return value;
    }
    if (token === '-') return -primary();
    if (/^[0-9]/.test(token)) return Number(token);
    if (/^[A-Z]+$/i.test(token)) return call(token);
    if (parseCellReference(token)) return readCell(token.toUpperCase());
    throw new Error('#ERROR');
  };
  const product = (): number => {
    let value = primary();
    while (tokens[index] === '*' || tokens[index] === '/') {
      value = take() === '*' ? value * primary() : value / primary();
    }
    return value;
  };
  const sum = (): number => {
    let value = product();
    while (tokens[index] === '+' || tokens[index] === '-') {
      value = take() === '+' ? value + product() : value - product();
    }
    return value;
  };
  const value = sum();
  if (index < tokens.length) throw new Error('#ERROR');
  return value;
}

/** The value a cell shows: its text, or its formula's result or error code. */
export function evaluateCell(
  content: string,
  cells: SheetCells,
  seen: ReadonlySet<string> = new Set(),
): string {
  if (!content.startsWith('=')) return content;
  const readCell = (reference: string): number => {
    if (seen.has(reference)) throw new Error('#CYCLE!');
    const shown = evaluateCell(cells[reference] ?? '', cells, new Set([...seen, reference]));
    if (shown.startsWith('#')) throw new Error(shown);
    const value = shown.trim() === '' ? 0 : Number(shown);
    if (Number.isNaN(value)) throw new Error('#VALUE!');
    return value;
  };
  try {
    const value = evaluateExpression(content.slice(1), readCell);
    return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : '#DIV/0!';
  } catch (error) {
    return error instanceof Error && error.message.startsWith('#') ? error.message : '#ERROR';
  }
}
