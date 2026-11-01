// EAN-13, UPC-A and EAN-8 (ISO/IEC 15420): the check digit and the bar patterns.

/** The left-hand odd-parity (set A) pattern of each digit; set C is its complement, set B its mirror. */
// prettier-ignore
const setA = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
/** The sets of the six left-hand digits of an EAN-13 symbol, from its first digit. */
// prettier-ignore
const parities = ['AAAAAA', 'AABABB', 'AABBAB', 'AABBBA', 'ABAABB', 'ABBAAB', 'ABBBAA', 'ABABAB', 'ABABBA', 'ABBABA'];

const sideGuard = '101';
const centreGuard = '01010';

/** The check digit of `digits`: weights of 3 and 1 alternate from the rightmost digit. */
export function eanCheckDigit(digits: string): number {
  let sum = 0;
  for (let index = digits.length - 1, weight = 3; index >= 0; index -= 1, weight = 4 - weight) {
    sum += Number(digits[index]) * weight;
  }
  return (10 - (sum % 10)) % 10;
}

function digitPattern(digit: string, set: string): string {
  const odd = setA[Number(digit)] ?? '';
  const right = [...odd].map((bit) => (bit === '1' ? '0' : '1')).join('');
  if (set === 'C') return right;
  return set === 'B' ? [...right].reverse().join('') : odd;
}

/**
 * The modules of an EAN-13 symbol (13 digits, a UPC-A code with a leading 0) or an EAN-8 symbol
 * (8 digits), check digit included, `true` for a bar.
 */
export function eanModules(digits: string): boolean[] {
  const half = digits.length === 8 ? 4 : 6;
  const left = digits.length === 8 ? digits.slice(0, 4) : digits.slice(1, 7);
  const right = digits.slice(-half);
  const sets = digits.length === 8 ? 'AAAA' : (parities[Number(digits[0])] ?? '');
  const bits = [
    sideGuard,
    ...[...left].map((digit, index) => digitPattern(digit, sets[index] ?? 'A')),
    centreGuard,
    ...[...right].map((digit) => digitPattern(digit, 'C')),
    sideGuard,
  ].join('');
  return [...bits].map((bit) => bit === '1');
}
