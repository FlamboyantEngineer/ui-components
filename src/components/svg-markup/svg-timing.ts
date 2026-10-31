// Reads the element references of SVG animation timing (`begin`, `end`) the way browsers do, so a
// drawing's timing can reach only its own elements (specs/SVG-MARKUP.md, UIC-SVG-MARKUP-1.4).

/** A clock or offset value, which browsers read before any element reference. */
const clockValue = /^[+-]?\s*(?:(?:\d+:)?\d{2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?(?:h|min|s|ms)?)$/;

/** The text up to the first `.` no backslash escapes, unescaped, or null without one. */
function readEscapedName(text: string): string | null {
  let name = '';
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (char === '.') return name;
    if (char === '\\') index += 1;
    name += char === '\\' ? text.charAt(index) : char;
  }
  return null;
}

/**
 * Chromium and WebKit split the offset off at the first `+`, or else the first `-`, escaped or
 * not, then read the element ID up to the first unescaped `.`.
 */
function readSplitOffsetBase(item: string): string | null {
  const sign = item.includes('+') ? item.indexOf('+') : item.indexOf('-');
  return readEscapedName(sign === -1 ? item : item.slice(0, sign));
}

/**
 * SMIL reads the offset only where a clock value follows the sign, so an ID may hold `-`; the
 * element ID runs up to the first unescaped `.` before it.
 */
function readOffsetAwareBase(item: string): string | null {
  const sign = [...item.matchAll(/[+-]/g)].find((match) =>
    clockValue.test(item.slice(match.index)),
  );
  return readEscapedName(sign === undefined ? item : item.slice(0, sign.index));
}

/**
 * The IDs one timing item (`id.click+1s`, `id.end`, `click`, `2s`) makes a browser look up: none
 * for a clock value or an event on the animation's own target, otherwise its element ID as each
 * browser reads it.
 */
export function readTimingReferences(item: string): string[] {
  if (item === 'indefinite' || clockValue.test(item)) return [];
  const bases = [readSplitOffsetBase(item), readOffsetAwareBase(item)];
  return [...new Set(bases.filter((base): base is string => base !== null))];
}

/**
 * A `begin` or `end` list with each item that names an element scoped by `scope`, which gives a
 * defined ID's scoped form or null; an item naming any other element is dropped. Null when no
 * item is left. `prefix` must hold no `.`, `+`, `-` or `\`, so it scopes every reading alike.
 */
export function scopeTimingList(
  value: string,
  prefix: string,
  isDefined: (id: string) => boolean,
): string | null {
  const kept: string[] = [];
  for (const raw of value.split(';')) {
    const item = raw.trim();
    if (!item) continue;
    const references = readTimingReferences(item);
    if (references.length === 0) kept.push(item);
    else if (references.every(isDefined)) kept.push(`${prefix}${item}`);
  }
  return kept.length > 0 ? kept.join(';') : null;
}
