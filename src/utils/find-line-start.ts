/**
 * The offset where the line holding `offset` starts. Offset 0 is always on a line starting at 0,
 * even when the text starts with a line break.
 */
export function findLineStart(value: string, offset: number): number {
  return offset <= 0 ? 0 : value.lastIndexOf('\n', offset - 1) + 1;
}
