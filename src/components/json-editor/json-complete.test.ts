import { describe, expect, it } from 'vitest';
import type { CodeCompletionResult } from '../code-editor/code-editor.js';
import { createJsonCompletion, describeJsonAt } from './json-complete.js';
import type { JsonSchema } from './json-schema.js';

const recipe: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'What the dish is called.' },
    servings: { type: 'integer' },
    course: { enum: ['starter', 'main'], description: 'When it is served.' },
    vegetarian: { type: 'boolean', default: true },
    oven: { const: 'fan' },
    tags: { type: 'array', items: { type: 'string', enum: ['warm', 'cold'] } },
    note: { type: ['null', 'string'] },
    steps: { type: 'object' },
  },
};

const complete = createJsonCompletion(recipe);

/** The source's answer for text with `|` at the caret. */
function answer(source: string, isExplicit = false) {
  const caret = source.indexOf('|');
  const value = source.replace('|', '');
  return complete({ value, caret, query: '', isExplicit }) as CodeCompletionResult | [];
}

function labels(source: string, isExplicit = false) {
  const result = answer(source, isExplicit);
  return 'options' in result ? result.options.map(({ label }) => label) : [];
}

describe('JSON completion from a schema', () => {
  it('UIC-JSON-EDITOR-5.2 completes the keys an object does not have yet, with a starting value', () => {
    expect(labels('{"name": "Soup", "|"}')).toEqual([
      '"servings"',
      '"course"',
      '"vegetarian"',
      '"oven"',
      '"tags"',
      '"note"',
      '"steps"',
    ]);
    const result = answer('{"na|"}');
    expect(result).toMatchObject({ from: 1, to: 5 });
    const options = 'options' in result ? result.options : [];
    expect(options[0]).toEqual({
      label: '"name"',
      kind: 'property',
      description: 'string',
      documentation: 'What the dish is called.',
      insertText: '"name": "${}"',
    });
    const inserts = Object.fromEntries(options.map(({ label, insertText }) => [label, insertText]));
    expect(inserts).toMatchObject({
      '"servings"': '"servings": ${0}',
      '"course"': '"course": ${"starter"}',
      '"vegetarian"': '"vegetarian": ${true}',
      '"tags"': '"tags": [${}]',
      '"note"': '"note": null',
      '"steps"': '"steps": {${}}',
    });
    expect(answer('{"na|": 1}')).toMatchObject({
      options: expect.arrayContaining([expect.objectContaining({ insertText: '"name"' })]),
    });
  });

  it('UIC-JSON-EDITOR-5.3 completes the values a schema lists or allows', () => {
    expect(labels('{"course": |')).toEqual(['"starter"', '"main"']);
    expect(answer('{"course": |')).toMatchObject({
      options: expect.arrayContaining([
        expect.objectContaining({ kind: 'value', documentation: 'When it is served.' }),
      ]),
    });
    expect(labels('{"vegetarian": |')).toEqual(['true', 'false']);
    expect(labels('{"oven": "f|"}')).toEqual(['"fan"']);
    expect(labels('{"note": |')).toEqual(['null']);
    expect(labels('{"tags": ["|"]}')).toEqual(['"warm"', '"cold"']);
    expect(labels('{"name": |')).toEqual([]);
    expect(labels('{"unknown": |')).toEqual([]);
  });

  it('UIC-JSON-EDITOR-5.4 answers while typing, after a colon and on request only', () => {
    expect(labels('{|}')).toEqual([]);
    expect(labels('{|}', true)).toHaveLength(8);
    expect(labels('{"course":|')).toHaveLength(2);
    expect(labels('{"course": "main",|')).toEqual([]);
    expect(labels('[1]|', true)).toEqual([]);
  });

  it('UIC-JSON-EDITOR-5.5 describes the key or value under an offset from its schema', () => {
    const source = '{"name": "Soup", "course": "main", "servings": 2}';
    expect(describeJsonAt(recipe, source, source.indexOf('name'))).toBe('What the dish is called.');
    expect(describeJsonAt(recipe, source, source.indexOf('main'))).toBe('When it is served.');
    expect(describeJsonAt(recipe, source, source.indexOf('"course"'))).toBe('When it is served.');
    expect(describeJsonAt(recipe, source, source.indexOf('2'))).toBeNull();
    expect(describeJsonAt(recipe, source, 0)).toBeNull();
  });
});
