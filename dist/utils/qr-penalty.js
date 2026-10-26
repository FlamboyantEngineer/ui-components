// The penalty a masked QR symbol scores; the encoder keeps the mask that scores least
// (specs/QR-CODE.md).
const runPenalty = 3;
const blockPenalty = 3;
const finderPenalty = 40;
const balancePenalty = 10;
/**
 * How many finder-like patterns (dark, light, dark three times as long, light, dark, with four
 * light modules on one side) the newest runs complete.
 */
function countFinderPatterns(history) {
    const [before, a, b, c, d, e, after] = history;
    const isCore = a > 0 && b === a && c === a * 3 && d === a && e === a;
    return ((isCore && before >= a * 4 && after >= a ? 1 : 0) +
        (isCore && after >= a * 4 && before >= a ? 1 : 0));
}
/** Records a finished run; the first run of a line counts the light quiet zone before it. */
function pushRun(history, options) {
    const length = history[0] === 0 ? options.length + options.size : options.length;
    history.pop();
    history.unshift(length);
}
/** The run and finder-like penalties of one line of modules. */
function scoreLine(line) {
    const size = line.length;
    const history = [0, 0, 0, 0, 0, 0, 0];
    let score = 0;
    let color = false;
    let run = 0;
    for (const dark of line) {
        if (dark === color) {
            run += 1;
            score += run === 5 ? runPenalty : run > 5 ? 1 : 0;
            continue;
        }
        pushRun(history, { length: run, size });
        if (!color)
            score += countFinderPatterns(history) * finderPenalty;
        color = dark;
        run = 1;
    }
    // The line ends in the light quiet zone after it.
    if (color) {
        pushRun(history, { length: run, size });
        run = 0;
    }
    pushRun(history, { length: run + size, size });
    return score + countFinderPatterns(history) * finderPenalty;
}
/** The penalty of 2×2 blocks of one colour. */
function scoreBlocks(modules) {
    let score = 0;
    for (let y = 0; y + 1 < modules.length; y += 1) {
        const row = modules[y] ?? [];
        const next = modules[y + 1] ?? [];
        for (let x = 0; x + 1 < row.length; x += 1) {
            const dark = row[x];
            if (row[x + 1] === dark && next[x] === dark && next[x + 1] === dark)
                score += blockPenalty;
        }
    }
    return score;
}
/** The penalty of a dark share away from one half, in steps of five percent. */
function scoreBalance(modules) {
    const total = modules.length * modules.length;
    const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    const steps = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    return steps * balancePenalty;
}
/** The total penalty of a symbol's modules: runs and finder-like patterns, blocks and balance. */
export function scoreQrPenalty(modules) {
    const columns = modules.map((_, x) => modules.map((row) => row[x] ?? false));
    const lines = [...modules, ...columns].reduce((sum, line) => sum + scoreLine(line), 0);
    return lines + scoreBlocks(modules) + scoreBalance(modules);
}
//# sourceMappingURL=qr-penalty.js.map