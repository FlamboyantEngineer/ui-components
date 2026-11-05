// Compares decimal text without converting it to a number, so bounds keep every digit they were
// written with: `9007199254740993` and `9007199254740992` stay apart, and `1e-400` stays above 0.

const decimalPattern = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i;

interface DecimalParts {
  sign: 1 | -1 | 0;
  /** The significant digits, without leading or trailing zeros. */
  digits: string;
  /** Where the decimal point falls after the first significant digit, as in scientific notation. */
  exponent: number;
}

/** Reads decimal text such as `-12.50` or `1e-100`, or `null` when it is not one. */
function readDecimal(text: string): DecimalParts | null {
  const match = decimalPattern.exec(text.trim());
  if (!match) return null;
  const [, sign = '', whole = '', fraction = '', exponent = '0'] = match;
  if (whole === '' && fraction === '') return null;
  const all = whole + fraction;
  const leading = all.length - all.replace(/^0+/, '').length;
  const digits = all.slice(leading).replace(/0+$/, '');
  if (digits === '') return { sign: 0, digits: '', exponent: 0 };
  return {
    sign: sign === '-' ? -1 : 1,
    digits,
    exponent: whole.length - leading - 1 + Number(exponent),
  };
}

/** Whether text is a decimal number as a bound or default may be written. */
export function isDecimalText(text: string): boolean {
  return readDecimal(text) !== null;
}

function compareMagnitude(left: DecimalParts, right: DecimalParts): number {
  if (left.exponent !== right.exponent) return left.exponent < right.exponent ? -1 : 1;
  const width = Math.max(left.digits.length, right.digits.length);
  const a = left.digits.padEnd(width, '0');
  const b = right.digits.padEnd(width, '0');
  return a === b ? 0 : a < b ? -1 : 1;
}

/** Orders two decimal texts by value: negative, zero or positive; `null` when either is not one. */
export function compareDecimalText(left: string, right: string): number | null {
  const a = readDecimal(left);
  const b = readDecimal(right);
  if (!a || !b) return null;
  if (a.sign !== b.sign) return a.sign < b.sign ? -1 : 1;
  if (a.sign === 0) return 0;
  return a.sign * compareMagnitude(a, b);
}
