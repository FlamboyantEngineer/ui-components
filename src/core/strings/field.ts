import { defineStrings } from '../message-format.js';
/** Strings of the field base and the field controls. */
interface FieldStrings {
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
  /** Counts chosen files the host's own check could not check, because it failed. */
  rejectedFileUnchecked: (count: number) => string;
  /** States how many files an upload holds at most. */
  fileCountLimit: (count: number) => string;
  /** Names a listed file's drag handle, by the file's name. */
  moveFile: (name: string) => string;
  /** Announces a listed file moved: its position in the list, from 1, and the number of files. */
  fileMoved: (name: string, position: number, count: number) => string;
  /** The command of a file field that takes one file. */
  addFile: string;
  /** The command of a file field that takes several files. */
  addFiles: string;
  /** Titles a file field's committed files that an edit removed. */
  removedFiles: string;
  /** The default title of a problem list. */
  problems: string;
  /** Counts a problem list's problems by severity. */
  problemCount: (errors: number, warnings: number) => string;
  /** Names a problem's severity with the punctuation that leads into its message (`Error:`). */
  problemSeverityLead: (severity: 'error' | 'warning') => string;
  /** A field menu action that puts the field's default value back. */
  setDefault: string;
  /** A field menu action that puts the field's last committed (saved) value back. */
  resetValue: string;
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
  /** The message of an email field whose text is not an email address. */
  emailMismatch: string;
  /** The message of a URL field whose text is not an absolute URL. */
  urlMismatch: string;
  /** Names a button that puts a field's committed value back, from the field's label. */
  restoreValue: (label: string) => string;
  /** Names a field's help button, from the field's label. */
  fieldHelp: (label: string) => string;
  /** Names a field's menu, from the field's label. */
  fieldActions: (label: string) => string;
  /** The message of a number below its minimum, given the formatted minimum. */
  rangeUnderflow: (minimum: string) => string;
  /** The message of typed text that is no number in one of the units a field reads (`mm, cm, or m`). */
  quantityUnreadable: (units: string) => string;
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
  /** Names a list of colour swatches to pick from. */
  colorSwatches: string;
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
  /** Labels an expression field's result, which the host evaluates. */
  expressionResult: string;
  /** Says the host is still evaluating an expression field's source. */
  expressionPending: string;
  /** Marks an expression result evaluated from source that has changed since. */
  expressionStale: string;
  /** Says an expression field has no result, when the host gives no reason. */
  expressionUnavailable: string;
  /** Names a constraint editor's control for one constraint. */
  constraintLabel: (
    name:
      | 'required'
      | 'default'
      | 'minimum'
      | 'maximum'
      | 'minLength'
      | 'maxLength'
      | 'pattern'
      | 'minCount'
      | 'maxCount',
  ) => string;
  /** A choice of a constraint editor's Required control. */
  constraintRequiredChoice: (choice: 'required' | 'optional') => string;
  /** Shown in a constraint's control while the constraint is not set. */
  constraintNotSet: string;
  /** Names the button that unsets a constraint, from the constraint's label. */
  constraintUnset: (label: string) => string;
  /** Says why a constraint does not hold together with the others. */
  constraintIssue: (
    reason:
      | 'notNumber'
      | 'boundsReversed'
      | 'lengthsReversed'
      | 'countsReversed'
      | 'defaultBelowMinimum'
      | 'defaultAboveMaximum'
      | 'defaultTooShort'
      | 'defaultTooLong'
      | 'patternInvalid'
      | 'defaultPatternMismatch',
  ) => string;
  /** The text of a select that has no value and no placeholder of its own. */
  selectPlaceholder: string;
  /** Describes a multiple select option with mixed membership across records. */
  selectOptionIndeterminate: string;
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
  /** Names a time field's button that steps its chosen part, such as the hour, one step later. */
  timeLater: string;
  /** Names a time field's button that steps its chosen part one step earlier. */
  timeEarlier: string;
  /** Names the time columns of a time or a date and time. */
  timeOfDay: string;
  /** Names the time columns of a range's start. */
  startTime: string;
  /** Names the time columns of a range's end. */
  endTime: string;
  /** Names the column of hours in a time picker. */
  hoursColumn: string;
  /** Names the column of minutes in a time picker. */
  minutesColumn: string;
  /** Names the column of seconds in a time picker. */
  secondsColumn: string;
  /** Names the column of the day periods (AM and PM) in a time picker. */
  dayPeriodColumn: string;
  /** The message of a date or time earlier than the field allows. */
  dateTooEarly: (minValue: string) => string;
  /** The message of a date or time later than the field allows. */
  dateTooLate: (maxValue: string) => string;
  /** The message of a date the field does not offer, such as a holiday. */
  dateUnavailable: string;
  /** The message of a date or time typed only in part, or of a range with one end left empty. */
  dateIncomplete: string;
  /** The message of a value the field cannot read as a date or time of its mode, such as `2026-02-30`. */
  dateUnreadable: string;
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
  /** The signature pad's choice that gives the signature as an uploaded or pasted image. */
  signatureImage: string;
  /** Chooses an image file as the signature. */
  uploadSignatureImage: string;
  /** Pastes the clipboard's image as the signature. */
  pasteSignatureImage: string;
  /** Deletes a signature pad's image, from its field menu. */
  deleteSignatureImage: string;
  /** Shown in a signature pad's empty image area, and describes it. */
  signatureImageEmpty: string;
  /** Refuses a signature image of a type the pad does not take. */
  signatureImageType: string;
  /** Refuses a signature image larger than the limit, from the formatted size. */
  signatureImageSize: (size: string) => string;
  /** Refuses a signature image the browser cannot decode. */
  signatureImageUnreadable: string;
  /** Says that a paste held no image. */
  signatureImageNoPaste: string;
  /** Names the end thumb of a range slider, read before the slider's label. */
  rangeMaximum: string;
  /** Names a rating, or one choice of a rating field, from the value and the highest value. */
  ratingValue: (value: number, max: number) => string;
  /** Names a rating that has no value. */
  ratingNone: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const fieldStrings = defineStrings<FieldStrings>({
  fileSizeLimit: (size) => ({ size }),
  rejectedFileType: (count) => ({ count }),
  rejectedFileSize: (count) => ({ count }),
  rejectedFileSmall: (count) => ({ count }),
  rejectedFileCount: (count) => ({ count }),
  rejectedFileReason: (name, reason) => ({ name, reason }),
  rejectedFileUnchecked: (count) => ({ count }),
  fileCountLimit: (count) => ({ count }),
  moveFile: (name) => ({ name }),
  fileMoved: (name, position, count) => ({ name, position, count }),
  problemCount: (errors, warnings) => ({ errors, warnings }),
  problemSeverityLead: (severity) => ({ severity }),
  tooShort: (minLength) => ({ minLength }),
  tooLong: (maxLength) => ({ maxLength }),
  restoreValue: (label) => ({ label }),
  fieldHelp: (label) => ({ label }),
  fieldActions: (label) => ({ label }),
  rangeUnderflow: (minimum) => ({ minimum }),
  quantityUnreadable: (units) => ({ units }),
  rangeOverflow: (maximum) => ({ maximum }),
  stepMismatch: (step) => ({ step }),
  revealValue: (label) => ({ label }),
  characterCount: (count, maxLength) => ({ count, maxLength, hasLimit: maxLength !== undefined }),
  colorPicker: (label) => ({ label }),
  clearValue: (label) => ({ label }),
  constraintLabel: (name) => ({ name }),
  constraintRequiredChoice: (choice) => ({ choice }),
  constraintUnset: (label) => ({ label }),
  constraintIssue: (reason) => ({ reason }),
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
  signatureImageSize: (size) => ({ size }),
  ratingValue: (value, max) => ({ value, max }),
});
