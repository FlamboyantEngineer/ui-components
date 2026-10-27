import type { MessageArguments } from './message-format.js';
/** Strings of the field base and the field controls. */
export interface FieldStrings {
  /** Opens a file chooser. */
  browse: string;
  /** States a size limit, from the formatted size. */
  fileSizeLimit: (size: string) => string;
  /** Counts chosen files refused because their type is not accepted. */
  rejectedFileType: (count: number) => string;
  /** Counts chosen files refused because they are larger than the size limit. */
  rejectedFileSize: (count: number) => string;
  /** Counts chosen files refused because they are smaller than the minimum size. */
  rejectedFileSmall: (count: number) => string;
  /** Counts chosen files refused because the upload holds as many files as it may. */
  rejectedFileCount: (count: number) => string;
  /** A chosen file refused by the host's own check, with the host's reason. */
  rejectedFileReason: (name: string, reason: string) => string;
  /** States how many files an upload holds at most. */
  fileCountLimit: (count: number) => string;
  /** The command of a file field that takes one file. */
  addFile: string;
  /** The command of a file field that takes several files. */
  addFiles: string;
  /** The default title of a problem list. */
  problems: string;
  /** Counts a problem list's problems by severity. */
  problemCount: (errors: number, warnings: number) => string;
  /** Names a problem's severity, read before its message. */
  problemSeverity: (severity: 'error' | 'warning') => string;
  /** A field menu action that puts the field's default value back. */
  setDefault: string;
  /** The message of a required field left empty. */
  valueRequired: string;
  /** The message of a field whose value is being checked. */
  validating: string;
  /** The message of a text shorter than its minimum length. */
  tooShort: (minLength: number) => string;
  /** The message of a text longer than its maximum length. */
  tooLong: (maxLength: number) => string;
  /** The message of a text that does not match its expected format. */
  patternMismatch: string;
  /** Names a button that puts a field's committed value back, from the field's label. */
  restoreValue: (label: string) => string;
  /** Names a field's help button, from the field's label. */
  fieldHelp: (label: string) => string;
  /** Names a field's menu, from the field's label. */
  fieldActions: (label: string) => string;
  /** The message of a number below its minimum, given the formatted minimum. */
  rangeUnderflow: (minimum: string) => string;
  /** Names the numeric increment button. */
  numberIncrease: string;
  /** Names the numeric decrement button. */
  numberDecrease: string;
  /** The message of a number above its maximum, given the formatted maximum. */
  rangeOverflow: (maximum: string) => string;
  /** The message of a number off its step, given the formatted step. */
  stepMismatch: (step: string) => string;
  /** Names a search box's clear button. */
  clearSearch: string;
  /** Names the toggle button that shows a masked text field's value, from the field's label. */
  revealValue: (label: string) => string;
  /** A text's length, against its maximum length when it has one (`12/100`). */
  characterCount: (count: number, maxLength?: number) => string;
  /** The default label of a true value. */
  valueTrue: string;
  /** The default label of a false value. */
  valueFalse: string;
  /** The default label of a value that is not set. */
  valueUnset: string;
  /** Stands for an empty colour value. */
  noColor: string;
  /** The message of typed text that is not a colour. */
  colorUnreadable: string;
  /** Names the hexadecimal input of a colour picker. */
  hexColor: string;
  /** Names a colour picker's choice of format (hex, RGB, HSL). */
  colorFormat: string;
  /** Names the button that opens a colour field's picker, from the field's label. */
  colorPicker: (label: string) => string;
  /** Names the button that samples a colour from the screen. */
  pickScreenColor: string;
  /** Names the button that removes a chosen value, read with the value it removes. */
  remove: string;
  /** Names the button that clears a field's value in one press, from the field's label. */
  clearValue: (label: string) => string;
  /** The text of a select that has no value and no placeholder of its own. */
  selectPlaceholder: string;
  /** Names the group of a multiple select's chosen values, from the field's label. */
  selectedValues: (label: string) => string;
  /** The action row of a combobox that adds the typed text as a new option. */
  createOption: (text: string) => string;
  /** The message of a search that needs a longer query before it runs. */
  typeToSearch: (minLength: number) => string;
  /** The message of a search that failed. */
  searchFailed: string;
  /** Heads the people a person picker lists before a search: those chosen recently. */
  recentPeople: string;
  /** Follows the name of the person using the app in a person picker. */
  currentPerson: string;
  /** The message of a tag refused because the field already holds it. */
  duplicateValue: (value: string) => string;
  /** The message of a tag refused because the field holds as many tags as it may. */
  tooManyValues: (maxValues: number) => string;
  /** Names one cell of a code input, from its position and the code's length. */
  characterPosition: (position: number, length: number) => string;
  /** A date field action that picks the current date. */
  today: string;
  /** A date field action that picks the current date and time. */
  now: string;
  /** The message of a date or time earlier than the field allows. */
  dateTooEarly: (minValue: string) => string;
  /** The message of a date or time later than the field allows. */
  dateTooLate: (maxValue: string) => string;
  /** The message of a date the field does not offer, such as a holiday. */
  dateUnavailable: string;
  /** The message of a date or time typed only in part, or of a range with one end left empty. */
  dateIncomplete: string;
  /** A preset of the dates up to today, from a count of units such as `7 days`. */
  lastPeriod: (period: string) => string;
  /** A preset of the dates from today, from a count of units such as `7 days`. */
  nextPeriod: (period: string) => string;
  /** Names the start thumb of a range slider, read before the slider's label. */
  rangeMinimum: string;
  /** Names a signature pad's choice between drawing and typing the signature. */
  signatureMethod: string;
  /** The signature pad's choice that draws the signature with a pointer. */
  signatureDraw: string;
  /** The signature pad's choice that types the signer's name instead. */
  signatureType: string;
  /** The hint of a signature pad's name input. */
  signatureTypePlaceholder: string;
  /** Describes a signature pad's drawing area by its stroke count. */
  signatureStrokes: (count: number) => string;
  /** Removes the last stroke of a drawn signature. */
  undoStroke: string;
  /** Names the end thumb of a range slider, read before the slider's label. */
  rangeMaximum: string;
}

/** The message values each text function reads its arguments as. */
export const fieldArguments: MessageArguments<FieldStrings> = {
  fileSizeLimit: (size) => ({ size }),
  rejectedFileType: (count) => ({ count }),
  rejectedFileSize: (count) => ({ count }),
  rejectedFileSmall: (count) => ({ count }),
  rejectedFileCount: (count) => ({ count }),
  rejectedFileReason: (name, reason) => ({ name, reason }),
  fileCountLimit: (count) => ({ count }),
  problemCount: (errors, warnings) => ({ errors, warnings }),
  problemSeverity: (severity) => ({ severity }),
  tooShort: (minLength) => ({ minLength }),
  tooLong: (maxLength) => ({ maxLength }),
  restoreValue: (label) => ({ label }),
  fieldHelp: (label) => ({ label }),
  fieldActions: (label) => ({ label }),
  rangeUnderflow: (minimum) => ({ minimum }),
  rangeOverflow: (maximum) => ({ maximum }),
  stepMismatch: (step) => ({ step }),
  revealValue: (label) => ({ label }),
  characterCount: (count, maxLength) => ({ count, maxLength, hasLimit: maxLength !== undefined }),
  colorPicker: (label) => ({ label }),
  clearValue: (label) => ({ label }),
  selectedValues: (label) => ({ label }),
  createOption: (text) => ({ text }),
  typeToSearch: (minLength) => ({ minLength }),
  duplicateValue: (value) => ({ value }),
  tooManyValues: (maxValues) => ({ maxValues }),
  characterPosition: (position, length) => ({ position, length }),
  dateTooEarly: (minValue) => ({ minValue }),
  dateTooLate: (maxValue) => ({ maxValue }),
  lastPeriod: (period) => ({ period }),
  nextPeriod: (period) => ({ period }),
  signatureStrokes: (count) => ({ count }),
};
