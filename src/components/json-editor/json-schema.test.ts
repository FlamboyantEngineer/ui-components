import { describe, expect, it } from 'vitest';
import { defaultStrings } from '../../core/strings.js';
import { findSubschema, validateJsonSchema, type JsonSchema } from './json-schema.js';
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
  it('UIC-JSON-EDITOR-5.1 accepts text that follows the schema', () => {
    expect(
      problems(
        '{"name": "Soup", "servings": 4, "course": "main", "vegetarian": true, "code": "ABC", "note": null, "tags": ["warm"], "oven": "fan", "extras": {"salt": 1}, "broken": "x"}',
      ),
    ).toEqual([]);
  });

  it('UIC-JSON-EDITOR-5.1 marks types, values, required and unknown properties where they are', () => {
    expect(
      problems('{"name": 7, "servings": 2.5, "course": "brunch", "oven": "gas", "size": 1}'),
    ).toEqual([
      ['Expected string.', '7'],
      ['Expected integer.', '2.5'],
      ['Expected one of "starter", "main", "dessert".', '"brunch"'],
      ['Expected "fan".', '"gas"'],
      ['Property "size" is not allowed.', '"size"'],
    ]);
    expect(problems('{"name": "Tea"}')).toEqual([['Missing property "servings".', '{']]);
    expect(problems('[]')).toEqual([['Expected object.', '[]']]);
    expect(problems('{"name": "Tea", "servings": 1, "note": 3}')).toEqual([
      ['Expected string or null.', '3'],
    ]);
  });

  it('UIC-JSON-EDITOR-5.1 checks number, string and array limits', () => {
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

  it('UIC-JSON-EDITOR-5.2 finds the schema of a path through properties, items and extra properties', () => {
    expect(findSubschema(recipe, ['name'])?.description).toBe('What the dish is called.');
    expect(findSubschema(recipe, ['tags', 0])).toEqual({ type: 'string' });
    expect(findSubschema(recipe, ['extras', 'pepper'])).toEqual({ type: 'number' });
    expect(findSubschema(recipe, ['size'])).toBeNull();
    expect(findSubschema(recipe, ['name', 'x'])).toBeNull();
  });
});
