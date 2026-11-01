// Code 128 (ISO/IEC 15417): symbol values, code set changes, the check symbol and the bar patterns.

/** The bar and space widths of symbol values 0 to 106, in modules; 106 is the stop pattern. */
// prettier-ignore
const patterns = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

type CodeSet = 'A' | 'B' | 'C';

const startValue: Record<CodeSet, number> = { A: 103, B: 104, C: 105 };
/** The value that switches to a code set, from code set A or B (C to A and C to B share 101 and 100). */
const switchValue: Record<CodeSet, number> = { A: 101, B: 100, C: 99 };
const stopValue = 106;

/** The longest value `encodeCode128` accepts, in characters. */
export const code128MaxLength = 80;

const isDigit = (code: number) => code >= 48 && code <= 57;

function countDigits(text: string, from: number): number {
  let end = from;
  while (end < text.length && isDigit(text.charCodeAt(end))) end += 1;
  return end - from;
}

/** Code set A holds the control characters and B the lower case: the first of them ahead decides. */
function chooseLetterSet(text: string, from: number): CodeSet {
  for (let index = from; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code < 32) return 'A';
    if (code >= 96) return 'B';
  }
  return 'B';
}

/** The value of a character in code set A or B; the caller has switched to a set that holds it. */
function letterValue(code: number, set: CodeSet): number {
  return set === 'A' && code < 32 ? code + 64 : code - 32;
}

/** Whether a run of digits is worth code set C: four at the end, six in the middle. */
function opensDigitRun(text: string, from: number): boolean {
  const run = countDigits(text, from);
  return run >= 6 || (run >= 4 && from + run === text.length);
}

/**
 * The symbol values for `text`, start to check symbol, before the stop pattern: code set C for the
 * whole text when it is all digits (two or more), or for a leading run of four; otherwise A or B by
 * the characters ahead, switching to C for runs of digits worth it and between A and B as needed.
 * `text` holds ASCII characters only.
 */
export function code128Values(text: string): number[] {
  const leading = countDigits(text, 0);
  let set: CodeSet =
    (leading === text.length && leading >= 2) || leading >= 4 ? 'C' : chooseLetterSet(text, 0);
  const values = [startValue[set]];
  let index = 0;
  while (index < text.length) {
    if (set === 'C') {
      if (countDigits(text, index) >= 2) {
        values.push(Number(text.slice(index, index + 2)));
        index += 2;
        continue;
      }
      set = chooseLetterSet(text, index);
      values.push(switchValue[set]);
      continue;
    }
    if (opensDigitRun(text, index) && countDigits(text, index) % 2 === 0) {
      set = 'C';
      values.push(switchValue.C);
      continue;
    }
    const code = text.charCodeAt(index);
    const needed: CodeSet = code < 32 ? 'A' : code >= 96 ? 'B' : set;
    if (needed !== set) {
      set = needed;
      values.push(switchValue[set]);
      continue;
    }
    values.push(letterValue(code, set));
    index += 1;
  }
  const weighted = values.reduce((sum, value, position) => sum + value * Math.max(position, 1), 0);
  values.push(weighted % 103);
  return values;
}

/** The modules of a run of symbol values and the stop pattern, `true` for a bar. */
export function code128Modules(values: readonly number[]): boolean[] {
  const modules: boolean[] = [];
  for (const value of [...values, stopValue]) {
    [...(patterns[value] ?? '')].forEach((width, element) => {
      for (let step = 0; step < Number(width); step += 1) modules.push(element % 2 === 0);
    });
  }
  return modules;
}
