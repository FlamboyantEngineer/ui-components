// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import * as lines from './markdown-lines.js';
import { parseMarkdown } from './parse-markdown.js';

describe('Markdown table cell construction', () => {
  for (const width of [32, 128, 512]) {
    for (const height of [1, 16]) {
      it(`UIC-MARKDOWN-1.13 splits each row once for ${width} columns and ${height} body rows`, () => {
        const header = '|' + Array.from({ length: width }, (_, i) => `Column ${i}|`).join('');
        const row = '|' + Array.from({ length: width }, (_, i) => `Value ${i}|`).join('');
        const source = [
          header,
          '|' + '---|'.repeat(width),
          ...Array<string>(height).fill(row),
        ].join('\n');
        // This imported boundary observes cell construction; classifier scans in markdown-lines
        // call their local splitter directly and are not counted here.
        const split = vi.spyOn(lines, 'splitTableCells');
        try {
          const [table] = parseMarkdown(source).children;
          expect(table?.type).toBe('table');
          if (table?.type !== 'table') throw new Error('Expected a table');
          expect(table.header).toHaveLength(width);
          expect(table.rows).toHaveLength(height);
          expect(table.header[0]).toEqual([{ type: 'text', text: 'Column 0' }]);
          expect(table.header.at(-1)).toEqual([{ type: 'text', text: `Column ${width - 1}` }]);
          for (const cells of table.rows) {
            expect(cells).toHaveLength(width);
            expect(cells[0]).toEqual([{ type: 'text', text: 'Value 0' }]);
            expect(cells.at(-1)).toEqual([{ type: 'text', text: `Value ${width - 1}` }]);
          }
          expect(split.mock.calls.reduce((total, [line]) => total + line.length, 0)).toBe(
            header.length + height * row.length,
          );
          expect(split).toHaveBeenCalledTimes(height + 1);
        } finally {
          split.mockRestore();
        }
      });
    }
  }
});
