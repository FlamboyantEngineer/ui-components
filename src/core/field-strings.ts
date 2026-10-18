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

export const fieldStrings: FieldStrings = {
  browse: 'Browse',
  fileSizeLimit: (size) => `Up to ${size}`,
  rejectedFileType: (count) =>
    count === 1 ? '1 file is not an accepted type.' : `${count} files are not an accepted type.`,
  rejectedFileSize: (count) =>
    count === 1 ? '1 file is too large.' : `${count} files are too large.`,
  rejectedFileSmall: (count) =>
    count === 1 ? '1 file is too small.' : `${count} files are too small.`,
  rejectedFileCount: (count) =>
    count === 1 ? '1 file is over the file limit.' : `${count} files are over the file limit.`,
  rejectedFileReason: (name, reason) => `${name}: ${reason}`,
  fileCountLimit: (count) => (count === 1 ? 'One file' : `Up to ${count} files`),
  setDefault: 'Set to default',
  valueRequired: 'A value is required.',
  validating: 'Validating',
  tooShort: (minLength) =>
    minLength === 1 ? 'Use at least 1 character.' : `Use at least ${minLength} characters.`,
  tooLong: (maxLength) =>
    maxLength === 1 ? 'Use 1 character or fewer.' : `Use ${maxLength} characters or fewer.`,
  patternMismatch: 'Enter a value in the expected format.',
  restoreValue: (label) => `Restore ${label}`,
  fieldHelp: (label) => `Help for ${label}`,
  fieldActions: (label) => `${label} actions`,
  rangeUnderflow: (minimum) => `Enter ${minimum} or more.`,
  rangeOverflow: (maximum) => `Enter ${maximum} or less.`,
  stepMismatch: (step) => `Enter a value in steps of ${step}.`,
  clearSearch: 'Clear search',
  revealValue: (label) => `Show ${label}`,
  characterCount: (count, maxLength) =>
    maxLength === undefined ? String(count) : `${count}/${maxLength}`,
  valueTrue: 'True',
  valueFalse: 'False',
  valueUnset: 'Unset',
  noColor: 'No color',
  hexColor: 'Hex color',
  colorFormat: 'Color format',
  colorPicker: (label) => `${label} picker`,
  pickScreenColor: 'Pick a color from the screen',
  remove: 'Remove',
  clearValue: (label) => `Clear ${label}`,
  selectPlaceholder: 'Select an option',
  selectedValues: (label) => `${label} selected values`,
  createOption: (text) => `Add “${text}”`,
  typeToSearch: (minLength) =>
    minLength === 1 ? 'Type to search.' : `Type at least ${minLength} characters to search.`,
  searchFailed: 'Search is unavailable.',
  recentPeople: 'Recent',
  currentPerson: '(you)',
  duplicateValue: (value) => `“${value}” is already added.`,
  tooManyValues: (maxValues) =>
    maxValues === 1 ? 'Add up to 1 value.' : `Add up to ${maxValues} values.`,
  characterPosition: (position, length) => `Character ${position} of ${length}`,
  today: 'Today',
  now: 'Now',
  dateTooEarly: (minValue) => `Choose a value on or after ${minValue}.`,
  dateTooLate: (maxValue) => `Choose a value on or before ${maxValue}.`,
  dateUnavailable: 'Choose an available date.',
  lastPeriod: (period) => `Last ${period}`,
  nextPeriod: (period) => `Next ${period}`,
  rangeMinimum: 'Minimum',
  signatureMethod: 'Signature method',
  signatureDraw: 'Draw',
  signatureType: 'Type',
  signatureTypePlaceholder: 'Type your name',
  signatureStrokes: (count) =>
    count === 0
      ? 'Drawing area, empty'
      : `Drawing area, ${count} ${count === 1 ? 'stroke' : 'strokes'}`,
  undoStroke: 'Undo stroke',
  rangeMaximum: 'Maximum',
};
