// QR module grids: function patterns, codeword placement, masks and format information
// (specs/QR-CODE.md).
/** The two bits each level writes in the format information. */
const formatLevelBits = {
    low: 1,
    medium: 0,
    quartile: 3,
    high: 2,
};
/** The eight mask conditions; a module whose condition holds is inverted. */
const maskConditions = [
    (x, y) => (x + y) % 2 === 0,
    (_x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];
/** The number of masks a symbol can use. */
export const QR_MASK_COUNT = maskConditions.length;
function isBitSet(value, bit) {
    return ((value >>> bit) & 1) !== 0;
}
/** Draws a function module at column `x`, row `y`, and reserves it. */
function setFunctionModule(grid, [x, y], dark) {
    const row = grid.modules[y];
    const reserved = grid.reserved[y];
    if (!row || !reserved || x < 0 || x >= grid.size)
        return;
    row[x] = dark;
    reserved[x] = true;
}
/** The centres of the alignment patterns along each axis. */
function getAlignmentPositions(version) {
    if (version === 1)
        return [];
    const count = Math.floor(version / 7) + 2;
    const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
    const size = version * 4 + 17;
    const positions = [6];
    for (let position = size - 7; positions.length < count; position -= step) {
        positions.splice(1, 0, position);
    }
    return positions;
}
/** Draws a square of rings around a centre, dark or light by their distance from it. */
function drawRings(grid, options) {
    const { x, y, radius } = options;
    for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
            const distance = Math.max(Math.abs(dx), Math.abs(dy));
            // Finders (radius 4, with their separator) are light at 2 and 4; alignments at 1.
            const dark = radius === 4 ? distance !== 2 && distance !== 4 : distance !== 1;
            if (y + dy >= 0 && y + dy < grid.size)
                setFunctionModule(grid, [x + dx, y + dy], dark);
        }
    }
}
/**
 * Writes the 15 format bits (level and mask with their BCH code) in both copies, and the dark
 * module beside the lower left finder.
 */
export function drawFormatBits(grid, options) {
    const data = (formatLevelBits[options.level] << 3) | options.mask;
    let remainder = data;
    for (let step = 0; step < 10; step += 1)
        remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
    const bits = ((data << 10) | remainder) ^ 0x5412;
    const { size } = grid;
    for (let bit = 0; bit < 15; bit += 1) {
        const dark = isBitSet(bits, bit);
        const first = bit < 6 ? [8, bit] : bit < 8 ? [8, bit + 1] : bit === 8 ? [7, 8] : [14 - bit, 8];
        const second = bit < 8 ? [size - 1 - bit, 8] : [8, size - 15 + bit];
        setFunctionModule(grid, first, dark);
        setFunctionModule(grid, second, dark);
    }
    setFunctionModule(grid, [8, size - 8], true);
}
/** Writes the 18 version bits (version 7 and up) next to the upper right and lower left finders. */
function drawVersionBits(grid, version) {
    if (version < 7)
        return;
    let remainder = version;
    for (let step = 0; step < 12; step += 1)
        remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
    const bits = (version << 12) | remainder;
    for (let bit = 0; bit < 18; bit += 1) {
        const along = grid.size - 11 + (bit % 3);
        const across = Math.floor(bit / 3);
        setFunctionModule(grid, [along, across], isBitSet(bits, bit));
        setFunctionModule(grid, [across, along], isBitSet(bits, bit));
    }
}
/** A blank grid of `version` with its timing, finder, alignment and reserved format modules drawn. */
export function createQrGrid(version) {
    const size = version * 4 + 17;
    const blank = () => Array.from({ length: size }, () => new Array(size).fill(false));
    const grid = { size, modules: blank(), reserved: blank() };
    for (let index = 0; index < size; index += 1) {
        setFunctionModule(grid, [6, index], index % 2 === 0);
        setFunctionModule(grid, [index, 6], index % 2 === 0);
    }
    for (const [x, y] of [
        [3, 3],
        [size - 4, 3],
        [3, size - 4],
    ]) {
        drawRings(grid, { x, y, radius: 4 });
    }
    const alignments = getAlignmentPositions(version);
    const last = alignments.length - 1;
    alignments.forEach((y, row) => {
        alignments.forEach((x, column) => {
            const isFinderCorner = (row === 0 && column === 0) ||
                (row === 0 && column === last) ||
                (row === last && column === 0);
            if (!isFinderCorner)
                drawRings(grid, { x, y, radius: 2 });
        });
    });
    drawFormatBits(grid, { level: 'medium', mask: 0 });
    drawVersionBits(grid, version);
    return grid;
}
/** Every module position in codeword order: two-column strips from the right, alternately up and down. */
function listPlacementOrder(size) {
    const order = [];
    for (let right = size - 1; right >= 1; right -= 2) {
        // The vertical timing pattern takes column 6, so the strip left of it shifts by one.
        const column = right <= 6 ? right - 1 : right;
        const upward = ((column + 1) & 2) === 0;
        for (let step = 0; step < size; step += 1) {
            const y = upward ? size - 1 - step : step;
            order.push([column, y], [column - 1, y]);
        }
    }
    return order;
}
/** Writes the codewords' bits, most significant first, into the modules no function pattern holds. */
export function placeCodewords(grid, codewords) {
    let index = 0;
    for (const [x, y] of listPlacementOrder(grid.size)) {
        const row = grid.modules[y];
        if (!row || grid.reserved[y]?.[x] || index >= codewords.length * 8)
            continue;
        row[x] = isBitSet(codewords[index >>> 3] ?? 0, 7 - (index & 7));
        index += 1;
    }
}
/** Inverts the data modules whose mask condition holds; applying the same mask again undoes it. */
export function applyMask(grid, mask) {
    const condition = maskConditions[mask];
    if (!condition)
        return;
    grid.modules.forEach((row, y) => {
        row.forEach((dark, x) => {
            if (!grid.reserved[y]?.[x] && condition(x, y))
                row[x] = !dark;
        });
    });
}
//# sourceMappingURL=qr-matrix.js.map