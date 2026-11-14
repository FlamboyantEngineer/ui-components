import { defineStrings } from '../message-format.js';
/** Strings of a table's row groups and bulk edit. */
interface TableStrings {
  /** A group header's label, from the grouping's name and the group's value (`Color: Red`). */
  groupHeading: (grouping: string, value: string) => string;
  /** Names the bulk edit's choice of the column it sets. */
  field: string;
  /** Applies the bulk edit to the selected rows. */
  apply: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const tableStrings = defineStrings<TableStrings>({
  groupHeading: (grouping, value) => ({ grouping, value }),
});
