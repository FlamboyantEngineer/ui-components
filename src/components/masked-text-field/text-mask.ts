// Fixed token masks: a pattern of slots, each taking one accepted character, and literal
// separators between them. The raw value holds the accepted characters only; the formatted text
// writes them into the pattern, with each literal shown once a slot after it is filled.

/** What one slot of a mask takes. */
export interface MaskToken {
  /** Tests one character. */
  pattern: RegExp;
  /** Rewrites an accepted character, such as to upper case. */
  transform?: ((character: string) => string) | undefined;
}

/**
 * The tokens a mask pattern reads: `9` a digit, `a` a letter, `A` a letter written in upper case,
 * and `*` a letter or a digit. Every other character is a literal; `\` makes the next one literal.
 */
export const defaultMaskTokens: Readonly<Record<string, MaskToken>> = {
  '9': { pattern: /^\d$/ },
  a: { pattern: /^\p{L}$/u },
  A: { pattern: /^\p{L}$/u, transform: (character) => character.toLocaleUpperCase() },
  '*': { pattern: /^[\p{L}\d]$/u },
};

/** One place of a mask: a slot with its token, or a literal character. */
export type MaskPart = { token: MaskToken } | { literal: string };

/** A parsed mask pattern. */
export interface TextMask {
  parts: readonly MaskPart[];
  /** The number of slots: the length of a complete raw value. */
  size: number;
}

/** Reads a mask pattern with the given tokens. */
export function parseTextMask(
  pattern: string,
  tokens: Readonly<Record<string, MaskToken>> = defaultMaskTokens,
): TextMask {
  const parts: MaskPart[] = [];
  const characters = [...pattern];
  for (let index = 0; index < characters.length; index++) {
    const character = characters[index] ?? '';
    const token = tokens[character];
    if (character === '\\' && index + 1 < characters.length) {
      index++;
      parts.push({ literal: characters[index] ?? '' });
    } else if (token) parts.push({ token });
    else parts.push({ literal: character });
  }
  return { parts, size: parts.filter((part) => 'token' in part).length };
}

/**
 * The raw value a text spells through the mask: each character that is the literal at its place
 * passes over it, each one the next slot accepts fills that slot, and any other is dropped. A
 * formatted text reads back to its raw value, and so does the raw value itself.
 */
export function unmaskText(text: string, mask: TextMask): string {
  let place = 0;
  let raw = '';
  for (const character of text) {
    const part = mask.parts[place];
    if (!part) break;
    if ('literal' in part && part.literal === character) {
      place++;
      continue;
    }
    let slot = place;
    while (slot < mask.parts.length && 'literal' in (mask.parts[slot] ?? {})) slot++;
    const target = mask.parts[slot];
    if (!target || !('token' in target)) break;
    if (target.token.pattern.test(character)) {
      raw += target.token.transform?.(character) ?? character;
      place = slot + 1;
    }
  }
  return raw;
}

/**
 * The formatted text of a raw value: its characters in their slots, with each literal written once
 * a slot after it holds a character. Characters past the last slot are dropped.
 */
export function maskText(raw: string, mask: TextMask): string {
  const characters = [...unmaskText(raw, mask)];
  let text = '';
  let pending = '';
  let filled = 0;
  for (const part of mask.parts) {
    if (filled === characters.length) break;
    if ('literal' in part) pending += part.literal;
    else {
      text += pending + (characters[filled] ?? '');
      pending = '';
      filled++;
    }
  }
  return text;
}

/** The mask written with a placeholder character in each slot, such as `(___) ___-____`. */
export function maskPlaceholder(mask: TextMask, character = '_'): string {
  return mask.parts.map((part) => ('literal' in part ? part.literal : character)).join('');
}

/** Whether a raw value fills every slot. */
export function isMaskComplete(raw: string, mask: TextMask): boolean {
  return [...raw].length === mask.size;
}

/** Whether a token takes a digit and no letter, probed with a few characters. */
function takesDigitsOnly(token: MaskToken): boolean {
  return (
    token.pattern.test('5') && !['a', 'f', 'x', 'A'].some((letter) => token.pattern.test(letter))
  );
}

/** Whether every slot takes digits only, so a numeric keyboard suits the field. */
export function isNumericMask(mask: TextMask): boolean {
  return mask.parts.every((part) => 'literal' in part || takesDigitsOnly(part.token));
}

/**
 * The formatted text and caret after Backspace (`direction` -1) or Delete (1) at a collapsed caret
 * next to literals: the key removes the nearest slot character past them, not a literal, which
 * would only come back. `null` when the key has a character to remove itself or nothing at all.
 */
export function deleteAcrossLiterals(
  text: string,
  caret: number,
  { direction, mask }: { direction: 1 | -1; mask: TextMask },
): { raw: string; caret: number } | null {
  const isLiteralAt = (index: number) => 'literal' in (mask.parts[index] ?? { token: null });
  let index = direction === -1 ? caret - 1 : caret;
  if (index < 0 || index >= text.length || !isLiteralAt(index)) return null;
  while (index >= 0 && index < text.length && isLiteralAt(index)) index += direction;
  if (index < 0 || index >= text.length) return null;
  const raw = unmaskText(text.slice(0, index) + text.slice(index + 1), mask);
  const before = unmaskText(text.slice(0, index), mask);
  return { raw, caret: maskText(before, mask).length };
}
