/** A value the text form of a metadata line accepts. Blank strings, booleans and nullish values are skipped. */
export type MetaLineTextItem = string | number | boolean | null | undefined;

/** The middot between entries. */
export const metaLineSeparator = '·';

const textSeparator = ` ${metaLineSeparator} `;

/** Whether an entry is text the line keeps: a number, or a string that is not blank. */
export function isTextItem(item: unknown): item is string | number {
  return typeof item === 'number' || (typeof item === 'string' && item.trim().length > 0);
}

/** The text form of a metadata line, for tooltips, descriptions and other string-only places. */
export function formatMetaLine(items: readonly MetaLineTextItem[]): string {
  return items.filter(isTextItem).join(textSeparator);
}
