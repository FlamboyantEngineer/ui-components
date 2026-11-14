import { formatJson } from '../code-editor/json-text.js';

/** A word written in capitals, such as an acronym, keeps its case in a derived label. */
function isCapitalized(word: string): boolean {
  return word.length > 1 && word === word.toUpperCase() && word !== word.toLowerCase();
}

/**
 * A readable label from a tool's name: `search_recipes` and `searchRecipes` read `Search recipes`.
 * Words split at underscores, hyphens, dots, slashes, colons, spaces and case changes; words in
 * capitals keep their case.
 */
export function formatToolName(name: string): string {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_.\-/:]+/)
    .filter(Boolean)
    .map((word) => (isCapitalized(word) ? word : word.toLowerCase()));
  const sentence = words.join(' ');
  if (!sentence) return name;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * JSON text of an object or array, re-indented from its own tokens, so every number, string and
 * repeated key keeps its text; any other text as given.
 */
function formatJsonText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return text;
  return formatJson(trimmed, 2) ?? text;
}

function replaceBigInt(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * The text a tool call shows for its arguments or result: JSON with two-space indentation. A
 * string that holds a JSON object or array is re-indented, changing only white space; other
 * strings show as given. A value
 * JSON cannot hold (a cycle, a function) shows as `String(value)`.
 */
export function formatToolValue(value: unknown): string {
  if (typeof value === 'string') return formatJsonText(value);
  try {
    return JSON.stringify(value, replaceBigInt, 2) ?? String(value);
  } catch {
    return String(value);
  }
}
