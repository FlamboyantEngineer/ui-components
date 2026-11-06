// A mock host evaluator for the lab: + - * / and brackets over numbers and a few named constants.
// It reads with JavaScript numbers, as a host's own engine might; the field never evaluates.

import type { CodeToken } from '../../src/components/code-editor/code-editor.js';

export const constants: Readonly<Record<string, number>> = { width: 12.5, height: 3, rate: 0.07 };

const tokenPattern = /\s*(?:(\d+(?:\.\d*)?(?:e[+-]?\d+)?)|([A-Za-z_]\w*)|(.))/giy;

type Read = { ok: true; value: number } | { ok: false; message: string };

/** Splits the source into number, name, operator and invalid tokens for highlighting. */
export function tokenizeExpression(source: string): CodeToken[] {
  return [
    ...source.matchAll(/(\s+)|(\d+(?:\.\d*)?(?:e[+-]?\d+)?)|([A-Za-z_]\w*)|([-+*/()])|(.)/gi),
  ].map((match) => ({
    text: match[0],
    type: match[2]
      ? 'number'
      : match[3]
        ? match[3] in constants
          ? 'variable'
          : 'invalid'
        : match[4]
          ? 'operator'
          : match[5]
            ? 'invalid'
            : null,
  }));
}

/** Evaluates the source, or says why it cannot. */
export function evaluateExpression(source: string): Read {
  const tokens: string[] = [];
  tokenPattern.lastIndex = 0;
  for (const match of source.matchAll(tokenPattern)) tokens.push(match[0].trim());
  let at = 0;
  const peek = () => tokens[at];
  const fail = (message: string): never => {
    throw new Error(message);
  };
  const primary = (): number => {
    const token = tokens[at++];
    if (token === undefined) return fail('The expression ends early.');
    if (token === '(') {
      const value = sum();
      if (tokens[at++] !== ')') fail('A bracket is not closed.');
      return value;
    }
    if (token === '-') return -primary();
    if (/^\d/.test(token)) return Number(token);
    if (token in constants) return constants[token] ?? 0;
    return fail(`Unknown name “${token}”.`);
  };
  const product = (): number => {
    let value = primary();
    while (peek() === '*' || peek() === '/')
      value = tokens[at++] === '*' ? value * primary() : value / primary();
    return value;
  };
  const sum = (): number => {
    let value = product();
    while (peek() === '+' || peek() === '-')
      value = tokens[at++] === '+' ? value + product() : value - product();
    return value;
  };
  try {
    const value = sum();
    if (at < tokens.length) fail(`Unexpected “${tokens[at] ?? ''}”.`);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
