/** Strings of a table's row groups and bulk edit. */
export interface TableStrings {
  /** A group header's label, from the grouping's name and the group's value (`Colour: Red`). */
  groupHeading: (grouping: string, value: string) => string;
  /** Opens the bulk edit of the selected rows. */
  editSelected: string;
  /** Titles the bulk edit, from the number of selected rows. */
  editRows: (count: number) => string;
  /** Names the bulk edit's choice of the column it sets. */
  field: string;
  /** Applies the bulk edit to the selected rows. */
  apply: string;
}

export const tableStrings: TableStrings = {
  groupHeading: (grouping, value) => `${grouping}: ${value}`,
  editSelected: 'Edit selected',
  editRows: (count) => (count === 1 ? 'Edit 1 row' : `Edit ${count} rows`),
  field: 'Field',
  apply: 'Apply',
};
