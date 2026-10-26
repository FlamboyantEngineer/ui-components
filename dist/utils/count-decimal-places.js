/** Decimal places in a number's shortest representation, including scientific notation. */
export function countDecimalPlaces(value) {
    const [coefficient = '', exponent = '0'] = String(value).split('e');
    const decimals = coefficient.split('.')[1]?.length ?? 0;
    return Math.max(0, decimals - Number(exponent));
}
//# sourceMappingURL=count-decimal-places.js.map