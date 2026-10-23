import { describe, expect, it } from 'vitest';
import { defaultStrings } from '../../core/strings.js';
import { checkJsonText, createJsonChecker } from './json-check.js';
import type { JsonSchema } from './json-schema.js';

describe('JSON diagnostics', () => {
  it('UIC-JSON-EDITOR-5.1 maps errors across lines and keeps the first problem as the field message', () => {
    const source = '{\n "x": 0,\n "y": ["a",\n4]\n}';
    const result = checkJsonText(
      source,
      { properties: { x: { minimum: 1 }, y: { items: { type: 'string' } } } },
      defaultStrings,
    );
    expect(result.diagnostics).toEqual([
      { message: 'Enter 1 or more.', line: 2, column: 7, endLine: 2, endColumn: 8 },
      { message: 'Expected string.', line: 4, column: 1, endLine: 4, endColumn: 2 },
    ]);
    expect(result.issue).toEqual({
      severity: 'error',
      message: 'Line 2, column 7: Enter 1 or more.',
    });
  });

  it('UIC-JSON-EDITOR-5.1 reuses one schema check for the current text and checks changed text again', () => {
    let reads = 0;
    const schema: JsonSchema = {
      get type(): 'integer' {
        reads += 1;
        return 'integer';
      },
    };
    const check = createJsonChecker(schema, defaultStrings);
    expect(check('1').issue).toBeNull();
    const afterFirst = reads;
    expect(check('1').issue).toBeNull();
    expect(reads).toBe(afterFirst);
    expect(check('"x"').issue?.message).toBe('Line 1, column 1: Expected integer.');
    expect(reads).toBeGreaterThan(afterFirst);
    expect(check('').issue).toBeNull();
    expect(check('{').issue?.message).toMatch(/^Enter valid JSON/);
  });
});
