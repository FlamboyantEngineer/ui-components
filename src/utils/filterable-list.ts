/** A list of more entries than this leads with a search field unless its owner says otherwise. */
export const FILTERABLE_LIST_LENGTH = 10;

/** Whether a list of `length` entries is long enough to lead with a search field by default. */
export function isFilterableLength(length: number): boolean {
  return length > FILTERABLE_LIST_LENGTH;
}
