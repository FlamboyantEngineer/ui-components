// Reed–Solomon error correction codewords over GF(2^8) for QR symbols (specs/QR-CODE.md).
/** The field's reducing polynomial, x^8 + x^4 + x^3 + x^2 + 1. */
const fieldPolynomial = 0x11d;
/** The product of two field elements, by shift-and-add with reduction. */
function multiplyField(x, y) {
    let product = 0;
    for (let bit = 7; bit >= 0; bit -= 1) {
        product = (product << 1) ^ ((product >>> 7) * fieldPolynomial);
        product ^= ((y >>> bit) & 1) * x;
    }
    return product;
}
/** The generator polynomial of `degree`, highest coefficient first, without its leading 1. */
function createGenerator(degree) {
    const coefficients = new Array(degree).fill(0);
    coefficients[degree - 1] = 1;
    let root = 1;
    for (let step = 0; step < degree; step += 1) {
        for (let index = 0; index < degree; index += 1) {
            const next = coefficients[index + 1] ?? 0;
            coefficients[index] = multiplyField(coefficients[index] ?? 0, root) ^ next;
        }
        root = multiplyField(root, 2);
    }
    return coefficients;
}
/**
 * The `degree` error correction codewords of a block of data codewords: the remainder of the data
 * polynomial divided by the generator polynomial of that degree.
 */
export function computeErrorCorrection(data, degree) {
    const generator = createGenerator(degree);
    const remainder = generator.map(() => 0);
    for (const codeword of data) {
        const factor = codeword ^ (remainder.shift() ?? 0);
        remainder.push(0);
        generator.forEach((coefficient, index) => {
            remainder[index] = (remainder[index] ?? 0) ^ multiplyField(coefficient, factor);
        });
    }
    return remainder;
}
//# sourceMappingURL=qr-reed-solomon.js.map