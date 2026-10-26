// A1-style cell references (specs/FORMULA-BAR.md): column letters, then the row number.
const referencePattern = /^\$?([A-Z]{1,7})\$?([1-9][0-9]{0,8})$/i;
/** Column letters for a zero-based column index: 0 is `A`, 25 is `Z`, 26 is `AA`. */
function formatColumnLetters(column) {
    let letters = '';
    for (let rest = column + 1; rest > 0; rest = Math.floor((rest - 1) / 26)) {
        letters = String.fromCharCode(65 + ((rest - 1) % 26)) + letters;
    }
    return letters;
}
/** The zero-based column index that column letters name. */
function parseColumnLetters(letters) {
    let column = 0;
    for (const letter of letters.toUpperCase())
        column = column * 26 + letter.charCodeAt(0) - 64;
    return column - 1;
}
/**
 * The A1-style reference of a cell: column letters (`A` to `Z`, then `AA`) and the one-based row
 * number, such as `C12` for row 11, column 2.
 */
export function formatCellReference({ row, column }) {
    return `${formatColumnLetters(column)}${row + 1}`;
}
/**
 * The cell an A1-style reference names, ignoring case, surrounding spaces and the `$` marks of an
 * absolute reference, or null when the text is not a single cell reference.
 */
export function parseCellReference(text) {
    const match = referencePattern.exec(text.trim());
    if (!match)
        return null;
    return { row: Number(match[2]) - 1, column: parseColumnLetters(match[1]) };
}
//# sourceMappingURL=cell-reference.js.map