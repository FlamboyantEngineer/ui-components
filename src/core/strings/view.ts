import { defineStrings } from '../message-format.js';
/** Strings of inline value editors. */
interface ViewStrings {
  /** Names the button that turns a value into its editor, from the value's label. */
  editValue: (label: string) => string;
  /** Shown when saving a value failed without a message of its own. */
  saveFailed: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const viewStrings = defineStrings<ViewStrings>({
  editValue: (label) => ({ label }),
});
