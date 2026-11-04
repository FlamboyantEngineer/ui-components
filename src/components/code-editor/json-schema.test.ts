import { describe, expect, it } from 'vitest';
import { getDefaultStrings } from '../../core/strings.js';

const defaultStrings = getDefaultStrings();
import { findSubschema, type JsonSchema, validateJsonSchema } from './json-schema.js';
import { parseJsonTree } from './json-tree.js';

const recipe: JsonSchema = {
  type: 'object',
  required: ['name', 'servings'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 12, description: 'What the dish is called.' },
    servings: { type: 'integer', minimum: 1, maximum: 8 },
    course: { enum: ['starter', 'main', 'dessert'] },
    vegetarian: { type: 'boolean' },
    code: { type: 'string', pattern: '^[A-Z]{3}$' },
    note: { type: ['string', 'null'] },
    tags: { type: 'array', minItems: 1, maxItems: 2, items: { type: 'string' } },
    oven: { const: 'fan' },
    extras: { type: 'object', additionalProperties: { type: 'number' } },
    broken: { type: 'string', pattern: '(' },
  },
};

/** The problems of a JSON text with the text each one marks. */
function problems(source: string, schema: JsonSchema = recipe) {
  const tree = parseJsonTree(source);
  if (!tree) throw new Error('does not parse');
  return validateJsonSchema(tree, schema, defaultStrings).map(({ message, start, end }) => [
    message,
    source.slice(start, end),
  ]);
}

describe('JSON Schema subset', () => {
  it('UIC-CODE-EDITOR-13.1 accepts text that follows the schema', () => {
    expect(
      problems(
        '{"name": "Soup", "servings": 4, "course": "main", "vegetarian": true, "code": "ABC", "note": null, "tags": ["warm"], "oven": "fan", "extras": {"salt": 1}, "broken": "x"}',
      ),
    ).toEqual([]);
  });

  it('UIC-CODE-EDITOR-13.1 marks types, values, required and unknown properties where they are', () => {
    expect(
      problems('{"name": 7, "servings": 2.5, "course": "brunch", "oven": "gas", "size": 1}'),
    ).toEqual([
      ['Expected string.', '7'],
      ['Expected integer.', '2.5'],
      ['Expected one of "starter", "main", or "dessert".', '"brunch"'],
      ['Expected "fan".', '"gas"'],
      ['Property "size" is not allowed.', '"size"'],
    ]);
    expect(problems('{"name": "Tea"}')).toEqual([['Missing property "servings".', '{']]);
    expect(problems('[]')).toEqual([['Expected object.', '[]']]);
    expect(problems('{"name": "Tea", "servings": 1, "note": 3}')).toEqual([
      ['Expected string or null.', '3'],
    ]);
  });

  it('UIC-CODE-EDITOR-13.1 checks number, string and array limits', () => {
    expect(
      problems(
        '{"name": "Al", "servings": 9, "code": "abc", "tags": [], "extras": {"salt": "lots"}}',
      ),
    ).toEqual([
      ['Use at least 3 characters.', '"Al"'],
      ['Enter 8 or less.', '9'],
      ['Enter a value in the expected format.', '"abc"'],
      ['Use at least 1 item.', '[]'],
      ['Expected number.', '"lots"'],
    ]);
    expect(problems('{"name": "A very long name", "servings": 0, "tags": ["a", "b", 3]}')).toEqual([
      ['Use 12 characters or fewer.', '"A very long name"'],
      ['Enter 1 or more.', '0'],
      ['Use 2 items or fewer.', '["a", "b", 3]'],
      ['Expected string.', '3'],
    ]);
  });

  it('UIC-CODE-EDITOR-13.2 finds the schema of a path through properties, items and extra properties', () => {
    expect(findSubschema(recipe, ['name'])?.description).toBe('What the dish is called.');
    expect(findSubschema(recipe, ['tags', 0])).toEqual({ type: 'string' });
    expect(findSubschema(recipe, ['extras', 'pepper'])).toEqual({ type: 'number' });
    expect(findSubschema(recipe, ['size'])).toBeNull();
    expect(findSubschema(recipe, ['name', 'x'])).toBeNull();
  });

  it('UIC-CODE-EDITOR-13.1 compares structured enum and const values independently of object key order', () => {
    const value = { first: 1, nested: { fruit: 'Fig', tags: ['ripe', null] } };
    const source = '{"nested":{"tags":["ripe",null],"fruit":"Fig"},"first":1}';
    expect(problems(source, { enum: [value] })).toEqual([]);
    expect(problems(source, { const: value })).toEqual([]);
    expect(problems('{"x":0,"x":1}', { const: { x: 1 } })).toEqual([]);
    expect(problems('{"x":"old","x":1}', { properties: { x: { type: 'number' } } })).toEqual([]);
    expect(problems('[1,2]', { const: [2, 1] })).toEqual([['Expected [2,1].', '[1,2]']]);
    expect(problems('2', { enum: [1, 2], const: 1 })).toEqual([['Expected 1.', '2']]);
    expect(problems('1', { enum: [1, 2], const: 1 })).toEqual([]);
  });

  it('UIC-CODE-EDITOR-13.1 UIC-CODE-EDITOR-13.2 treats prototype names as ordinary own property names', () => {
    const schema: JsonSchema = { properties: {}, additionalProperties: false };
    expect(problems('{"toString":1,"constructor":2,"__proto__":3}', schema)).toEqual([
      ['Property "toString" is not allowed.', '"toString"'],
      ['Property "constructor" is not allowed.', '"constructor"'],
      ['Property "__proto__" is not allowed.', '"__proto__"'],
    ]);
    expect(findSubschema(schema, ['constructor'])).toBeNull();
    expect(findSubschema({ additionalProperties: { type: 'string' } }, ['toString'])).toEqual({
      type: 'string',
    });
    const own: JsonSchema = { properties: { constructor: { type: 'integer' as const } } };
    expect(problems('{"constructor":1}', own)).toEqual([]);
    expect(findSubschema(own, ['constructor'])).toEqual({ type: 'integer' });
  });

  it('UIC-CODE-EDITOR-13.1 checks deep schemas and structured values without reserializing each subtree', () => {
    const depth = 20_000;
    let schema: JsonSchema = { type: 'integer', minimum: 1 };
    let allowed: unknown = 0;
    for (let index = 0; index < depth; index += 1) {
      schema = { type: 'array', items: schema };
      allowed = [allowed];
    }
    const source = '['.repeat(depth) + '0' + ']'.repeat(depth);
    expect(problems(source, schema)).toEqual([['Enter 1 or more.', '0']]);
    expect(problems(source, { const: allowed })).toEqual([]);
    expect(problems('null', { const: allowed })).toEqual([[`Expected ${source}.`, 'null']]);
  });
});
