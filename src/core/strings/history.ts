import { defineStrings } from '../message-format.js';
/** Strings shared by comparisons and empty table groups. */
interface HistoryStrings {
  /** Captions a change's old value. */
  valueBefore: string;
  /** Captions a change's new value. */
  valueAfter: string;
  /** Stands in for a value that was not set. */
  emptyValue: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const historyStrings = defineStrings<HistoryStrings>({});
