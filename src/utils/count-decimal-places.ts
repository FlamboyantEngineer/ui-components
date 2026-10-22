/** Decimal places in a number's shortest representation, including scientific notation. */
export function countDecimalPlaces(value: number): number {
  const [coefficient = '', exponent = '0'] = String(value).split('e');
  const decimals = coefficient.split('.')[1]?.length ?? 0;
  return Math.max(0, decimals - Number(exponent));
}
