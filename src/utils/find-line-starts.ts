/** The source offsets of its lines, including an empty final line. */
export function findLineStarts(value: string): number[] {
  const starts = [0];
  for (let at = value.indexOf('\n'); at !== -1; at = value.indexOf('\n', at + 1)) {
    starts.push(at + 1);
  }
  return starts;
}
