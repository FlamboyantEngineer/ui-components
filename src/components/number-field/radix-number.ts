export type NumberFieldRadix = 2 | 8 | 10 | 16;
const prefixes = { 2: '0b', 8: '0o', 10: '', 16: '0x' } as const;
const digits = { 2: '[01]', 8: '[0-7]', 10: '[0-9]', 16: '[0-9a-f]' } as const;

/** Nondecimal values keep a conventional prefix, including after a minus sign. */
export function formatRadixNumber(value: number | null, radix: NumberFieldRadix): string {
  if (value === null) return '';
  return `${value < 0 ? '-' : ''}${prefixes[radix]}${Math.abs(value).toString(radix)}`;
}

/** Parses a complete integer in the configured base, with an optional matching prefix. */
export function parseRadixNumber(text: string, radix: NumberFieldRadix): number | null {
  const source = text.trim();
  if (!source) return null;
  const pattern = new RegExp(`^[+-]?(?:${prefixes[radix]})?${digits[radix]}+$`, 'i');
  if (!pattern.test(source)) return Number.NaN;
  const sign = source.startsWith('-') ? -1 : 1;
  const unsigned = source.replace(/^[+-]/, '').replace(new RegExp(`^${prefixes[radix]}`, 'i'), '');
  const value = sign * Number.parseInt(unsigned, radix);
  return Number.isSafeInteger(value) ? value : Number.NaN;
}
